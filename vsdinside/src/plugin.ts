import WebSocket from 'ws';
import type { RawData } from 'ws';
import { FAST_POLL_INTERVAL_MS, buildDisplay, buildSvg, fetchEntries, getEntryTimestamp, getPollIntervalMs, type Display, type PluginSettings, withDefaults } from './common';

type ActionState = {
  settings: Required<PluginSettings>;
  timer?: ReturnType<typeof setTimeout>;
  nextRunAt?: number;
  inFlight?: boolean;
  pendingRefresh?: boolean;
  fastPolling?: boolean;
  lastEntryDate?: number | null;
  hydrated?: boolean;
};
type IncomingEvent = { event: string; action?: string; context?: string; payload?: any };

function sourceTypeForAction(action?: string): PluginSettings['sourceType'] | undefined {
  if (!action) return undefined;
  const lower = action.toLowerCase();
  if (lower.includes('dexcom')) return 'dexcomShare';
  if (lower.includes('nightscout') || lower.endsWith('.monitor')) return 'nightscout';
  return undefined;
}

function applyActionDefaults(settings: PluginSettings | undefined, action?: string): Required<PluginSettings> {
  const forcedSourceType = sourceTypeForAction(action);
  return withDefaults(forcedSourceType ? { ...(settings ?? {}), sourceType: forcedSourceType } : settings);
}

const port = process.argv[3];
const pluginUUID = process.argv[5];
const registerEvent = process.argv[7];
const ws = new WebSocket(`ws://127.0.0.1:${port}`);
const actions = new Map<string, ActionState>();

ws.on('open', () => {
  ws.send(JSON.stringify({ uuid: pluginUUID, event: registerEvent }));
});

function requestSettings(context: string): void {
  ws.send(JSON.stringify({ event: 'getSettings', context }));
}

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
      const settings = applyActionDefaults(data.payload?.settings, data.action);
      actions.set(context, { settings, inFlight: false, fastPolling: true, hydrated: true });
      requestSettings(context);
      restartCadence(context, Date.now());
      await refresh(context);
      break;
    }
    case 'didReceiveSettings': {
      if (!context) return;
      const current = actions.get(context);
      const settings = applyActionDefaults(data.payload?.settings ?? current?.settings, data.action);
      actions.set(context, { ...(current ?? { settings, inFlight: false, fastPolling: true }), settings, hydrated: true });
      restartCadence(context, Date.now());
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
      const incoming = data.payload?.settings ?? data.payload ?? {};
      const settings = applyActionDefaults({ ...(current?.settings ?? {}), ...incoming }, data.action);
      actions.set(context, {
        ...(current ?? { settings, inFlight: false, fastPolling: true }),
        settings,
        fastPolling: true,
        hydrated: true,
      });
      restartCadence(context, Date.now());
      await refresh(context);
      break;
    }
    default:
      break;
  }
}

async function refresh(context: string, manual = false): Promise<void> {
  const state = actions.get(context);
  if (!state) return;
  if (state.inFlight) {
    state.pendingRefresh = true;
    return;
  }

  requestSettings(context);

  state.inFlight = true;
  state.pendingRefresh = false;
  const settings = state.settings;

  try {
    if (settings.sourceType === 'nightscout' && !settings.baseUrl) {
      const display: Display = { state: 'setup', value: 'Setup', line2: 'Nightscout', footer: 'URL needed', divider: true };
      await renderState(context, settings, display);
      syncCadence(context, display.state, null, false);
      return;
    }

    if (settings.sourceType === 'dexcomShare' && !settings.dexcomPassword) {
      const display: Display = { state: 'setup', value: 'Setup', line2: 'Dexcom', footer: 'Creds needed', divider: true };
      await renderState(context, settings, display);
      syncCadence(context, display.state, null, false);
      return;
    }

    const entries = await fetchEntries(settings);
    const latestEntryDate = getEntryTimestamp(entries[0]);
    const previousEntryDate = state.lastEntryDate;
    const display = buildDisplay(settings, entries);
    const sawNewEntry = latestEntryDate != null && previousEntryDate != null && latestEntryDate !== previousEntryDate;
    if (latestEntryDate != null) state.lastEntryDate = latestEntryDate;
    await renderState(context, settings, display);
    syncCadence(context, display.state, latestEntryDate, sawNewEntry);
    if (manual) showOk(context);
  } catch (error) {
    console.error('DeckScout refresh failed', error);
    const message = error instanceof Error ? error.message : 'Fetch failed';
    const isDexcom = settings.sourceType === 'dexcomShare';
    const footer = isDexcom
      ? message.includes('rate-limited') ? 'Wait + retry' : message.includes('login') ? 'Check creds' : message.includes('session') ? 'Retry login' : 'Check Share'
      : 'Check URL';
    const line2 = isDexcom ? 'Dexcom fail' : 'Fetch fail';
    await renderState(context, settings, { state: 'error', value: 'Err', line2, footer, divider: true, sourceLabel: isDexcom ? 'DEXCOM' : 'NIGHTSCOUT' });
    syncCadence(context, 'error', null, false);
  } finally {
    const latest = actions.get(context);
    if (!latest) return;
    latest.inFlight = false;
    if (latest.pendingRefresh) {
      latest.pendingRefresh = false;
      queueMicrotask(() => void refresh(context));
    }
  }
}

async function renderState(context: string, settings: Required<PluginSettings>, display: Display): Promise<void> {
  setTitle(context, '');
  setImage(context, buildSvg(display, settings));
}

function restartCadence(context: string, anchorMs: number): void {
  const state = actions.get(context);
  if (!state) return;
  clearTimer(context);
  state.nextRunAt = anchorMs + getActiveIntervalMs(state);
  scheduleAt(context, state.nextRunAt);
}

function scheduleAt(context: string, runAt: number): void {
  const state = actions.get(context);
  if (!state) return;
  clearTimer(context);
  state.timer = setTimeout(() => void handleScheduledTick(context), Math.max(0, runAt - Date.now()));
}

async function handleScheduledTick(context: string): Promise<void> {
  const state = actions.get(context);
  if (!state) return;

  const previousNextRunAt = state.nextRunAt ?? Date.now();
  state.nextRunAt = previousNextRunAt + getActiveIntervalMs(state);
  scheduleAt(context, state.nextRunAt);

  if (state.inFlight) {
    state.pendingRefresh = true;
    return;
  }
  await refresh(context);
}

function clearTimer(context: string): void {
  const state = actions.get(context);
  if (state?.timer) {
    clearTimeout(state.timer);
    state.timer = undefined;
  }
}

function setTitle(context: string, title: string): void {
  ws.send(JSON.stringify({ event: 'setTitle', context, payload: { target: 0, title } }));
}

function setImage(context: string, svg: string): void {
  const dataUri = `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`;
  ws.send(JSON.stringify({ event: 'setImage', context, payload: { target: 0, image: dataUri } }));
}

function syncCadence(context: string, displayState: Display['state'], latestEntryDate: number | null, sawNewEntry: boolean): void {
  const state = actions.get(context);
  if (!state) return;

  const shouldFastPoll = displayState === 'setup'
    || displayState === 'nodata'
    || displayState === 'error'
    || displayState === 'stale'
    || latestEntryDate == null
    || !sawNewEntry;

  if (state.fastPolling === shouldFastPoll) return;

  state.fastPolling = shouldFastPoll;
  const anchorMs = shouldFastPoll ? Date.now() : (state.lastEntryDate ?? Date.now());
  restartCadence(context, anchorMs);
}

function getActiveIntervalMs(state: ActionState): number {
  return state.fastPolling ? FAST_POLL_INTERVAL_MS : getPollIntervalMs(state.settings);
}

function showOk(context: string): void {
  ws.send(JSON.stringify({ event: 'showOk', context }));
}

