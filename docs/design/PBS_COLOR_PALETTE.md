# PBS Color Palette

Source of truth found in:

`webview-ui/src/pets/homePetVisuals.ts`

This palette is used by the PBS home-pet / Daydream visual language. Keep this file as the human-readable reference so the colors are not lost again.

## Core palette

| Name | Hex | Use note |
|---|---:|---|
| Black | `#000000` | Outline / eyes / hard contrast |
| Yellow | `#FCF46B` | Primary bright accent; used for Hackteria source color in corpus graph |
| Blue-green | `#69C3AA` | Cool community/source accent; used for HTGWYW / KOBAKANT source color |
| Silver | `#BAC3D9` | Neutral technical layer; used for Tools semantic layer |
| Pink | `#FFD4FF` | Soft social/source accent; used for SGMK source color |
| Cream | `#F9E9C2` | Warm background/concept layer; used for Concepts semantic layer |

## Color cycle

The current `homePetColorCycle` order is:

1. Yellow — `#FCF46B`
2. Blue-green — `#69C3AA`
3. Pink — `#FFD4FF`
4. Cream — `#F9E9C2`
5. Silver — `#BAC3D9`

Black is part of the core palette but not part of the pet color cycle.

## Current corpus graph mapping

| Graph role | Color | Hex |
|---|---|---:|
| Hackteria source | Yellow | `#FCF46B` |
| How To Get What You Want / KOBAKANT source | Blue-green | `#69C3AA` |
| SGMK source | Pink | `#FFD4FF` |
| Tools semantic layer | Silver | `#BAC3D9` |
| Concepts semantic layer | Cream | `#F9E9C2` |

Additional temporary layer colors currently used in the Obsidian corpus graph:

| Graph role | Hex | Note |
|---|---:|---|
| Events semantic layer | `#FFB64F` | From question-pet warm palette, not core home-pet palette |
| People entity layer | `#FF8FBD` | From question-pet skin palette, not core home-pet palette |
| Places entity layer | `#91A7FF` | From question-pet skin palette, not core home-pet palette |
| Time entity layer | `#F3CC41` | From question-pet secondary palette, close to PBS yellow family |

## Notes

- Treat the six core colors above as the canonical PBS palette.
- If the corpus graph needs more colors, prefer deriving them from existing pet palettes rather than inventing unrelated colors.
- If code changes the palette, update this file in the same commit.
