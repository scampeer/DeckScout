export type TrendArrow = '↑' | '↗' | '→' | '↘' | '↓' | '??';
export type DisplayUnit = 'mgdl' | 'mmol';
export type ReadingState = 'ok' | 'low' | 'high' | 'stale' | 'nodata' | 'error' | 'setup';
export type DisplayMode = 'detailed' | 'compact' | 'custom';
export type SourceType = 'nightscout' | 'dexcomShare';
export type DexcomRegion = 'us' | 'ous' | 'jp';

export type PluginSettings = {
  sourceType?: SourceType;
  baseUrl?: string;
  dexcomUsername?: string;
  dexcomPassword?: string;
  dexcomAccountId?: string;
  dexcomRegion?: DexcomRegion;
  lowThreshold?: number;
  highThreshold?: number;
  staleMinutes?: number;
  pollSeconds?: number;
  showDelta?: boolean;
  showTimestamp?: boolean;
  unit?: DisplayUnit;
  compactMode?: boolean;
  displayMode?: DisplayMode;
  okColor?: string;
  lowColor?: string;
  highColor?: string;
  staleColor?: string;
  nodataColor?: string;
  errorColor?: string;
  setupColor?: string;
};

export type Entry = {
  sgv?: number;
  direction?: string;
  date?: number;
  dateString?: string;
};

export type Display = {
  state: ReadingState;
  value: string;
  line2: string;
  footer: string;
  divider?: boolean;
  trendOnly?: boolean;
  hideFooter?: boolean;
  sourceLabel?: string;
};

export const FAST_POLL_INTERVAL_MS = 60 * 1000;

export const DEFAULTS: Required<PluginSettings> = {
  sourceType: 'nightscout',
  baseUrl: '',
  dexcomUsername: '',
  dexcomPassword: '',
  dexcomAccountId: '',
  dexcomRegion: 'us',
  lowThreshold: 80,
  highThreshold: 180,
  staleMinutes: 15,
  pollSeconds: 305,
  showDelta: true,
  showTimestamp: true,
  unit: 'mgdl',
  compactMode: false,
  displayMode: 'detailed',
  okColor: '#166534',
  lowColor: '#991b1b',
  highColor: '#92400e',
  staleColor: '#4b5563',
  nodataColor: '#1d4ed8',
  errorColor: '#9f1239',
  setupColor: '#1e3a8a',
};

export const DIRECTION_MAP: Record<string, TrendArrow> = {
  DoubleUp: '↑', SingleUp: '↑', FortyFiveUp: '↗', Flat: '→', FortyFiveDown: '↘', SingleDown: '↓', DoubleDown: '↓',
  NONE: '??', NOT_COMPUTABLE: '??', RATE_OUT_OF_RANGE: '??', None: '??', NotComputable: '??', RateOutOfRange: '??',
};

export const STATE_COLORS: Record<ReadingState, { bg: string; accent: string; text: string; subtext: string }> = {
  ok: { bg: '#166534', accent: '#86efac', text: '#f0fdf4', subtext: '#dcfce7' },
  low: { bg: '#991b1b', accent: '#fca5a5', text: '#fef2f2', subtext: '#fee2e2' },
  high: { bg: '#92400e', accent: '#fcd34d', text: '#fffbeb', subtext: '#fde68a' },
  stale: { bg: '#4b5563', accent: '#d1d5db', text: '#f9fafb', subtext: '#e5e7eb' },
  nodata: { bg: '#1d4ed8', accent: '#93c5fd', text: '#eff6ff', subtext: '#dbeafe' },
  error: { bg: '#9f1239', accent: '#fda4af', text: '#fff1f2', subtext: '#ffe4e6' },
  setup: { bg: '#1e3a8a', accent: '#93c5fd', text: '#eff6ff', subtext: '#dbeafe' },
};

const DEXCOM_BASE_URLS: Record<DexcomRegion, string> = {
  us: 'https://share2.dexcom.com/ShareWebServices/Services/',
  ous: 'https://shareous1.dexcom.com/ShareWebServices/Services/',
  jp: 'https://share.dexcom.jp/ShareWebServices/Services/',
};

const DEXCOM_APPLICATION_IDS: Record<DexcomRegion, string> = {
  us: 'd89443d2-327c-4a6f-89e5-496bbb0317db',
  ous: 'd89443d2-327c-4a6f-89e5-496bbb0317db',
  jp: 'd8665ade-9673-4e27-9ff6-92db4ce13d13',
};

export function withDefaults(settings?: PluginSettings): Required<PluginSettings> {
  const merged = {
    ...DEFAULTS,
    ...settings,
    sourceType: settings?.sourceType === 'dexcomShare' ? 'dexcomShare' : 'nightscout',
    dexcomRegion: settings?.dexcomRegion === 'ous' || settings?.dexcomRegion === 'jp' ? settings.dexcomRegion : 'us',
    lowThreshold: Number(settings?.lowThreshold ?? DEFAULTS.lowThreshold),
    highThreshold: Number(settings?.highThreshold ?? DEFAULTS.highThreshold),
    staleMinutes: Number(settings?.staleMinutes ?? DEFAULTS.staleMinutes),
    pollSeconds: Number(settings?.pollSeconds ?? DEFAULTS.pollSeconds),
    showDelta: settings?.showDelta ?? DEFAULTS.showDelta,
    showTimestamp: settings?.showTimestamp ?? DEFAULTS.showTimestamp,
    unit: settings?.unit === 'mmol' ? 'mmol' : 'mgdl',
    compactMode: settings?.compactMode ?? DEFAULTS.compactMode,
    displayMode: settings?.displayMode === 'compact' || settings?.displayMode === 'custom' ? settings.displayMode : 'detailed',
  } as Required<PluginSettings>;

  if (merged.displayMode === 'detailed') {
    merged.compactMode = false;
    merged.showDelta = true;
    merged.showTimestamp = true;
  } else if (merged.displayMode === 'compact') {
    merged.compactMode = true;
    merged.showDelta = false;
    merged.showTimestamp = false;
  }

  return merged;
}

export function getPollIntervalMs(settings: Required<PluginSettings>): number {
  return Math.max(60, Number(settings.pollSeconds) || DEFAULTS.pollSeconds) * 1000;
}

export function getEntryTimestamp(entry?: Entry): number | null {
  const ts = entry?.date ?? Date.parse(entry?.dateString ?? '');
  return !ts || Number.isNaN(ts) ? null : ts;
}

export async function fetchEntries(settings: Required<PluginSettings>): Promise<Entry[]> {
  return settings.sourceType === 'dexcomShare' ? fetchDexcomEntries(settings) : fetchNightscoutEntries(settings);
}

async function fetchNightscoutEntries(settings: Required<PluginSettings>): Promise<Entry[]> {
  const base = settings.baseUrl.replace(/\/$/, '');
  const url = new URL(`${base}/api/v1/entries.json`);
  url.searchParams.set('count', '2');
  const response = await fetchWithTimeout(url.toString());
  if (!response.ok) throw new Error(`Nightscout returned ${response.status}`);
  return (await response.json()) as Entry[];
}

async function fetchDexcomEntries(settings: Required<PluginSettings>): Promise<Entry[]> {
  if (!settings.dexcomPassword || (!settings.dexcomUsername && !settings.dexcomAccountId)) {
    throw new Error('Dexcom Share credentials incomplete');
  }

  const baseUrl = DEXCOM_BASE_URLS[settings.dexcomRegion];
  const applicationId = DEXCOM_APPLICATION_IDS[settings.dexcomRegion];
  let accountId = settings.dexcomAccountId.trim();

  const getSessionId = async (): Promise<string> => {
    if (!accountId) {
      const auth = await dexcomPost(`${baseUrl}General/AuthenticatePublisherAccount`, {
        accountName: settings.dexcomUsername.trim(),
        password: settings.dexcomPassword,
        applicationId,
      });
      if (typeof auth !== 'string' || !auth || auth === '00000000-0000-0000-0000-000000000000') {
        throw new Error('Dexcom login failed');
      }
      accountId = auth;
    }

    const session = await dexcomPost(`${baseUrl}General/LoginPublisherAccountById`, {
      accountId,
      password: settings.dexcomPassword,
      applicationId,
    });
    if (typeof session !== 'string' || !session || session === '00000000-0000-0000-0000-000000000000') {
      throw new Error('Dexcom session login failed');
    }
    return session;
  };

  let sessionId = await getSessionId();

  const read = async () => dexcomPost(`${baseUrl}Publisher/ReadPublisherLatestGlucoseValues`, undefined, {
    sessionId,
    minutes: 10,
    maxCount: 1,
  });

  let parsed: any;
  try {
    parsed = await read();
  } catch (error) {
    if (error instanceof Error && /session expired|SessionIdNotFound|SessionNotValid/i.test(error.message)) {
      sessionId = await getSessionId();
      parsed = await read();
    } else {
      throw error;
    }
  }

  if (!Array.isArray(parsed)) throw new Error('Dexcom readings response malformed');
  return parsed.map((reading: any) => ({
    sgv: typeof reading?.Value === 'number' ? reading.Value : undefined,
    direction: reading?.Trend,
    date: parseDexcomDate(reading?.WT) ?? parseDexcomDate(reading?.ST) ?? parseDexcomDate(reading?.DT) ?? undefined,
    dateString: typeof reading?.DT === 'string' ? reading.DT : undefined,
  }));
}

async function dexcomPost(url: string, body?: unknown, params?: Record<string, string | number>): Promise<any> {
  const finalUrl = new URL(url);
  if (params) {
    for (const [key, value] of Object.entries(params)) finalUrl.searchParams.set(key, String(value));
  }
  const response = await fetchWithTimeout(finalUrl.toString(), {
    method: 'POST',
    headers: { 'Accept-Encoding': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return parseDexcomJson(response);
}

async function parseDexcomJson(response: Response): Promise<any> {
  const text = await response.text();
  let parsed: any;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw new Error('Dexcom returned invalid JSON');
  }
  if (!response.ok) {
    const message = parsed?.Message || parsed?.Code || `Dexcom returned ${response.status}`;
    throw new Error(normalizeDexcomError(String(message)));
  }
  return parsed;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Request timed out');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseDexcomDate(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const match = /Date\((\d+)/.exec(raw);
  if (match) return Number(match[1]);
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeDexcomError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('accountpasswordinvalid') || m.includes('cannot authenticate')) return 'Dexcom login failed';
  if (m.includes('sessionnotvalid') || m.includes('sessionidnotfound')) return 'Dexcom session expired';
  if (m.includes('sso_authenticatemaxattemptsexceeded') || m.includes('maxattempts')) return 'Dexcom login rate-limited';
  if (m.includes('invalidargument') && m.includes('accountname')) return 'Dexcom username invalid';
  if (m.includes('invalidargument') && m.includes('password')) return 'Dexcom password invalid';
  if (m.includes('invalidargument') && m.includes('uuid')) return 'Dexcom account ID invalid';
  return message.startsWith('Dexcom') ? message : `Dexcom: ${message}`;
}

export function buildDisplay(settings: Required<PluginSettings>, entries: Entry[]): Display {
  const latest = entries[0];
  const previous = entries[1];
  if (latest?.sgv == null) return { state: 'nodata', value: '--', line2: 'No data', footer: 'Waiting', divider: true };
  const ageMinutes = ageMinutesFor(latest);
  const stale = ageMinutes >= settings.staleMinutes;
  const trend = DIRECTION_MAP[latest.direction ?? ''] ?? '??';
  const delta = settings.showDelta && previous?.sgv != null ? latest.sgv - previous.sgv : undefined;
  const displayState: ReadingState = stale ? 'stale' : latest.sgv < settings.lowThreshold ? 'low' : latest.sgv > settings.highThreshold ? 'high' : 'ok';
  const value = formatValue(latest.sgv, settings.unit);
  const renderedDelta = delta == null ? '' : formatDelta(delta, settings.unit);
  const footer = stale ? `STALE ${ageMinutes}m` : `${ageMinutes}m ago`;
  const trendOnly = !settings.showDelta;
  const line2 = renderedDelta ? `${trend} ${renderedDelta}` : trend;
  return { state: displayState, value, line2, footer, divider: !settings.compactMode, trendOnly, hideFooter: !settings.showTimestamp };
}

export function buildSvg(display: Display, settings: Required<PluginSettings>): string {
  const palette = getPalette(settings, display.state);
  const titleSize = display.hideFooter ? (display.value.length >= 6 ? 34 : display.value.length >= 5 ? 39 : display.value.length >= 4 ? 44 : 50) : display.value.length >= 6 ? 28 : display.value.length >= 5 ? 33 : display.value.length >= 4 ? 38 : 44;
  const line2Size = display.trendOnly ? (display.hideFooter ? 42 : 34) : display.line2.length >= 12 ? 16 : display.line2.length >= 9 ? 18 : 20;
  const footerSize = display.footer.length >= 10 ? 13 : 15;
  const valueY = display.hideFooter ? 66 : settings.compactMode ? 60 : 56;
  const line2Y = display.trendOnly ? (display.hideFooter ? 112 : 92) : display.hideFooter ? 102 : settings.compactMode ? 90 : 87;
  const dividerY = 101;
  const footerY = 121;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144"><rect width="144" height="144" rx="24" fill="${palette.bg}"/><rect x="6" y="6" width="132" height="132" rx="22" fill="none" stroke="${palette.accent}" stroke-width="6" opacity="0.9"/><circle cx="118" cy="26" r="7" fill="${palette.accent}"/><text x="72" y="${valueY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="${palette.text}">${escapeXml(display.value)}</text><text x="72" y="${line2Y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${line2Size}" font-weight="700" fill="${palette.subtext}">${escapeXml(display.line2)}</text>${display.hideFooter || display.divider === false || display.trendOnly ? '' : `<line x1="24" y1="${dividerY}" x2="120" y2="${dividerY}" stroke="${palette.accent}" opacity="0.35"/>`}${display.hideFooter ? '' : `<text x="72" y="${footerY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${footerSize}" fill="${palette.text}">${escapeXml(display.footer)}</text>`}</svg>`;
}

function getPalette(settings: Required<PluginSettings>, state: ReadingState) {
  const base = STATE_COLORS[state];
  return { bg: getStateBg(settings, state) || base.bg, accent: base.accent, text: base.text, subtext: base.subtext };
}

function getStateBg(settings: Required<PluginSettings>, state: ReadingState): string | undefined {
  switch (state) {
    case 'ok': return settings.okColor;
    case 'low': return settings.lowColor;
    case 'high': return settings.highColor;
    case 'stale': return settings.staleColor;
    case 'nodata': return settings.nodataColor;
    case 'error': return settings.errorColor;
    case 'setup': return settings.setupColor;
  }
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
  if (unit === 'mmol') return `${delta / 18 >= 0 ? '+' : ''}${(delta / 18).toFixed(1)}`;
  return `${delta >= 0 ? '+' : ''}${Math.round(delta)}`;
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
