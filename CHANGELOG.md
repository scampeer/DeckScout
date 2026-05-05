# Changelog

## v0.3.0 - 2026-05-05

First public local-first release.

### Added
- VSDinside-compatible DeckScout runtime
- Dynamic glucose card rendering on the key
- mg/dL and mmol/L support
- Compact and detailed display modes
- Manual refresh on key press
- Local-first Nightscout configuration flow
- Tailscale-friendly HTTPS workflow for self-hosted Nightscout
- Repo branding assets and updated README

### Changed
- Simplified plugin setup to a base URL plus display settings
- Removed user-facing token/API auth fields from the property inspector
- Improved key layout fitting for live glucose data
- Switched to image-only key rendering to avoid oversized VSDinside title overlays

### Fixed
- VSDinside settings persistence/runtime sync issues
- VSDinside websocket runtime compatibility problems
- Detailed layout overflow issues on the key

### Notes
- This release is optimized for readable self-hosted Nightscout endpoints on LAN or Tailscale.
- This project is not medical advice and should not be used for treatment decisions.
