<p align="center">
  <img src="../assets/deckscout-header.png" alt="DeckScout Header" width="760">
</p>

# DeckScout for VSDinside / Stream Dock

The original DeckScout build, for **VSDinside** and **Stream Dock** users.

If you're using the **official Elgato Stream Deck app** instead, see [`../elgato/`](../elgato).

## Requirements

- VSDinside / Stream Dock software
- One supported glucose source:
  - a reachable [Nightscout](http://www.nightscout.info/) instance
  - or direct **Dexcom Share** credentials

## Supported sources

### Nightscout
Use this if you already run Nightscout or want a self-hosted, local-first workflow.

### Dexcom Share
Use this if you want a direct-source setup without Nightscout.

Dexcom Share requires:
- Share enabled in the Dexcom app
- at least one follower configured
- your publisher account credentials
- the correct region (`us`, `ous`, or `jp`)

## Install (end users)

1. Download a VSDinside release from the [Releases](https://github.com/scampeer/DeckScout/releases) page
2. Import it into VSDinside / Stream Dock
3. Add **Glucose Monitor** to a key
4. Choose your source:
   - **Nightscout**
   - **Dexcom Share**
5. If using Nightscout, enter your URL, e.g.:
   - LAN: `http://192.168.40.37:1337`
   - Tailscale HTTPS: `https://nas.tail17fc34.ts.net`
6. If using Dexcom Share, enter:
   - region
   - username / email / phone
   - password
   - optional account ID
7. Choose units, thresholds, display layout, and state colors
8. Use **Verify** in the inspector to confirm the current source works
9. Press the key once to force a refresh

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
| Source | Nightscout | Choose Nightscout or Dexcom Share |
| Nightscout base URL | *(empty)* | Your Nightscout site URL — no trailing slash needed |
| Dexcom region | us | `us`, `ous`, or `jp` for Dexcom Share |
| Dexcom username | *(empty)* | Dexcom publisher username / email / phone |
| Dexcom password | *(empty)* | Dexcom publisher password |
| Dexcom account ID | *(empty)* | Optional advanced path if you already know the UUID |
| Units | mg/dL | mg/dL or mmol/L |
| Poll every | 305s | Polling interval. 305s recommended for CGM-style sources |
| Low threshold | 80 | Below this value, the key turns red |
| High threshold | 180 | Above this value, the key turns yellow |
| Stale after | 15 min | After this many minutes without new data, the key turns grey |
| Display mode | Detailed | Detailed shows arrow + delta + age; Compact is more minimal |
| Show delta | on | Show the change from the previous reading |
| Verify | n/a | Tests the active source directly from the inspector |
| State colors | defaults provided | Customize in-range / low / high / stale / no-data / error / setup colors |

> **Tip:** switching to mmol/L auto-converts the low/high thresholds, but you should still confirm your target ranges. 80/180 mg/dL ≈ 4.4/10.0 mmol/L.

## Privacy

DeckScout stores settings locally on the host machine. In Nightscout mode it makes HTTP/HTTPS requests only to the Nightscout URL you configure. In Dexcom Share mode it sends requests only to Dexcom Share endpoints for the region you selected. It does not phone home and does not collect telemetry.
