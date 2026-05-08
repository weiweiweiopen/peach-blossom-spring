# Boot Screen Dev Notes

## Local Startup

```bash
cd "/Users/weiweiweiwei/Documents/Projects/Peach Blossom Spring/webview-ui"
npm install
npm run dev
```

## Quick Preview

Open the localhost URL printed in terminal, usually:

```text
http://localhost:5173
```

## Files Added Or Modified

- `webview-ui/src/App.tsx`
- `webview-ui/src/components/RetroBootScreen.tsx`
- `webview-ui/src/components/RetroBootScreen.css`
- `docs/BOOT_SCREEN_DEV.md`

## Change Only The Title

Edit `webview-ui/src/components/RetroBootScreen.tsx`:

- `Wise Mouse Culture`
- `Peach Blossom Spring`
- `Dispatching a Thinking Life Simulator`
- `PRESS START`

## Change Only Pet Characters

Edit `webview-ui/src/components/RetroBootScreen.tsx`:

- `petRoles` for names and role accessories
- `makePetGrid` for body/face construction
- `addAccessory` for hats, ears, antennae, tails, sprouts, horns, and halos

For pet position, size, label visibility, or idle motion, edit `webview-ui/src/components/RetroBootScreen.css` classes named `.retro-pet-*`.

## Color Rule

The boot screen uses only the five world colors defined in `webview-ui/src/world/peachBlossomWorld.ts`:

- `#FCF46B`
- `#69C3AA`
- `#BAC3D9`
- `#FFD4FF`
- `#F9E9C2`

Do not add extra boot-screen colors unless the world palette changes first.

## Files Not To Touch Casually

- `data/personas.json`
- `data/extra-personas.json`
- `.github/workflows/pages.yml`
- `webview-ui/src/world/peachBlossomWorld.ts`
- `webview-ui/src/office/**`
- `webview-ui/src/components/RpgDialogue.tsx`
- `webview-ui/src/components/ExpeditionPanel.tsx`
