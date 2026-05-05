# Changelog

All notable changes to DeckScout are tracked here.

## [1.0.0-elgato] — 2026-05-05

### Added
- **Official Elgato Stream Deck SDK build** alongside the existing VSDinside build. DeckScout now ships for both platforms from the same repo.
- Property inspector "Settings saved" confirmation after each save
- Cleaner styling and tighter copy in the Elgato configuration UI

### Fixed (Elgato build)
- Settings now persist across Stream Deck restarts. The property inspector was registering itself with the wrong identifier, causing Stream Deck to silently drop `setSettings` and `sendToPlugin` messages. The PI now uses its registered `inUUID` as the message context, which is what Stream Deck routes by.
- Save button click handler now fires reliably. Previously the handler was attached at script-parse time, before the button DOM node existed in some Stream Deck WebView builds. It's now attached on `DOMContentLoaded`.
- Glucose value renders correctly on the key. `setImage` now sends a proper `data:image/svg+xml;base64,...` data URI instead of a raw SVG string (the Elgato SDK requires the data URI form).
- Plugin no longer crashes on startup. The bundled SDK threw on `info.devices.forEach` when Stream Deck didn't include the `devices` array. The device store now tolerates a missing array, and falls back to creating a synthetic device entry on `willAppear` if the action's device hasn't been seen yet.
- Manifest now declares Node 20 to match the Node version Stream Deck bundles. Higher versions caused Stream Deck to silently refuse to launch the plugin process.

### Repo
- Restructured into `elgato/` and `vsdinside/` subfolders
- Added platform-specific READMEs
- Releases now tagged per platform (`vX.Y.Z-elgato`, `vX.Y.Z-vsdinside`)

---

## Earlier (VSDinside)

See git history for VSDinside-only changes prior to the multi-platform restructure.
