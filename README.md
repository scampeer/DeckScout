# DeckScout

A local-first Stream Deck Nightscout glucose monitor.
Available for both **Elgato Stream Deck** and **VSDinside / Stream Dock**.

DeckScout shows your latest Nightscout glucose reading directly on a key — value, trend arrow, delta, and age — color-coded for in-range, low, high, stale, and error states. Polls every 305 seconds by default (Dexcom-friendly), renders a dynamic SVG card instead of plain text, and points at your own self-hosted Nightscout URL. No cloud accounts, no third-party services.

> ⚠️ **Not medical advice.** Do not use DeckScout for treatment decisions.

## Pick your platform

| Platform | Where to look |
|---|---|
| 🟦 **Elgato Stream Deck** (official Elgato hardware/software) | [`elgato/`](./elgato) |
| 🟪 **VSDinside / Stream Dock** | [`vsdinside/`](./vsdinside) |

Each subfolder has a platform-specific README with install and setup instructions for that ecosystem.

## What DeckScout does (both versions)

- Polls Nightscout every 305 seconds by default (configurable)
- Renders a dynamic, color-coded key card instead of plain text
- Shows the latest glucose value, trend arrow, delta, and reading age
- Marks low / high / stale / no-data / error / setup states visually
- Supports mg/dL and mmol/L
- Manual refresh on key press
- Detailed and Compact display modes

### Color states

- 🟢 **green** — in range
- 🔴 **red** — low
- 🟡 **amber** — high
- ⚫ **gray** — stale / no data
- 🌹 **rose** — fetch error
- 🔵 **blue** — setup needed

## Why Nightscout first?

Nightscout removes most of the painful Dexcom-cloud auth work and makes a practical v1 possible. DeckScout is currently optimized for self-hosted Nightscout setups on LAN, Tailscale, or other private/HTTPS URLs.

It does not expose Nightscout auth fields in the plugin UI today — bring a readable Nightscout endpoint and you're set. Direct Dexcom support may come later if the complexity is worth it.

## Nightscout API assumption

DeckScout reads from:

```
GET /api/v1/entries.json?count=2
```

Expected fields used:
- `sgv`
- `direction`
- `date` or `dateString`

## Releases

Releases are tagged separately per platform so you can grab exactly the build you need:

- **Elgato:** `vX.Y.Z-elgato` → `deckscout-vX.Y.Z-elgato.zip`
- **VSDinside:** `vX.Y.Z-vsdinside` → `deckscout-vX.Y.Z-vsdinside.zip`

See the [Releases page](https://github.com/scampeer/DeckScout/releases).

## Notes

- Dexcom data commonly updates every 5 minutes, so `305` seconds is the default poll interval (the extra 5s avoids race conditions with the upstream uploader).
- If using mmol/L, adjust thresholds accordingly. Example: `80/180 mg/dL ≈ 4.4/10.0 mmol/L`.
- This is not medical advice and should not be used for treatment decisions.

## Branding

- Primary repo/doc logo: [`assets/deckscout-logo.svg`](./assets/deckscout-logo.svg)
- Plugin/action icons are simplified for readability at tiny sizes
- Full wordmark is best used in GitHub/docs/release screenshots, not tiny key icons

## Roadmap

- Threshold presets when switching units
- Optional tiny sparkline / history action
- Alert/snooze action
- Caregiver mode / multiple profiles
- Direct Dexcom mode if it becomes worth the complexity

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
