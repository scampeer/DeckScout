<p align="center">
  <img src="../assets/deckscout-header.png" alt="DeckScout Header" width="760">
</p>

# DeckScout for Elgato Stream Deck

Official Elgato Stream Deck SDK port of DeckScout.

If you're using the **Elgato Stream Deck app** with Elgato hardware (Stream Deck Original / MK.2 / XL / Mini / + / Neo / Studio), this is the version for you. For VSDinside / Stream Dock users, see [`../vsdinside/`](../vsdinside).

## Requirements

- Stream Deck app **6.4 or newer** (verified working on 7.4.1)
- Windows 10+ or macOS 12+
- One supported glucose source:
  - a reachable [Nightscout](http://www.nightscout.info/) instance
  - or direct **Dexcom Share** credentials

## Install

1. Download `DeckScout-1.0.8.8-elgato.streamDeckPlugin` from the [Releases](https://github.com/scampeer/DeckScout/releases) page
2. Open the `.streamDeckPlugin` file to install it, or **fully quit** the Stream Deck app (system tray → Quit, not just close window) and extract it manually into:
   - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
3. Start Stream Deck if it does not relaunch automatically — DeckScout will appear in the action list on the right

## Setup

1. In the Stream Deck app, find **DeckScout → Glucose Monitor** in the right-hand action list
2. Drag it onto a key
3. Click the key to open the property inspector
4. Choose your source:
   - **Nightscout**
   - **Dexcom Share**
5. If using Nightscout, enter your base URL, e.g.:
   - LAN: `http://192.168.1.42:1337`
   - Tailscale HTTPS: `https://nas.tail17fc34.ts.net`
6. If using Dexcom Share, enter:
   - region
   - username / email / phone
   - password
   - optional account ID
7. Adjust thresholds, units, display layout, and state colors to taste
8. Click **Save Settings**

The key will start displaying your glucose within a few seconds. Dexcom Share uses the same publisher credentials you use in the Dexcom mobile app and requires Share to have at least one follower enabled.

> **Important:** if there are no followers on Dexcom Share, the plugin may not work properly even if your login details are correct.
>
> If Dexcom Share is having upstream service or protocol issues, the app may also temporarily stop working in Dexcom mode until Dexcom Share recovers.

## Configuration

| Setting | Default | Description |
|---|---|---|
| Source | Nightscout | Choose Nightscout or Dexcom Share |
| Nightscout base URL | *(empty)* | Your Nightscout site URL — no trailing slash needed |
| Dexcom region | us | `us`, `ous`, or `jp` for Dexcom Share |
| Dexcom username | *(empty)* | Dexcom publisher username / email / phone |
| Dexcom password | *(empty)* | Dexcom publisher password |
| Dexcom account ID | *(empty)* | Optional advanced path if you already know the UUID |
| Units | mg/dL | mg/dL or mmol/L |
| Poll every | 305s | Polling interval. 305s recommended for Dexcom upstreams |
| Low threshold | 80 | Below this value, the key turns red |
| High threshold | 180 | Above this value, the key turns yellow |
| Stale after | 15 min | After this many minutes without new data, the key turns grey |
| Display mode | Detailed | Detailed shows arrow + delta + age; Compact is more minimal |
| Show delta | on | Show the change from the previous reading |
| State colors | defaults provided | Customize in-range / low / high / stale / no-data / error / setup colors |

> **Tip:** switching to mmol/L auto-converts the low/high thresholds, but you should still confirm your target ranges. 80/180 mg/dL ≈ 4.4/10.0 mmol/L.

## Troubleshooting

**The key shows "Setup / URL needed"**
Open the property inspector, choose **Nightscout**, enter your Nightscout URL, and hit Save Settings.

**The key shows "Err / Fetch fail"**
The plugin couldn't reach Nightscout. Verify the URL works in your browser, check that the Stream Deck host can reach it (firewall, VPN, Tailscale, etc.), and confirm Nightscout's `/api/v1/entries.json` endpoint is reachable.

**The key shows "Setup / Login needed" or "Err / Dexcom fail"**
Check your Dexcom Share region and publisher credentials. Dexcom Share requires at least one follower relationship to exist on the Dexcom side, and phone-number usernames must include country code (for example `+11234567890`). If your settings are correct but it still fails, Dexcom Share itself may be having a temporary upstream or protocol issue.
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
- Dexcom Share runtime follows a pydexcom-style auth/session/read flow adapted for Elgato

## Privacy

DeckScout makes HTTP/HTTPS requests **only** to the Nightscout URL or Dexcom Share endpoint you configure. It does not phone home, does not collect telemetry, and stores all settings locally in your Stream Deck profile.

For maximum privacy, point the plugin at a Nightscout instance on your LAN, a Tailscale tailnet, or another private network.