# Ticket 014: Distant navigation anchors (far-far objects for orientation)

## Context

Even with starfield motion cues, players can still lose global orientation in open space. We need a few **extremely distant, stable anchors** that do not parallax or drift, so players can judge ship heading and general direction.

This must remain render-only and must not affect gameplay physics.

References:

* Ticket 004b (Environment motion cues)
* `docs/architecture.md`: performance rules and renderer separation

## Goal

Add far-distance navigation anchors that remain visually stable as the ship moves.

## Scope

### Included

* One of the following anchor approaches (choose the simplest that fits current renderer):

  1. **Skybox / skydome** with a few bright colored nebula blobs or galaxy band
  2. **Distant beacon points** attached to camera orientation only (no translation), like “constellations”
  3. **Directional compass ring** around HUD (optional, minimal)

* Anchors must:

  * be unaffected by player translation
  * change only with player rotation (as a background)
  * be cheap (few draw calls)

### Excluded

* Interactive objects
* Collisions
* Stage hazards

## Tasks

* Implement `DistantAnchors` module under `src/engine/renderer/environment/`:

  * Option A: skydome sphere with emissive texture or procedural gradient
  * Option B: small set of large bright points in a sphere rendered in a sky layer
* Rendering technique:

  * Render anchors centered on camera position each frame (copy camera position to anchor container)
  * Or attach anchors to a separate scene/camera pass (if already present)
* Add 3–8 anchors:

  * 1 large bright "galaxy" region
  * 2–3 colored nebulas
  * 2–3 bright stars/beacons
* Ensure anchors do not show parallax with movement:

  * verify by strafing: anchors should not shift relative to screen beyond rotation
* Add toggle `ANCHORS` (debug): on/off.

## Acceptance criteria

* Player can maintain general heading using anchors.
* Anchors remain stable under translation and only rotate with view.
* No FPS regression on mobile.
* No console errors.

## Testing notes

* Fly forward and strafe: anchors should not appear to move sideways.
* Rotate ship: anchors should rotate smoothly.
* Toggle ANCHORS off/on.

## Affected files (expected)

* `src/engine/renderer/environment/distant_anchors.ts`
* renderer wiring (`renderer.ts` or `main.ts`)
* overlay toggle module (if present)

## Follow-ups

* Add minimal compass ring (HUD) mapped to ship yaw (optional)
