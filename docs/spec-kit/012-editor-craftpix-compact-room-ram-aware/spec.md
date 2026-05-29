# Spec 012: RAM-Aware CraftPix Room Build

Status: active implementation

## Problem

The editor mode still shows the old pink exterior because the app overwrites the compact browser mock layout with `createNextTinyRoomLayout()` during world initialization. The user wants a small, refined room with no pink exterior tiles or exterior plants.

The CraftPix pack contains large spritesheets. Importing every animation frame or whole sheet as furniture would increase startup memory and make the editor palette noisy. Opencode and browser runtime are RAM-sensitive, so slicing must be selective and static-first.

## Required Outcomes

- `?editor=1` uses a true `32x32` compact room.
- Outside the room is void/blank, not pink floor.
- No old PBS exterior plants are placed on the pink exterior.
- CraftPix static objects are sliced into individual furniture folders.
- Include the important temple/house landmark from `exterior.png` as a placeable object.
- Avoid slicing animation sheets in this pass.
- Avoid committing raw CraftPix spritesheets unless explicitly needed.

## RAM Strategy

- Slice from static sheets only:
  - `exterior.png`
  - `Interior.png`
  - `house_details.png`
  - `ground_grass_details.png`
- Skip animation sheets:
  - `cat_animation.png`
  - `bird_fly_animation.png`
  - `bird_jump_animation.png`
  - `Smoke_animation.png`
  - `Trees_animation.png`
- Do not add whole spritesheets to furniture catalog.
- Prefer individual cropped PNGs with explicit manifests.
- Keep initial catalog growth moderate; tiny tile fragments under a threshold can be skipped.

## Verification

- `?editor=1` opens without player setup and uses compact editor room.
- Public `/` remains unchanged.
- Editor palette includes CraftPix temple/house and static object batch.
- Visual/static guards pass.
- Build passes.
