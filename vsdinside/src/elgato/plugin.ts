import streamDeck from '@elgato/streamdeck';
import { GlucoseMonitorAction } from './actions/glucose-monitor';

streamDeck.actions.registerAction(new GlucoseMonitorAction());

void streamDeck.connect();
