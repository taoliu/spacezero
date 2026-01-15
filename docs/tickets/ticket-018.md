# Ticket 018: Extend engagement range (targeting + weapon range)

## Context

Currently, crosshair/targeting and effective shooting appear only when enemies are very close. For the sandbox design with far spawns, the player must be able to:

* acquire targets at longer range
* fire and hit targets at longer range (within reason)

This requires adjusting both targeting thresholds and weapon hit tests.

## Goal

Increase engagement range so that:

* target indicators/crosshair can appear for distant enemies
* laser hitscan can reach farther targets
* missile lock/targeting (if implemented) works at longer range

## Scope

### Included

* Increase targeting selection radius / assist cone behavior for distant targets
* Increase weapon max range for laser hitscan
* Ensure HUD target indicator appears at distance
* Add tuning parameters for range limits

### Excluded

* Ballistic drop / lead prediction
* Zoom optics

## Tasks

### 1. Add tuning parameters

In `src/game/tuning.ts`:

* `weaponLaserMaxRange` (e.g. 1500)
* `targetingMaxAcquireDistance` (e.g. 2000)
* `targetingAssistConeDeg` (if not already)
* `targetingScreenRadiusPx` or normalized threshold (if used)

### 2. Update weapon range checks

In laser hitscan:

* ignore enemies beyond `weaponLaserMaxRange`
* ray-sphere intersection should consider range

### 3. Update targeting selection rules

* Do not require the enemy to be very close in world space to be targetable.
* Use a max distance cap, but set it far enough.
* Ensure the off-screen arrow still points to nearest enemy even at distance.

### 4. Ensure crosshair/indicator behavior

* If crosshair visibility is tied to “has target nearby”, relax it:

  * allow crosshair always visible
  * show target brackets when target exists

## Acceptance criteria

* At stage start (far spawns), player immediately sees direction cue.
* When aiming near a distant enemy, target brackets/crosshair appear and remain stable.
* Laser can hit enemies at noticeably longer distance than before.
* No major FPS regression.

## Testing notes

* Spawn enemies at 250–400 units away.
* Confirm target indicator appears.
* Fire laser and confirm hits register before closing to point-blank.

## Affected files (expected)

* `src/game/tuning.ts`
* `src/game/systems/targeting_system.ts`
* `src/game/systems/weapon_system.ts` (laser)
* HUD overlay modules
