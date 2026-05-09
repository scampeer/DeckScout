<p align="center">
  <img src="assets/deckscout-header.png" alt="DeckScout Header" width="760">
</p>

<h1 align="center">DeckScout</h1>

A local-first Stream Deck glucose monitor.
Available for both **Elgato Stream Deck** and **VSDinside / Stream Dock**.

DeckScout shows your latest glucose reading directly on a key — value, trend arrow, optional delta, and optional timestamp — color-coded for in-range, low, high, stale, and error states. It renders a dynamic SVG card instead of plain text and can read from either your own **Nightscout** instance or **Dexcom Share** directly in both builds.

> ⚠️ **Not medical advice.** Do not use DeckScout for treatment decisions.

## Platform support

| Platform | Folder | Release asset |
|---|---|---|
| 🟦 **Elgato Stream Deck** | [`elgato/`](./elgato) | `DeckScout-1.0.8.8-elgato.streamDeckPlugin` |
| 🟪 **VSDinside / Stream Dock** | [`vsdinside/`](./vsdinside) | `DeckScout-0.3.13-vsdinside.zip` |

## What DeckScout does

- Polls glucose sources with adaptive timing
- Supports **Nightscout** and **Dexcom Share** in both the Elgato and VSDinside builds
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

## Data sources

### Nightscout
DeckScout supports a traditional self-hosted Nightscout workflow.

You need:
- a working Nightscout instance
- recent glucose entries already flowing into it
- a URL reachable from the machine running DeckScout

DeckScout reads standard Nightscout fields such as:
- `sgv`
- `direction`
- `date` / `dateString`

### Dexcom Share
Both builds support direct **Dexcom Share** access.

You need:
- Dexcom Share enabled in the Dexcom mobile app
- **at least one follower configured in Dexcom Share** — this is required for the plugin to work properly
- your **publisher account** credentials, not the follower credentials
- the correct region selected:
  - `us`
  - `ous`
  - `jp`

This direct mode removes the Nightscout requirement for Dexcom users who want a simpler setup.

> **Important:** if Dexcom Share has no follower configured, the Dexcom integration may fail even when the username, password, and region are correct.
>
> **Also important:** if Dexcom Share itself is having service or protocol issues upstream, the Dexcom mode in DeckScout may temporarily stop working until Dexcom Share recovers.

## General setup guide

### 1) Nightscout option: get Nightscout running

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

### 2) Feed glucose data into Nightscout

Typical upload paths:
- Dexcom Share-compatible uploader
- xDrip / xDrip4iOS / Zukka / similar uploader
- Libre-compatible uploaders that write normal Nightscout entries
- any Nightscout-compatible source that writes entries normally

### 3) Make Nightscout reachable from your deck software

Use a URL your Stream Deck host can actually reach:

- **LAN:** `http://192.168.x.x:1337`
- **Tailscale HTTPS:** `https://your-node-name.ts.net`
- **other HTTPS reverse proxy:** supported too

If the plugin cannot reach Nightscout, it will show an error state.

## Install guide

### VSDinside / Stream Dock

1. Download a VSDinside release from the [Releases page](https://github.com/scampeer/DeckScout/releases)
2. In VSDinside, import the plugin package
3. Find **Health → Glucose Monitor**
4. Drag it onto a key
5. Open the settings panel
6. Choose a source:
   - **Nightscout**
   - **Dexcom Share**
7. Fill in the required settings for that source
8. Save settings
9. Press the key once to force a refresh

Recommended starting values:
- Poll every: `305`
- Low threshold: `80`
- High threshold: `180`
- Stale after: `15`

### Elgato Stream Deck

1. Download `DeckScout-1.0.8.8-elgato.streamDeckPlugin` from the [Releases page](https://github.com/scampeer/DeckScout/releases)
2. Fully quit the Stream Deck app
3. Open the `.streamDeckPlugin` file to install it, or extract it manually into the Stream Deck plugins folder:
   - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
4. Start Stream Deck again if it does not relaunch automatically
5. Find **DeckScout → Glucose Monitor**
6. Drag it onto a key
7. Choose **Nightscout** or **Dexcom Share**, enter credentials/settings, and save

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
- `DeckScout-0.3.13-vsdinside.zip`
- `DeckScout-1.0.8.8-elgato.streamDeckPlugin`

## Notes

- Dexcom-style sources commonly update every ~5 minutes, so `305` seconds remains the default slow poll interval.
- DeckScout may temporarily poll faster while catching up or waiting for a fresh entry.
- The VSDinside Dexcom Share path is working, but should still be treated as a convenience feature rather than a medical-grade integration.
- If Dexcom Share has an upstream outage or protocol/API issue, the Dexcom mode may temporarily stop working.
- A future improvement would be to add a dedicated Dexcom Share health/protocol check and surface a clearer in-app outage notice when Dexcom itself is the problem.
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
- LibreLinkUp-style direct source exploration

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
