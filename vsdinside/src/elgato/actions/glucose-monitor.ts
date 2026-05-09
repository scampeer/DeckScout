import { action, KeyDownEvent, SingletonAction, type DidReceiveSettingsEvent, type KeyAction, type SendToPluginEvent, type WillAppearEvent, type WillDisappearEvent } from '@elgato/streamdeck';
import { buildDisplay, buildSvg, fetchEntries, type Display, type PluginSettings, withDefaults } from '../../common';

function sourceTypeForAction(actionUUID: string): PluginSettings['sourceType'] | undefined {
  const lower = actionUUID.toLowerCase();
  if (lower.includes('dexcom')) return 'dexcomShare';
  if (lower.includes('nightscout')) return 'nightscout';
  return undefined;
}

function applyActionDefaults(settings: PluginSettings | undefined, actionUUID: string): Required<PluginSettings> {
  const forcedSourceType = sourceTypeForAction(actionUUID);
  return withDefaults(forcedSourceType ? { ...(settings ?? {}), sourceType: forcedSourceType } : settings);
}

type ActionState = { settings: Required<PluginSettings>; timer?: ReturnType<typeof setTimeout> };

@action({ UUID: 'ai.openclaw.deckscout.elgato.nightscout' })
@action({ UUID: 'ai.openclaw.deckscout.elgato.dexcom' })
export class GlucoseMonitorAction extends SingletonAction<PluginSettings> {
  private readonly states = new Map<string, ActionState>();

  override async onWillAppear(ev: WillAppearEvent<PluginSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const settings = applyActionDefaults(ev.payload.settings, ev.action.manifestId);
    this.states.set(ev.action.id, { settings });
    await this.refresh(ev.action);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<PluginSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const current = this.states.get(ev.action.id);
    const settings = applyActionDefaults(ev.payload.settings ?? current?.settings, ev.action.manifestId);
    this.states.set(ev.action.id, { ...(current ?? { settings }), settings });
    await this.refresh(ev.action);
  }

  override async onSendToPlugin(ev: SendToPluginEvent<PluginSettings, PluginSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const current = this.states.get(ev.action.id);
    const settings = applyActionDefaults({ ...(current?.settings ?? {}), ...(ev.payload ?? {}) }, ev.action.manifestId);
    this.states.set(ev.action.id, { ...(current ?? { settings }), settings });
    await this.refresh(ev.action);
  }

  override async onKeyDown(ev: KeyDownEvent<PluginSettings>): Promise<void> {
    await this.refresh(ev.action, true);
  }

  override async onWillDisappear(ev: WillDisappearEvent<PluginSettings>): Promise<void> {
    this.clearTimer(ev.action.id);
    this.states.delete(ev.action.id);
  }

  private async refresh(action: KeyAction<PluginSettings>, manual = false): Promise<void> {
    const actionId = action.id;
    this.clearTimer(actionId);
    const state = this.states.get(actionId);
    if (!state) return;
    const settings = state.settings;

    if (settings.sourceType === 'nightscout' && !settings.baseUrl) {
      await this.renderState(action, settings, { state: 'setup', value: 'Setup', line2: 'Nightscout', footer: 'URL needed', divider: true });
      this.schedule(action);
      return;
    }

    if (settings.sourceType === 'dexcomShare' && (!settings.dexcomPassword || (!settings.dexcomUsername && !settings.dexcomAccountId))) {
      await this.renderState(action, settings, { state: 'setup', value: 'Setup', line2: 'Dexcom', footer: 'Login needed', divider: true });
      this.schedule(action);
      return;
    }

    try {
      const entries = await fetchEntries(settings);
      const display = buildDisplay(settings, entries);
      await this.renderState(action, settings, display);
      if (manual) await action.showOk();
    } catch (error) {
      console.error('DeckScout Elgato refresh failed', error);
      const raw = error instanceof Error ? error.message : String(error);
      const short = raw.replace(/^Dexcom:\s*/i, '').slice(0, 18);
      await this.renderState(action, settings, {
        state: 'error',
        value: 'Err',
        line2: settings.sourceType === 'dexcomShare' ? short || 'Dexcom fail' : 'Fetch fail',
        footer: settings.sourceType === 'dexcomShare' ? 'See key text' : 'Check URL',
        divider: true,
      });
    }

    this.schedule(action);
  }

  private async renderState(action: KeyAction<PluginSettings>, settings: Required<PluginSettings>, display: Display): Promise<void> {
    await action.setTitle('');
    const svg = buildSvg(display, settings);
    const b64 = Buffer.from(svg).toString('base64');
    await action.setImage(`data:image/svg+xml;base64,${b64}`);
  }

  private schedule(action: KeyAction<PluginSettings>): void {
    const state = this.states.get(action.id);
    if (!state) return;
    state.timer = setTimeout(() => void this.refresh(action), Math.max(60, state.settings.pollSeconds) * 1000);
  }

  private clearTimer(actionId: string): void {
    const state = this.states.get(actionId);
    if (state?.timer) {
      clearTimeout(state.timer);
      state.timer = undefined;
    }
  }
}
