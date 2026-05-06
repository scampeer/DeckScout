<p align="center">
  <img src="assets/deckscout-header.png" alt="DeckScout Header" width="760">
</p>

<h1 align="center">DeckScout</h1>


A local-first Stream Deck Nightscout glucose monitor.
Available for both **Elgato Stream Deck** and **VSDinside / Stream Dock**.

DeckScout shows your latest Nightscout glucose reading directly on a key — value, trend arrow, optional delta, and optional timestamp — color-coded for in-range, low, high, stale, and error states. It renders a dynamic SVG card instead of plain text and points at your own self-hosted Nightscout URL. No cloud accounts, no third-party telemetry.

> ⚠️ **Not medical advice.** Do not use DeckScout for treatment decisions.

## Platform support

| Platform | Folder | Release asset |
|---|---|---|
| 🟦 **Elgato Stream Deck** | [`elgato/`](./elgato) | `DeckScout-1.0.8-elgato.zip` |
| 🟪 **VSDinside / Stream Dock** | [`vsdinside/`](./vsdinside) | `DeckScout-0.3.12-vsdinside.zip` |

## What DeckScout does

- Polls Nightscout with adaptive timing
- Renders a dynamic, color-coded key card instead of plain text
- Shows the latest glucose value, trend arrow, optional delta, and optional timestamp
- Marks low / high / stale / no-data / error / setup states visually
- Supports mg/dL and mmol/L
- Manual refresh on key press
- Detailed and Compact display modes
- Auto-converts threshold values when switching between mg/dL and mmol/L
- User-adjustable state colors for in-range, low, high, stale, no-data, error, and setup states
- Matching multi-platform inspector layout for Elgato and VSDinside builds

### Color states

- 🟢 **green** — in range
- 🔴 **red** — low
- 🟡 **amber** — high
- ⚫ **gray** — stale / no data
- 🌹 **rose** — fetch error
- 🔵 **blue** — setup needed

## General setup guide

### 1) Get Nightscout running

DeckScout expects a working Nightscout instance that exposes recent glucose entries.

Common ways to run Nightscout:
- Docker on a NAS, mini PC, Raspberry Pi, or VPS
- existing hosted Nightscout deployment
- local LAN-only instance

At minimum you need:
- **Nightscout app**
- **MongoDB**
- a URL reachable from the machine running DeckScout

Example Docker Compose shape:

```yaml
services:
  mongo:
    image: mongo:6
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db

  nightscout:
    image: nightscout/cgm-remote-monitor:latest
    restart: unless-stopped
    ports:
      - "1337:1337"
    environment:
      - MONGO_CONNECTION=mongodb://mongo:27017/nightscout
      - API_SECRET=your-secret-here
      - TZ=UTC
    depends_on:
      - mongo

volumes:
  mongo-data:
```

After startup, confirm Nightscout works in a browser:

```text
http://YOUR-HOST:1337
```

And confirm the API returns entries:

```text
http://YOUR-HOST:1337/api/v1/entries.json?count=2
```

DeckScout reads these Nightscout fields:
- `sgv`
- `direction`
- `date` or `dateString`

### 2) Feed glucose data into Nightscout

DeckScout does **not** talk directly to Dexcom. It reads whatever Nightscout already has.

Typical upload paths:
- Dexcom Share-compatible uploader
- xDrip / xDrip4iOS / Zukka / similar uploader
- any Nightscout-compatible source that writes entries normally

For iPhone users, a practical pattern is:
- Dexcom G7 app on iPhone
- uploader app that can send to Nightscout
- Nightscout reachable via LAN or HTTPS/Tailscale

### 3) Make Nightscout reachable from your deck software

Use a URL your Stream Deck host can actually reach:

- **LAN:** `http://192.168.x.x:1337`
- **Tailscale HTTPS:** `https://your-node-name.ts.net`
- **other HTTPS reverse proxy:** supported too

If the plugin cannot reach Nightscout, it will show an error state.

## Install guide

### VSDinside / Stream Dock

1. Download `DeckScout-0.3.12-vsdinside.zip` from the [Releases page](https://github.com/scampeer/DeckScout/releases)
2. In VSDinside, import the plugin zip
3. Find **Health → Glucose Monitor**
4. Drag it onto a key
5. Open the settings panel
6. Enter your Nightscout base URL
7. Choose units / thresholds / display options
8. Save settings

Recommended starting values:
- Poll every: `305`
- Low threshold: `80`
- High threshold: `180`
- Stale after: `15`

### Elgato Stream Deck

1. Download `DeckScout-1.0.8-elgato.zip` from the [Releases page](https://github.com/scampeer/DeckScout/releases)
2. Fully quit the Stream Deck app
3. Extract into the Stream Deck plugins folder:
   - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
4. Start Stream Deck again
5. Find **DeckScout → Glucose Monitor**
6. Drag it onto a key
7. Enter your Nightscout base URL and save

## Recommended plugin settings

- **Poll every:** `305` seconds
- **Units:** mg/dL or mmol/L
- **Show delta:** optional
- **Show timestamp:** optional
- **Display mode:** detailed or compact

If using mmol/L, DeckScout auto-converts the thresholds when you switch units, but you should still confirm your target ranges.
Example: `80/180 mg/dL ≈ 4.4/10.0 mmol/L`.

## Releases

See the [Releases page](https://github.com/scampeer/DeckScout/releases).

Current release assets:
- `DeckScout-0.3.12-vsdinside.zip`
- `DeckScout-1.0.8-elgato.zip`

## Notes

- Dexcom-style sources commonly update every ~5 minutes, so `305` seconds remains the default slow poll interval.
- DeckScout may temporarily poll faster while catching up or waiting for a fresh Nightscout entry.
- If using mmol/L, DeckScout auto-converts thresholds when you switch units, but you should still confirm your target ranges.
- This is not medical advice and should not be used for treatment decisions.

## Branding

- Primary repo/doc header: [`assets/deckscout-header.png`](./assets/deckscout-header.png)
- Previous vector mark kept at [`assets/deckscout-logo.svg`](./assets/deckscout-logo.svg)
- Plugin/action icons are simplified for readability at tiny sizes
- Full wordmark is best used in GitHub/docs/release screenshots, not tiny key icons

## Roadmap

- Optional tiny sparkline / history action
- Alert/snooze action
- Caregiver mode / multiple profiles
- Direct Dexcom mode if it becomes worth the complexity

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
