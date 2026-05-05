# DeckScout for Elgato Stream Deck

Official Elgato Stream Deck SDK port of DeckScout.

If you're using the **Elgato Stream Deck app** with Elgato hardware (Stream Deck Original / MK.2 / XL / Mini / + / Neo / Studio), this is the version for you. For VSDinside / Stream Dock users, see [`../vsdinside/`](../vsdinside).

## Requirements

- Stream Deck app **6.4 or newer** (tested on 7.0.3)
- Windows 10+ or macOS 12+
- A reachable [Nightscout](http://www.nightscout.info/) instance

## Install

1. Download the latest `deckscout-vX.Y.Z-elgato.zip` from the [Releases](https://github.com/scampeer/DeckScout/releases) page
2. **Fully quit** the Stream Deck app (system tray → Quit, not just close window)
3. Extract the zip into:
   - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
4. Start Stream Deck — DeckScout will appear in the action list on the right

## Setup

1. In the Stream Deck app, find **DeckScout → Glucose Monitor** in the right-hand action list
2. Drag it onto a key
3. Click the key to open the property inspector
4. Enter your **Nightscout base URL**, e.g.:
   - LAN: `http://192.168.1.42:1337`
   - Tailscale HTTPS: `https://nas.tail17fc34.ts.net`
5. Adjust thresholds, units, and poll interval to taste
6. Click **Save Settings**

The key will start displaying your glucose within a few seconds.

## Configuration

| Setting | Default | Description |
|---|---|---|
| Nightscout base URL | *(empty)* | Your Nightscout site URL — no trailing slash needed |
| Units | mg/dL | mg/dL or mmol/L |
| Poll every | 305s | Polling interval. 305s recommended for Dexcom upstreams |
| Low threshold | 80 | Below this value, the key turns red |
| High threshold | 180 | Above this value, the key turns yellow |
| Stale after | 15 min | After this many minutes without new data, the key turns grey |
| Display mode | Detailed | Detailed shows arrow + delta + age; Compact is more minimal |
| Show delta | on | Show the change from the previous reading |

> **Tip:** if you switch to mmol/L, also adjust low/high thresholds. 80/180 mg/dL ≈ 4.4/10.0 mmol/L.

## Troubleshooting

**The key shows "Setup / URL needed"**
Open the property inspector, enter your Nightscout URL, and hit Save Settings.

**The key shows "Err / Fetch fail"**
The plugin couldn't reach Nightscout. Verify the URL works in your browser, check that the Stream Deck host can reach it (firewall, VPN, Tailscale, etc.), and confirm Nightscout's `/api/v1/entries.json` endpoint is reachable.

**The key shows "STALE"**
Nightscout returned data, but the most recent reading is older than your "Stale after" threshold. This usually means an upstream collector (xDrip, Dexcom Share bridge, etc.) has stopped uploading.

**Plugin won't show up after install**
Fully quit Stream Deck (system tray → Quit, not just close window), confirm the folder is at `Plugins/deckscout-elgato.sdPlugin/`, and restart Stream Deck.

**Logs**
Plugin runtime logs are written to:
- **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\deckscout-elgato.sdPlugin\logs\`
- **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/deckscout-elgato.sdPlugin/logs/`

## Project structure

- `deckscout-elgato.sdPlugin/` — compiled plugin payload, manifest, and property inspector

## Tech notes

- Built on the official Elgato Stream Deck SDK (TypeScript runtime)
- Single bundled `plugin.js` — no external `node_modules` shipped
- Uses Stream Deck's bundled Node 20 runtime (no system Node required)
- Renders a per-frame inline SVG and pushes it to the key as a base64 data URI

## Privacy

DeckScout makes HTTP/HTTPS requests **only** to the Nightscout URL you configure. It does not phone home, does not collect telemetry, and stores all settings locally in your Stream Deck profile. The URL never leaves your machine.

For maximum privacy, point the plugin at a Nightscout instance on your LAN, a Tailscale tailnet, or another private network.
