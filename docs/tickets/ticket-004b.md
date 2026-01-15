# Ticket 004b: Space environment motion cues (starfield + reference objects)

## Context

After Ticket 004, the ship can be controlled, but without a visual reference frame it is hard to feel translation and speed. We need cheap visual motion cues that do not affect gameplay logic.

This ticket is a **local patch** that improves play-feel validation before adding event bus, enemies, or weapons.

References:

* `docs/architecture.md`: Section 3 (no gameplay logic in renderer), Section 16 (performance)
* `docs/milestones/v0.1-foundation.md`: Mobile usability and performance baseline

## Goal

Add a lightweight space environment that makes ship motion obvious:

* starfield with parallax-style motion
* a few large reference objects (asteroids/debris)
* optional boost streak effect

All changes must be render/environment-only and must not modify ship physics.

## Scope

### Included

* Starfield implemented using Three.js `Points` (or instanced sprites if preferred)
* Starfield wrap-around volume centered on the player ship to avoid infinite drift
* Update star positions based on player movement delta (derived from ship transform)
* 2–5 large reference objects placed at various distances
* Optional boost streaks visible only when boost is active
* Debug toggle to enable/disable environment cues

### Excluded

* Collisions with environment
* Procedural asteroids fields
* Fancy shaders or postprocessing
* Any gameplay changes (no forces, no drag, no camera shake)

## Tasks

* Create `src/engine/renderer/environment/` (or similar) with:

  * `starfield.ts`: create/update star points
  * `reference_objects.ts`: create a few large meshes
  * `boost_streaks.ts` (optional): lightweight streak effect
* Starfield design:

  * Generate N stars in a cube or sphere volume around origin (player-centered space)
  * Maintain star positions in a buffer attribute
  * Each frame, compute player translation delta since last frame
  * Apply inverse delta to stars so motion appears around the player
  * Wrap stars when they exit the volume bounds
* Reference objects:

  * Add a few big, low-poly meshes (spheres or simple rocks)
  * Place them far enough to show parallax during strafing/rotation
* Boost streaks (optional but recommended):

  * When `InputState.boost` is active or ship controller reports boost active,
    render short streak particles that intensify with speed
* Add a small debug UI toggle:

  * `E` key on desktop (optional)
  * on mobile: a small button in overlay labeled `ENV`
  * Toggle enables/disables starfield + streaks + reference objects
* Ensure environment reads ship transform but does not write to ECS.

## Acceptance criteria

* On mobile, forward motion is clearly visible via star movement.
* Strafing produces noticeable parallax shift.
* Rotation is visually clear (stars rotate relative to view appropriately).
* Starfield does not drift away (wrap-around works).
* Toggling environment on/off works.
* FPS remains stable (no major drop compared with baseline Ticket 004).
* No console errors.

## Testing notes

* Mobile test:

  1. Open on phone.
  2. Move forward and confirm stars flow past continuously.
  3. Strafe left/right and confirm parallax.
  4. Rotate using right stick/gyro and confirm starfield responds.
  5. Toggle ENV off, confirm cues disappear; toggle on, cues return.
  6. Boost and confirm streaks appear (if implemented).

## Affected files (expected)

* `src/engine/renderer/environment/starfield.ts`
* `src/engine/renderer/environment/reference_objects.ts`
* `src/engine/renderer/environment/boost_streaks.ts` (optional)
* `src/engine/renderer/renderer.ts` (or scene setup integration)
* `src/main.ts` (wiring environment module)
* overlay UI files (if needed)

## Follow-ups

* Ticket 005: Event bus and lifecycle hooks
* Later: environmental hazards (nebula visibility, asteroid fields) as stage data
