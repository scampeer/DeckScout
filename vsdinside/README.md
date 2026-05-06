# DeckScout for VSDinside / Stream Dock

The original DeckScout build, for **VSDinside** and **Stream Dock** users.

If you're using the **official Elgato Stream Deck app** instead, see [`../elgato/`](../elgato).

## Requirements

- VSDinside / Stream Dock software
- A reachable [Nightscout](http://www.nightscout.info/) instance

## Install (end users)

1. Download the latest `deckscout-vX.Y.Z-vsdinside.zip` from the [Releases](https://github.com/scampeer/DeckScout/releases) page
2. Import it into VSDinside / Stream Dock
3. Add **Glucose Monitor** to a key
4. Enter your Nightscout URL, e.g.:
   - LAN: `http://192.168.40.37:1337`
   - Tailscale HTTPS: `https://nas.tail17fc34.ts.net`
5. Choose units, thresholds, and compact/detailed mode
6. Press the key once to force a refresh

## Build from source (developers)

1. Install Node 24+
2. Run:
   ```
   npm install
   npm run build
   ```
3. Load the `deckscout.sdPlugin` folder into VSDinside / Stream Dock

Runtime output lands in `deckscout.sdPlugin/plugin/index.js`.

## Project structure

- `src/` — TypeScript source
- `deckscout.sdPlugin/` — compiled plugin payload, manifest, and property inspector

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

> **Tip:** switching to mmol/L auto-converts the low/high thresholds, but you should still confirm your target ranges. 80/180 mg/dL ≈ 4.4/10.0 mmol/L.

## Privacy

DeckScout makes HTTP/HTTPS requests **only** to the Nightscout URL you configure. It does not phone home, does not collect telemetry, and stores all settings locally. The URL never leaves your machine.
