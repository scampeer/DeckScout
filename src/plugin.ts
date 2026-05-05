import WebSocket from 'ws';
import type { RawData } from 'ws';

type TrendArrow = '↑' | '↗' | '→' | '↘' | '↓' | '??';
type DisplayUnit = 'mgdl' | 'mmol';
type ReadingState = 'ok' | 'low' | 'high' | 'stale' | 'nodata' | 'error' | 'setup';

type PluginSettings = {
  baseUrl?: string;
  lowThreshold?: number;
  highThreshold?: number;
  staleMinutes?: number;
  pollSeconds?: number;
  showDelta?: boolean;
  unit?: DisplayUnit;
  compactMode?: boolean;
};

type Entry = {
  sgv?: number;
  direction?: string;
  date?: number;
  dateString?: string;
};

type Display = { state: ReadingState; value: string; line2: string; footer: string; divider?: boolean };
type ActionState = { settings: Required<PluginSettings>; timer?: ReturnType<typeof setTimeout> };
type IncomingEvent = { event: string; action?: string; context?: string; payload?: any };

const DEFAULTS: Required<PluginSettings> = {
  baseUrl: '',
  lowThreshold: 80,
  highThreshold: 180,
  staleMinutes: 15,
  pollSeconds: 305,
  showDelta: true,
  unit: 'mgdl',
  compactMode: false,
};

const DIRECTION_MAP: Record<string, TrendArrow> = {
  DoubleUp: '↑', SingleUp: '↑', FortyFiveUp: '↗', Flat: '→', FortyFiveDown: '↘', SingleDown: '↓', DoubleDown: '↓',
  NONE: '??', NOT_COMPUTABLE: '??', RATE_OUT_OF_RANGE: '??',
};

const STATE_COLORS: Record<ReadingState, { bg: string; accent: string; text: string; subtext: string }> = {
  ok: { bg: '#10261a', accent: '#22c55e', text: '#ecfdf5', subtext: '#bbf7d0' },
  low: { bg: '#3a0d15', accent: '#ef4444', text: '#fff1f2', subtext: '#fecdd3' },
  high: { bg: '#3b2305', accent: '#f59e0b', text: '#fffbeb', subtext: '#fde68a' },
  stale: { bg: '#1f2937', accent: '#9ca3af', text: '#f9fafb', subtext: '#d1d5db' },
  nodata: { bg: '#1f2937', accent: '#60a5fa', text: '#eff6ff', subtext: '#bfdbfe' },
  error: { bg: '#3b0a18', accent: '#f43f5e', text: '#fff1f2', subtext: '#fecdd3' },
  setup: { bg: '#172554', accent: '#60a5fa', text: '#eff6ff', subtext: '#bfdbfe' },
};

const port = process.argv[3];
const pluginUUID = process.argv[5];
const registerEvent = process.argv[7];
const ws = new WebSocket(`ws://127.0.0.1:${port}`);
const actions = new Map<string, ActionState>();

ws.on('open', () => {
  ws.send(JSON.stringify({ uuid: pluginUUID, event: registerEvent }));
});

ws.on('message', (buf: RawData) => {
  try {
    const data = JSON.parse(buf.toString()) as IncomingEvent;
    void handleEvent(data);
  } catch (error) {
    console.error('DeckScout parse error', error);
  }
});

ws.on('error', (error: Error) => {
  console.error('DeckScout websocket error', error);
});

async function handleEvent(data: IncomingEvent): Promise<void> {
  const context = data.context;
  switch (data.event) {
    case 'willAppear': {
      if (!context) return;
      const settings = withDefaults(data.payload?.settings);
      actions.set(context, { settings });
      await refresh(context);
      break;
    }
    case 'didReceiveSettings': {
      if (!context) return;
      const current = actions.get(context);
      const settings = withDefaults(data.payload?.settings ?? current?.settings);
      actions.set(context, { ...(current ?? { settings }), settings });
      await refresh(context);
      break;
    }
    case 'willDisappear': {
      if (!context) return;
      clearTimer(context);
      actions.delete(context);
      break;
    }
    case 'keyDown': {
      if (!context) return;
      await refresh(context, true);
      break;
    }
    case 'sendToPlugin': {
      if (!context) return;
      const current = actions.get(context);
      const settings = withDefaults({ ...(current?.settings ?? {}), ...(data.payload ?? {}) });
      actions.set(context, { ...(current ?? { settings }), settings });
      await refresh(context);
      break;
    }
    default:
      break;
  }
}

async function refresh(context: string, manual = false): Promise<void> {
  clearTimer(context);
  const state = actions.get(context);
  if (!state) return;
  const settings = state.settings;

  if (!settings.baseUrl) {
    await renderState(context, settings, { state: 'setup', value: 'Setup', line2: 'Nightscout', footer: 'URL needed', divider: true });
    schedule(context);
    return;
  }

  try {
    const entries = await fetchEntries(settings);
    const latest = entries[0];
    const previous = entries[1];

    if (latest?.sgv == null) {
      await renderState(context, settings, { state: 'nodata', value: '--', line2: 'No data', footer: 'Waiting', divider: true });
      schedule(context);
      return;
    }

    const ageMinutes = ageMinutesFor(latest);
    const stale = ageMinutes >= settings.staleMinutes;
    const trend = DIRECTION_MAP[latest.direction ?? ''] ?? '??';
    const delta = settings.showDelta && previous?.sgv != null ? latest.sgv - previous.sgv : undefined;
    const displayState: ReadingState = stale ? 'stale' : latest.sgv < settings.lowThreshold ? 'low' : latest.sgv > settings.highThreshold ? 'high' : 'ok';
    const value = formatValue(latest.sgv, settings.unit);
    const renderedDelta = delta == null ? '' : formatDelta(delta, settings.unit);
    const footer = stale ? `STALE ${ageMinutes}m` : `${ageMinutes}m ago`;
    const line2 = settings.compactMode
      ? renderedDelta
        ? `${trend} ${renderedDelta}`
        : trend
      : renderedDelta
        ? `${trend} ${renderedDelta}`
        : `${trend} ${settings.unit === 'mmol' ? 'mmol/L' : 'mg/dL'}`;

    await renderState(context, settings, { state: displayState, value, line2, footer, divider: !settings.compactMode });
    if (manual) showOk(context);
  } catch (error) {
    console.error('DeckScout refresh failed', error);
    await renderState(context, settings, { state: 'error', value: 'Err', line2: 'Fetch fail', footer: 'Check URL', divider: true });
  }

  schedule(context);
}

async function renderState(context: string, settings: Required<PluginSettings>, display: Display): Promise<void> {
  setTitle(context, '');
  setImage(context, buildSvg(display, settings));
}

function schedule(context: string): void {
  const state = actions.get(context);
  if (!state) return;
  state.timer = setTimeout(() => void refresh(context), Math.max(60, state.settings.pollSeconds) * 1000);
}

function clearTimer(context: string): void {
  const state = actions.get(context);
  if (state?.timer) {
    clearTimeout(state.timer);
    state.timer = undefined;
  }
}

async function fetchEntries(settings: Required<PluginSettings>): Promise<Entry[]> {
  const base = settings.baseUrl.replace(/\/$/, '');
  const url = new URL(`${base}/api/v1/entries.json`);
  url.searchParams.set('count', '2');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Nightscout returned ${response.status}`);
  return (await response.json()) as Entry[];
}

function setTitle(context: string, title: string): void {
  ws.send(JSON.stringify({ event: 'setTitle', context, payload: { target: 0, title } }));
}

function setImage(context: string, svg: string): void {
  const dataUri = `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`;
  ws.send(JSON.stringify({ event: 'setImage', context, payload: { target: 0, image: dataUri } }));
}

function showOk(context: string): void {
  ws.send(JSON.stringify({ event: 'showOk', context }));
}

function buildSvg(display: Display, settings: Required<PluginSettings>): string {
  const palette = STATE_COLORS[display.state];
  const titleSize = display.value.length >= 6 ? 28 : display.value.length >= 5 ? 33 : display.value.length >= 4 ? 38 : 44;
  const line2Size = display.line2.length >= 12 ? 16 : display.line2.length >= 9 ? 18 : 20;
  const footerSize = display.footer.length >= 10 ? 13 : 15;
  const valueY = settings.compactMode ? 60 : 56;
  const line2Y = settings.compactMode ? 90 : 87;
  const dividerY = 101;
  const footerY = 121;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><rect width="144" height="144" rx="24" fill="${palette.bg}"/><rect x="10" y="10" width="124" height="124" rx="18" fill="none" stroke="${palette.accent}" stroke-width="4" opacity="0.85"/><circle cx="118" cy="26" r="7" fill="${palette.accent}"/><text x="72" y="${valueY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="${palette.text}">${escapeXml(display.value)}</text><text x="72" y="${line2Y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${line2Size}" font-weight="600" fill="${palette.subtext}">${escapeXml(display.line2)}</text>${display.divider === false ? '' : `<line x1="24" y1="${dividerY}" x2="120" y2="${dividerY}" stroke="${palette.accent}" opacity="0.35"/>`}<text x="72" y="${footerY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${footerSize}" fill="${palette.text}">${escapeXml(display.footer)}</text></svg>`;
}

function ageMinutesFor(entry: Entry): number {
  const ts = entry.date ?? Date.parse(entry.dateString ?? '');
  if (!ts || Number.isNaN(ts)) return 999;
  return Math.max(0, Math.round((Date.now() - ts) / 60000));
}

function formatValue(sgv: number, unit: DisplayUnit): string {
  return unit === 'mmol' ? (sgv / 18).toFixed(1) : String(Math.round(sgv));
}

function formatDelta(delta: number, unit: DisplayUnit): string {
  if (unit === 'mmol') {
    const mmol = delta / 18;
    return `${mmol >= 0 ? '+' : ''}${mmol.toFixed(1)}`;
  }
  return `${delta >= 0 ? '+' : ''}${Math.round(delta)}`;
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function withDefaults(settings?: PluginSettings): Required<PluginSettings> {
  return {
    ...DEFAULTS,
    ...settings,
    lowThreshold: Number(settings?.lowThreshold ?? DEFAULTS.lowThreshold),
    highThreshold: Number(settings?.highThreshold ?? DEFAULTS.highThreshold),
    staleMinutes: Number(settings?.staleMinutes ?? DEFAULTS.staleMinutes),
    pollSeconds: Number(settings?.pollSeconds ?? DEFAULTS.pollSeconds),
    showDelta: settings?.showDelta ?? DEFAULTS.showDelta,
    unit: settings?.unit === 'mmol' ? 'mmol' : 'mgdl',
    compactMode: settings?.compactMode ?? DEFAULTS.compactMode,
  };
}
