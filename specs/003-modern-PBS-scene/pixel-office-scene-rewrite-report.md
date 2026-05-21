# Pixel-Office Scene Rewrite Report

## Diagnosis
Counts can pass while visual concept fails. The scene must read as 現代桃花源 / Modern PBS, not office rooms with plants.

## Rewrite rules
- Center first: spawn in open central commons.
- Nature as wayfinding: forest/river/dock guide movement.
- Rooms wrap perimeter: classroom, bio-art lab, workshop, sewing, stage, sound, archive, cabin.
- Props communicate domain without clutter.
- Use existing pixel-office assets first.

## Budgets
- 64x64.
- furniture target 120-180, hard cap 220.
- natureProps 40-70.
- distinct furniture types <= 24.
- unreachableEntrances = 0.
- first viewport not too dense.

## Preview safety
- Add `?modern-pbs-scene=1`.
- Taoyuan only as legacy compatibility.
- Do not overwrite `default-layout-1.json`.
- Do not silently promote `default-layout-30.json` to default.
