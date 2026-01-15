# Ticket 012: Tune look sensitivity for right controller (touch + gyro)

## Context

After first playable, flight control is functional but **view rotation is too sensitive**, especially on mobile touch input. This causes overshooting and discomfort.

We need to slow down and stabilize look control without changing the control model or introducing new systems.

References:

* `docs/architecture.md`: Input and flight separation
* Ticket 003 (Input abstraction)
* Ticket 004 (Flight controller)

## Goal

Reduce view rotation sensitivity for the right controller (touch and gyro) and make it easier to tune.

## Scope

### Included

* Sensitivity scaling for touch look (right stick)
* Sensitivity scaling for gyro look
* Optional smoothing/damping
* Centralized tuning parameters

### Excluded

* New input modes
* UI settings menu (can be added later)

## Tasks

### 1. Add tuning parameters

Add the following parameters to `src/game/tuning.ts`:

* `lookSensitivityTouch` (default ~0.4)
* `lookSensitivityGyro` (default ~0.25)
* `lookSmoothing` (0–1, default ~0.15)
* `maxLookRateDegPerSec` (clamp, e.g. 120)

### 2. Apply sensitivity scaling

In the flight controller (or look integration code):

* Multiply raw look deltas by sensitivity:

  * `yawDelta *= lookSensitivityX`
  * `pitchDelta *= lookSensitivityY`
* Use **separate scaling** for touch vs gyro based on `InputState.mode`.

### 3. Add rate limiting

Clamp angular velocity:

* Prevent rotation exceeding `maxLookRateDegPerSec * dt`
* This avoids sudden spikes from touch jitter

### 4. Optional smoothing (recommended)

Apply exponential smoothing:

```
smoothed = lerp(prev, current, 1 - lookSmoothing)
```

* Store previous smoothed values in `ShipController` runtime state
* Keep smoothing lightweight (no allocations)

### 5. Debug visibility

* Show current sensitivity mode and values in debug overlay (optional)
* Allow quick tuning by editing `tuning.ts` and hot reload

## Acceptance criteria

* Right-stick look is noticeably slower and more controllable.
* Gyro aiming feels stable and does not overshoot.
* No input lag that makes aiming feel unresponsive.
* Sensitivity values are centralized and easy to tweak.
* No console errors.

## Testing notes

* Mobile test:

  1. Fly ship and rotate using right stick.
  2. Confirm small drags produce small rotations.
  3. Perform fast swipes; confirm rotation is capped.
  4. Switch to gyro mode and rotate phone slowly and quickly.
  5. Confirm no jitter or runaway rotation.

## Affected files (expected)

* `src/game/tuning.ts`
* `src/game/systems/flight_system.ts`
* `src/game/components/ship_controller.ts` (runtime smoothing state)
* debug overlay (if present)

## Follow-ups

* Add user-facing sensitivity sliders (later milestone)
* Per-axis sensitivity tuning (yaw vs pitch)
