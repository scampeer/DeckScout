# v1.0.0 — Elgato Stream Deck

First production-ready release of DeckScout for **Elgato Stream Deck**, alongside the existing VSDinside build.

This brings DeckScout to the official Elgato Stream Deck app on Windows and macOS, so users with Elgato hardware (Original / MK.2 / XL / Mini / + / Neo / Studio) can now display their Nightscout glucose readings directly on a key.

> Looking for the VSDinside build? See [`vsdinside/`](../tree/main/vsdinside) and the `vX.Y.Z-vsdinside` tagged releases.

## What's new

- 🆕 **Full Elgato Stream Deck SDK port** — runs natively in the official Stream Deck app, no VSDinside required
- ✅ Settings save and persist across Stream Deck restarts
- ✅ Live glucose readings, trend arrow, delta, and reading age on the key
- ✅ Color-coded states (green/red/yellow/grey/rose/blue)
- ✅ Detailed and Compact display modes
- ✅ mg/dL and mmol/L
- ✅ Tap key to manually refresh
- ✅ Local-first: points at any Nightscout URL on your LAN, Tailscale, or HTTPS endpoint

## Installation

1. Download `deckscout-v1.0.0-elgato.zip` from this release
2. **Fully quit** the Stream Deck app (system tray → Quit, not just close window)
3. Extract the zip into:
   - **Windows:** `%appdata%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
4. Start Stream Deck — DeckScout appears in the action list
5. Drag **Glucose Monitor** onto a key, enter your Nightscout URL, hit **Save Settings**

See the [Elgato README](../tree/main/elgato#readme) for full setup and troubleshooting.

## Compatibility

- **Stream Deck app:** 6.4+ (verified on 7.0.3)
- **OS:** Windows 10+, macOS 12+
- **Devices:** Any Keypad-controller Stream Deck (original, MK.2, XL, Mini, +, Neo, Studio)

## Known limitations

- Dial-controller actions (encoders) aren't currently supported. Only standard keys.
- The plugin requires direct HTTP/HTTPS access to your Nightscout URL from the Stream Deck host. If that means VPN or Tailscale, make sure it's connected before opening Stream Deck.

## Acknowledgments

Thanks to everyone who helped track down the registration-context bug during the multi-hour debugging session that made this release possible.
