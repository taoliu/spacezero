# Ticket 011: Encounter tuning + mobile UX fixes (far spawns, direction clarity, gesture suppression)

## Context

After completing Tickets 009 (Weapons + damage) and 010 (Targeting assistant + indicators), the game is now first-playable. This ticket performs **focused tuning and UX hardening** to improve combat readability and mobile usability without introducing new systems.

Specifically, we want:

1. Fewer enemies (2) per encounter, spawned far from the player to encourage navigation.
2. Clear directional guidance so the player knows where to fly to engage enemies.
3. Removal of default mobile browser behaviors (text selection, callouts, gestures) that interfere with controls.

References:

* `docs/milestones/v0.1-foundation.md`: First playable quality bar
* Ticket 007 (Stage system)
* Ticket 010 (Targeting + direction indicator)

## Goal

Improve early-stage combat feel and mobile UX by:

* adjusting stage content (enemy count and spawn distance)
* ensuring directional awareness is always present
* disabling browser selection/gesture behavior in gameplay UI

## Scope

### Included

* Update `stage_001` to spawn exactly **2 enemies** at a far distance
* Ensure enemies do not start near the player spawn
* Ensure player always has a clear direction cue toward enemies
* Disable text selection, callouts, and gesture interference on mobile

### Excluded

* New gameplay mechanics
* Additional enemy archetypes
* New HUD features beyond direction clarity

## Tasks

### 1. Tune stage enemy spawns

* Modify `content/stages/stage_001.json`:

  * Set enemy count to 2
  * Spawn enemies far from player start position

Two acceptable patterns:

* **Explicit spawn points** (preferred for clarity):

  * Place enemies at large negative Z or radial offsets (e.g. 200–400 units away)
* **Spawn distance parameters** (if supported by StageSystem):

  * `spawnDistanceMin` >= 200
  * `spawnDistanceMax` >= 400

Ensure spawns are deterministic and do not overlap player start.

### 2. Directional awareness guarantee

* Ensure at least one directional cue is always present:

  * If an active target exists, use its direction
  * Otherwise, point to the nearest enemy
* Verify off-screen arrow indicator:

  * clamps to screen edge with margin
  * rotates correctly toward enemy direction
  * updates smoothly during ship rotation

No new UI elements are required; this is a correctness and tuning pass.

### 3. Disable mobile browser selection and gestures

* Add global CSS rules to disable:

  * text selection
  * long-press callouts
  * tap highlight
  * default touch gestures

Required CSS (example):

```css
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overscroll-behavior: none;
}

#app, canvas, .ui-layer {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

button, input {
  touch-action: manipulation;
}
```

* Ensure touch and pointer event listeners on control surfaces:

  * call `event.preventDefault()`
  * use `{ passive: false }` where necessary (especially on iOS Safari)

## Acceptance criteria

* Stage spawns exactly **2 enemies**.
* Enemies start far enough away that the player must fly to engage.
* Player always has a clear directional cue to enemies (no confusion at start).
* Long-press, drag, or hold gestures do **not** select text or trigger browser UI.
* Touch controls feel uninterrupted on iOS Safari and Android Chrome.
* No console errors.

## Testing notes

* Mobile test:

  1. Load stage and observe no nearby enemies at spawn.
  2. Confirm arrow indicator points toward enemy direction immediately.
  3. Fly toward enemy and engage normally.
  4. Tap and hold on screen; confirm no text selection or callout appears.
  5. Drag controls aggressively; confirm no page scroll or zoom.

## Affected files (expected)

* `content/stages/stage_001.json`
* main CSS file or `index.html` style block
* UI/input-related modules (only if missing `preventDefault`)

## Follow-ups

* v0.1 polish checkpoint
* Optional: camera shake and hit feedback
* Optional: difficulty ramp for later stages
