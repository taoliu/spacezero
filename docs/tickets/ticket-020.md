# Ticket 020: Make weapons respect crosshair target (laser + missile aim assist)

## Context

Currently, even when an enemy is within the crosshair, laser/missile may not reliably hit/lock due to small aim errors and mismatched selection vs firing logic.

We already have:

* Targeting assistant (Ticket 010)
* Weapons + damage pipeline (Ticket 009)

We need to **connect the dots**:

* If a target is within the crosshair (or within the assist cone), weapons should correctly target it.

## Goal

When an enemy is within crosshair/assist window:

* Laser should hit that enemy reliably (within defined assist limits)
* Missile should lock and fire toward the selected target reliably

This must remain tunable and should not create "free aimbot" behavior.

## Scope

### Included

* WeaponSystem reads current selected target from `Targeting` component
* Laser aim assist:

  * slight ray bending (magnetism) toward target center/hit sphere
  * only within a small cone and distance
* Missile target binding:

  * missile uses `targetId` at fire time
  * lock checks use same target selection criteria
* Consistent definitions:

  * what counts as "within crosshair" (screen-space radius and/or angle cone)

### Excluded

* Lead prediction and ballistic simulation
* Auto-aim beyond assist cone

## Tasks

### 1. Define aim assist parameters (tuning)

Add to `src/game/tuning.ts`:

* `aimAssistConeDeg` (e.g. 3–6)
* `aimAssistMaxDistance` (e.g. 1500)
* `aimAssistStrength` (0..1, default ~0.6)
* `aimAssistScreenRadiusPx` (optional, if crosshair is screen-space)

### 2. Unify "within crosshair" definition

* In `TargetingSystem`, expose or compute a boolean:

  * `isInAssistWindow(target)` based on:

    * angle between forward vector and (targetPos - shipPos)
    * optional screen distance to crosshair
* Store in `Targeting` runtime state:

  * `currentTargetId`
  * `currentTargetInWindow: boolean`

This avoids WeaponSystem re-implementing selection logic.

### 3. Laser: use target-aware ray

In `WeaponSystem` laser fire path:

* Compute baseline ray: origin = ship position, dir = ship forward
* If `currentTargetInWindow` and distance <= max:

  * compute target direction = normalize(targetPos - origin)
  * blend direction:

    * `dir = normalize(lerp(forward, targetDir, aimAssistStrength))`
  * additionally clamp to `aimAssistConeDeg` (do not bend beyond cone)
* Perform ray-sphere hit test using the assisted dir

Result: within crosshair, slight deviations still hit the intended target.

### 4. Missile: bind to selected target

* At fire time:

  * if `currentTargetInWindow` (or target exists), set missile `HomingTarget.targetId = currentTargetId`
* Missile guidance (if exists):

  * steer toward target each update
* If missile lock UI exists:

  * lock progress uses same selected target

### 5. Visual confirmation

* When assist engages, provide subtle feedback:

  * small "assist" reticle tick or color change
  * optional short sound (later)

Keep it minimal and mobile-friendly.

### 6. Tests

* Add a pure helper:

  * `computeAssistedAim(forward, targetDir, strength, coneDeg) -> dir`
* Unit tests:

  * strength=0 returns forward
  * strength=1 returns targetDir but clamped by cone
  * cone clamp works

## Acceptance criteria

* If enemy is inside crosshair/assist window, laser shots reliably register hits.
* Missiles fired while target is selected/within window home or lock toward that enemy.
* Assist does not engage when target is outside cone/window.
* Behavior is tunable via `tuning.ts`.
* No console errors; no major FPS regression.

## Testing notes

* Spawn enemy at medium range.
* Slightly offset aim and fire:

  * without assist: would miss
  * with assist: should hit if within cone/window
* Ensure shots miss if target is clearly outside window.
* Fire missile with target selected and confirm it tracks the selected enemy.

## Affected files (expected)

* `src/game/tuning.ts`
* `src/game/components/targeting.ts`
* `src/game/systems/targeting_system.ts`
* `src/game/systems/weapon_system.ts`
* `src/game/systems/projectile_system.ts` (missile homing)
* `src/game/utils/aim_assist.ts` + tests

## Follow-ups

* Lead compensation for fast targets (optional)
* Separate assist strengths for touch vs gyro
