# Ticket 015: Auto-tracing (tap-to-face enemy with smooth steering)

## Context

On mobile, manual aiming and turning can be slow, especially when enemies spawn far away. We want a convenient function: after the player taps/clicks an enemy (or taps a UI element), the ship automatically steers its view to face that enemy.

This should feel like an assistive autopilot:

* smooth rotation toward target
* respects max turn rates
* cancels/overrides when player actively looks

References:

* Ticket 010 (Targeting assistant)
* Ticket 013 (look mapping consistency)
* `docs/architecture.md`: Targeting assistant and system separation

## Goal

Implement an **auto-tracing** feature:

* Player taps an enemy (or taps the off-screen arrow/target indicator)
* The ship rotates to face that enemy smoothly
* Autotrace stops when alignment is reached or player overrides

## Scope

### Included

* Input gesture:

  * tap enemy mesh (raycast) OR tap target UI element to engage autotrace
* Autotrace runtime state:

  * activeTargetId
  * enabled flag
  * strength and stop threshold
* Rotation controller:

  * compute desired yaw/pitch to face target
  * apply limited angular velocity each frame
* Override rules:

  * if player provides significant look input, cancel autotrace
  * if target dies, cancel autotrace

### Excluded

* Full autopilot navigation (position control)
* Collision avoidance

## Tasks

* Add `AutoTrace` component to player entity (or extend `ShipController` runtime state):

  * `enabled: boolean`
  * `targetId: EntityId | null`
  * `strength: number` (0..1)
  * `stopAngleDeg: number` (e.g. 3)
  * `cancelLookThreshold: number` (e.g. absolute look delta)

* Implement `AutoTraceSystem`:

  * If enabled and target exists:

    * compute vector from ship to target
    * compute desired yaw/pitch error relative to ship forward
    * apply rotation step limited by `maxAutoTraceDegPerSec`
    * stop when error < `stopAngleDeg`
  * If target missing/dead -> disable
  * If player look input magnitude > threshold -> disable

* Integrate trigger mechanism:

  * Option A: Tap enemy mesh

    * perform raycast from screen tap to enemy renderables
    * on hit, set AutoTrace target
  * Option B: Tap target indicator UI (simpler if UI already present)

    * if active target exists, enable AutoTrace to it

  Start with Option B (lowest risk) and add Option A if easy.

* Add tuning parameters in `tuning.ts`:

  * `autoTraceMaxTurnDegPerSec` (e.g. 90)
  * `autoTraceStopAngleDeg` (e.g. 3)
  * `autoTraceCancelLookThreshold` (e.g. 0.2)
  * `autoTraceStrength` (e.g. 1.0)

* UI feedback:

  * show a small `AUTO` indicator when autotrace is active

## Acceptance criteria

* When player taps the target UI element (or enemy), the ship rotates to face that enemy.
* Rotation is smooth and capped (no snapping).
* Autotrace cancels when player intentionally looks around.
* Autotrace stops when facing the target within threshold.
* Autotrace cancels if the target is destroyed.
* No console errors on mobile.

## Testing notes

* Start stage with far spawns.
* Observe off-screen arrow.
* Tap target indicator to enable autotrace.
* Confirm ship rotates until enemy is centered.
* While rotating, move right stick strongly; confirm autotrace cancels.
* Kill enemy; confirm autotrace disables.

## Affected files (expected)

* `src/game/components/auto_trace.ts` (or extend ship_controller)
* `src/game/systems/auto_trace_system.ts`
* `src/game/systems/index.ts`
* `src/game/tuning.ts`
* UI overlay module (AUTO indicator and tap handler)

## Follow-ups

* Optional: tap enemy mesh selection via raycast
* Optional: auto-trace also engages missile lock flow
