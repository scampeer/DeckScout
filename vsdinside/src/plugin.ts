import WebSocket from 'ws';
import type { RawData } from 'ws';
import { buildDisplay, buildSvg, fetchEntries, type Display, type PluginSettings, withDefaults } from './common';

type ActionState = { settings: Required<PluginSettings>; timer?: ReturnType<typeof setTimeout> };
type IncomingEvent = { event: string; action?: string; context?: string; payload?: any };

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
    const display = buildDisplay(settings, entries);
    await renderState(context, settings, display);
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

