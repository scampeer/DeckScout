# DeckScout Elgato v1.0.9.0 / VSDinside v0.3.13

This update splits the previous combined DeckScout/Glucose Monitor action into two dedicated actions:

- Nightscout
- Dexcom Share

Each now appears as its own draggable action in the action picker with a source-specific setup flow, while the legacy combined action remains supported for existing keys.

## Highlights
- Added separate Nightscout and Dexcom Share actions
- Removed the source selector from the new source-specific flows
- Enforced source type automatically from the selected action
- Kept the legacy combined action for backward compatibility
- Improved Dexcom password save and persistence behavior

## Versions
- Elgato: `1.0.9.0`
- VSDinside: `0.3.13`
