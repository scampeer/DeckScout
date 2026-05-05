export type TrendArrow = '↑' | '↗' | '→' | '↘' | '↓' | '??';
export type DisplayUnit = 'mgdl' | 'mmol';
export type ReadingState = 'ok' | 'low' | 'high' | 'stale' | 'nodata' | 'error' | 'setup';

export type PluginSettings = {
  baseUrl?: string;
  lowThreshold?: number;
  highThreshold?: number;
  staleMinutes?: number;
  pollSeconds?: number;
  showDelta?: boolean;
  unit?: DisplayUnit;
  compactMode?: boolean;
};

export type Entry = {
  sgv?: number;
  direction?: string;
  date?: number;
  dateString?: string;
};

export type Display = { state: ReadingState; value: string; line2: string; footer: string; divider?: boolean };

export const DEFAULTS: Required<PluginSettings> = {
  baseUrl: '',
  lowThreshold: 80,
  highThreshold: 180,
  staleMinutes: 15,
  pollSeconds: 305,
  showDelta: true,
  unit: 'mgdl',
  compactMode: false,
};

export const DIRECTION_MAP: Record<string, TrendArrow> = {
  DoubleUp: '↑', SingleUp: '↑', FortyFiveUp: '↗', Flat: '→', FortyFiveDown: '↘', SingleDown: '↓', DoubleDown: '↓',
  NONE: '??', NOT_COMPUTABLE: '??', RATE_OUT_OF_RANGE: '??',
};

export const STATE_COLORS: Record<ReadingState, { bg: string; accent: string; text: string; subtext: string }> = {
  ok: { bg: '#10261a', accent: '#22c55e', text: '#ecfdf5', subtext: '#bbf7d0' },
  low: { bg: '#3a0d15', accent: '#ef4444', text: '#fff1f2', subtext: '#fecdd3' },
  high: { bg: '#3b2305', accent: '#f59e0b', text: '#fffbeb', subtext: '#fde68a' },
  stale: { bg: '#1f2937', accent: '#9ca3af', text: '#f9fafb', subtext: '#d1d5db' },
  nodata: { bg: '#1f2937', accent: '#60a5fa', text: '#eff6ff', subtext: '#bfdbfe' },
  error: { bg: '#3b0a18', accent: '#f43f5e', text: '#fff1f2', subtext: '#fecdd3' },
  setup: { bg: '#172554', accent: '#60a5fa', text: '#eff6ff', subtext: '#bfdbfe' },
};

export function withDefaults(settings?: PluginSettings): Required<PluginSettings> {
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

export async function fetchEntries(settings: Required<PluginSettings>): Promise<Entry[]> {
  const base = settings.baseUrl.replace(/\/$/, '');
  const url = new URL(`${base}/api/v1/entries.json`);
  url.searchParams.set('count', '2');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Nightscout returned ${response.status}`);
  return (await response.json()) as Entry[];
}

export function buildDisplay(settings: Required<PluginSettings>, entries: Entry[]): Display {
  const latest = entries[0];
  const previous = entries[1];

  if (latest?.sgv == null) {
    return { state: 'nodata', value: '--', line2: 'No data', footer: 'Waiting', divider: true };
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

  return { state: displayState, value, line2, footer, divider: !settings.compactMode };
}

export function buildSvg(display: Display, settings: Required<PluginSettings>): string {
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
