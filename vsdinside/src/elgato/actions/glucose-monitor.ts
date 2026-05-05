import { action, KeyDownEvent, SingletonAction, type DidReceiveSettingsEvent, type KeyAction, type SendToPluginEvent, type WillAppearEvent, type WillDisappearEvent } from '@elgato/streamdeck';
import { buildDisplay, buildSvg, fetchEntries, type Display, type PluginSettings, withDefaults } from '../../common';

type ActionState = { settings: Required<PluginSettings>; timer?: ReturnType<typeof setTimeout> };

@action({ UUID: 'ai.openclaw.deckscout.elgato.monitor' })
export class GlucoseMonitorAction extends SingletonAction<PluginSettings> {
  private readonly states = new Map<string, ActionState>();

  override async onWillAppear(ev: WillAppearEvent<PluginSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const settings = withDefaults(ev.payload.settings);
    this.states.set(ev.action.id, { settings });
    await this.refresh(ev.action);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<PluginSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const current = this.states.get(ev.action.id);
    const settings = withDefaults(ev.payload.settings ?? current?.settings);
    this.states.set(ev.action.id, { ...(current ?? { settings }), settings });
    await this.refresh(ev.action);
  }

  override async onSendToPlugin(ev: SendToPluginEvent<PluginSettings, PluginSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const current = this.states.get(ev.action.id);
    const settings = withDefaults({ ...(current?.settings ?? {}), ...(ev.payload ?? {}) });
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

    if (!settings.baseUrl) {
      await this.renderState(action, settings, { state: 'setup', value: 'Setup', line2: 'Nightscout', footer: 'URL needed', divider: true });
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
      await this.renderState(action, settings, { state: 'error', value: 'Err', line2: 'Fetch fail', footer: 'Check URL', divider: true });
    }

    this.schedule(action);
  }

  private async renderState(action: KeyAction<PluginSettings>, settings: Required<PluginSettings>, display: Display): Promise<void> {
    await action.setTitle('');
    await action.setImage(buildSvg(display, settings));
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
