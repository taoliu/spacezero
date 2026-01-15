# Ticket 004: Flight controller system (arcade ship movement)

## Context

We now have a unified `InputState` in ECS (Ticket 003). We need ship flight movement that is fun on mobile and forms the basis for combat, targeting, and AI.

The flight model should be arcade style:

* always moving forward at a base speed
* throttle/boost modifies speed
* touch or gyro controls yaw/pitch
* strafe and vertical movement for dodging

References:

* `docs/architecture.md`: Sections 6 (update order), 12 (weapons/damage depend on movement), 16 (performance)
* `docs/milestones/v0.1-foundation.md`: Input and movement deliverable

## Goal

Implement a `FlightSystem` that consumes `InputState` and updates a player ship entity using a stable kinematic model.

## Scope

### Included

* Player ship entity creation (if not present)
* Ship components:

  * `Transform` (position, rotation)
  * `Velocity` (linear velocity)
  * `ShipController` (tunable flight params + runtime cooldowns)
* Arcade kinematics:

  * base forward speed
  * strafe/vertical inputs
  * yaw/pitch from look deltas
  * damping/smoothing
* Boost:

  * speed multiplier
  * cooldown + duration
  * HUD/debug readout for boost state
* Minimal HUD/debug readout for verifying motion (can be DOM overlay)

### Excluded

* Weapons firing
* Collision with environment
* Camera shake/postprocessing
* Advanced aerodynamics or physics

## Tasks

* Add components under `src/game/components/`:

  * `transform.ts`: position (Vector3), rotation (Quaternion or Euler)
  * `velocity.ts`: velocity (Vector3)
  * `ship_controller.ts`: parameters and runtime state
* Add `src/game/systems/flight_system.ts`:

  * Query the player ship entity and the input entity
  * Apply yaw/pitch changes with a max turn rate
  * Compute desired velocity:

    * forward direction * (baseSpeed + throttle/boost)
    * strafe and vertical components in ship-local space
  * Apply damping to smooth motion
  * Integrate position with clamped dt
* Add a `PlayerShipFactory` helper (optional) to create the player ship entity.
* Integrate camera behavior:

  * camera follows ship transform (first-person cockpit view placeholder)
  * keep camera separate from flight logic (renderer reads transform)
* Add tuning parameters in `src/game/tuning.ts` (initial defaults):

  * `baseSpeed`, `strafeSpeed`, `verticalSpeed`
  * `turnRateYaw`, `turnRatePitch`
  * `dampingLinear`, `dampingAngular`
  * `boostMultiplier`, `boostDurationSec`, `boostCooldownSec`
  * `maxDt`
* Add a minimal HUD/debug overlay (or extend existing overlay) to show:

  * speed
  * boost cooldown remaining
  * input mode (touch/gyro)

## Acceptance criteria

* Player ship moves forward continuously when the stage is running.
* Touch/gyro look inputs rotate the ship smoothly (no wild jitter).
* Strafe/vertical inputs translate into lateral/up-down movement.
* Boost increases speed for a limited duration and then enters cooldown.
* Movement remains stable across variable frame rates (dt clamped).
* Camera follows ship in first-person view (placeholder is fine).
* No console errors on mobile.

## Testing notes

* Mobile test (required):

  1. Open the game on phone.
  2. Use sticks to move and aim.
  3. Confirm forward motion is present and controllable.
  4. Hold strafe/vertical and observe lateral/up movement.
  5. Tap Boost and confirm speed changes and cooldown displays.
  6. Switch to gyro mode and verify ship rotation follows phone rotation.

## Affected files (expected)

* `src/game/tuning.ts`
* `src/game/components/transform.ts`
* `src/game/components/velocity.ts`
* `src/game/components/ship_controller.ts`
* `src/game/systems/flight_system.ts`
* `src/game/systems/index.ts`
* `src/main.ts` (entity creation + system wiring)
* HUD/debug overlay files (if extended)

## Follow-ups

* Ticket 005: Event bus
* Ticket 006: HUD v1 (proper ship status)
* Ticket 007: Enemy spawn and AI skeleton
* Ticket 008: Targeting assistant
