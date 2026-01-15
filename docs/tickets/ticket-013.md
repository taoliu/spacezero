# Ticket 013: Fix look axis inversion (touch yaw) and unify sign conventions

## Context

Current behavior: dragging the right controller left causes the view to turn right. This indicates a sign convention mismatch on the horizontal look (yaw) axis.

We need a single, consistent mapping between:

* touch right-stick deltas
* gyro deltas
* ship/camera yaw and pitch updates

The fix must avoid double-inversion (do not flip in multiple layers).

References:

* Ticket 003 (Input abstraction)
* Ticket 004 / 012 (Flight controller and sensitivity tuning)
* `docs/architecture.md`: Input/flight separation

## Goal

Make right-stick touch look behave like standard FPS controls:

* drag right -> look right
* drag left -> look left

Ensure gyro mapping is also correct and stable.

## Scope

### Included

* Fix yaw sign mapping for touch input
* Confirm and correct gyro mapping if needed
* Centralize sign convention in one place (FlightSystem)
* Add optional tuning toggles for inversion (future-proof)
* Add regression tests (lightweight) for sign mapping

### Excluded

* New settings UI
* Major refactors of input modules

## Tasks

### 1. Define a single source of truth for look mapping

* In `src/game/systems/flight_system.ts` (or wherever look is applied), ensure **only this layer** decides sign mapping.
* Input modules (`touch_sticks.ts`, `gyro.ts`) must output raw deltas without gameplay sign assumptions.

### 2. Implement correct yaw mapping

* For touch mode:

  * ensure yaw delta uses the correct sign so that dragging left turns left.
  * typical fix: `yawDelta = -input.lookX * lookSensitivityTouch`
* For gyro mode:

  * verify direction. If turning the phone right currently turns view left, invert there.
  * apply sign fix in the same flight layer, not inside `gyro.ts`.

### 3. Add inversion toggles in tuning (no UI yet)

Add to `src/game/tuning.ts`:

* `invertLookXTouch` (default: false)
* `invertLookYTouch` (default: false)
* `invertLookXGyro` (default: false)
* `invertLookYGyro` (default: false)

Apply them in flight mapping:

* `effectiveX = invert ? -rawX : rawX`

### 4. Keep sensitivity + clamp behavior intact

* Preserve Ticket 012 behavior:

  * `lookSensitivityTouch`, `lookSensitivityGyro`
  * `maxLookRateDegPerSec`
  * smoothing if implemented

### 5. Add a small regression test

* Add a pure function in a utility module, e.g.:

  * `mapLook(rawX, rawY, mode, tuning) -> (mappedX, mappedY)`
* Unit test:

  * touch: rawX = -1 (drag left) maps to yaw that turns left (sign expectation)
  * touch: rawX = +1 maps to yaw that turns right
  * gyro: similar expectation depending on current sign convention chosen

## Acceptance criteria

* Touch right-stick:

  * drag right -> view turns right
  * drag left -> view turns left
* Gyro:

  * rotate phone right -> view turns right
  * rotate phone left -> view turns left
* No double inversion (sign flips happen in one place).
* Existing sensitivity/clamp/smoothing still work.
* Unit test(s) cover sign mapping.
* No console errors on mobile.

## Testing notes

* Mobile manual test (required):

  1. Touch mode:

     * drag right stick left/right and confirm expected turn direction.
  2. Gyro mode:

     * rotate phone right/left and confirm expected view direction.
  3. Stress:

     * quick swipe and confirm clamp still prevents spikes.

## Affected files (expected)

* `src/game/systems/flight_system.ts`
* `src/game/tuning.ts`
* optional: `src/game/utils/look_mapping.ts`
* tests for look mapping

## Follow-ups

* Add user-facing settings sliders/toggles for inversion and sensitivity
