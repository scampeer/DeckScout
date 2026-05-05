# Repo Migration: Adding the Elgato Build

These steps restructure your repo so it has both the existing VSDinside build AND the new Elgato build, side by side.

## Final structure

```
DeckScout/
├── README.md                          ← combined root README (new)
├── CHANGELOG.md                       ← shared changelog
├── LICENSE
├── assets/
│   └── deckscout-logo.svg             ← keep as-is
├── elgato/                            ← NEW
│   ├── README.md                      ← Elgato-specific docs
│   └── deckscout-elgato.sdPlugin/     ← compiled Elgato build
└── vsdinside/                         ← MOVED
    ├── README.md                      ← VSDinside-specific docs
    ├── package.json
    ├── tsconfig.json
    ├── src/
    └── deckscout.sdPlugin/
```

## Step-by-step

### 1. Clone fresh and check out a branch

```bash
git clone https://github.com/scampeer/DeckScout.git
cd DeckScout
git checkout -b restructure-multi-platform
```

### 2. Move existing VSDinside files into a `vsdinside/` folder

```bash
mkdir vsdinside

# Move all VSDinside-specific files into the subfolder.
# Adjust this list to match what's actually in your repo root.
git mv src vsdinside/
git mv deckscout.sdPlugin vsdinside/
git mv package.json vsdinside/
git mv package-lock.json vsdinside/   # if present
git mv tsconfig.json vsdinside/       # if present
git mv .gitignore vsdinside/.gitignore # if it's specific to the build; otherwise keep at root
```

Keep at the root: `README.md`, `CHANGELOG.md`, `LICENSE`, `assets/`, anything that applies to the whole project.

### 3. Add the Elgato build

Extract `deckscout-v1.0.0.zip` so you end up with `elgato/deckscout-elgato.sdPlugin/` at this level.

```bash
mkdir elgato
# Extract deckscout-v1.0.0.zip into elgato/, then verify:
ls elgato/
# Should show: deckscout-elgato.sdPlugin/
```

### 4. Drop in the new READMEs

Replace your current root `README.md` with the new combined one (provided), then drop the platform-specific READMEs into their respective folders:

- `./README.md` ← combined root
- `./elgato/README.md` ← Elgato-specific
- `./vsdinside/README.md` ← VSDinside-specific

### 5. Update CHANGELOG

Add the v1.0.0-elgato entry to your existing CHANGELOG (provided as a separate file).

### 6. Commit and push

```bash
git add -A
git commit -m "Restructure repo for multi-platform: add Elgato build alongside VSDinside"
git push -u origin restructure-multi-platform
```

Then open a PR from `restructure-multi-platform` to `main`, merge it, and you're done.

### 7. Tag the new release

```bash
git checkout main
git pull
git tag v1.0.0-elgato
git push origin v1.0.0-elgato
```

Then on the [Releases page](https://github.com/scampeer/DeckScout/releases):

1. **Draft a new release**
2. Choose the tag `v1.0.0-elgato`
3. Title: `v1.0.0 — Elgato Stream Deck`
4. Paste the contents of `RELEASE_NOTES.md` into the description
5. Attach `deckscout-v1.0.0-elgato.zip` as the release asset (rename it from `deckscout-v1.0.0.zip` if needed for clarity)
6. Publish

## Future workflow

When you ship updates:

- VSDinside-only fix → tag `v1.0.1-vsdinside`, attach the VSDinside zip
- Elgato-only fix → tag `v1.0.1-elgato`, attach the Elgato zip
- Shared fix (e.g., new color scheme, new feature in both) → bump both, ship `v1.1.0-vsdinside` and `v1.1.0-elgato`

This keeps users on each platform able to grab exactly what they need.
