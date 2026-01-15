# Ticket 003: Mobile input abstraction (touch dual-stick + optional gyro)

## Context

We need a mobile-first input layer that supports:

* dual-stick touch controls (move + aim)
* optional gyroscope aiming with calibration and permission handling

Input must be decoupled from gameplay logic. Systems should read a unified `InputState` from the ECS/world rather than touching DOM events directly.

References:

* `docs/architecture.md`: Section 3 (rules), Section 6 (update order), Section 2 (mobile-first)
* `docs/milestones/v0.1-foundation.md`: Input and movement deliverable

## Goal

Implement an input subsystem that produces a normalized `InputState` each frame:

* movement vector (strafe + vertical or forward/throttle placeholder)
* look/aim delta (yaw/pitch)
* fire buttons (primary/secondary)
* boost toggle (optional)

Support two input modes:

1. Touch dual-stick
2. Gyro aim + touch movement (toggle)

## Scope

### Included

* Touch dual-stick UI overlay (DOM)
* Pointer/touch event handling (multi-touch safe)
* Gyro permission request flow (iOS-friendly) and calibration
* `InputManager` that consolidates active mode into one `InputState`
* ECS integration:

  * singleton `InputState` component on a single “InputEntity”
  * `InputSystem` updates it each frame

### Excluded

* Ship flight controller (ticket 004 or later)
* Weapon firing logic
* Settings menu polish (only minimal toggles)

## Tasks

* Create input modules under `src/engine/input/`:

  * `input_manager.ts`: unified state, mode switching
  * `touch_sticks.ts`: two virtual sticks rendering and event handling
  * `gyro.ts`: permission request, calibration, filtered yaw/pitch deltas
* Define `InputState` type (suggested fields):

  * `moveX`, `moveY` (left stick)
  * `lookX`, `lookY` (right stick or gyro)
  * `firePrimary` (boolean)
  * `fireSecondary` (boolean)
  * `boost` (boolean)
  * `mode`: `"touch" | "gyro"`
* Implement a simple on-screen overlay:

  * left stick area (bottom-left)
  * right stick area (bottom-right)
  * buttons: Fire (primary), Missile (secondary), Boost, Gyro toggle, Calibrate
* Implement multi-touch rules:

  * left stick tracks one pointer ID
  * right stick tracks one pointer ID
  * buttons respond to taps (pointer down/up)
  * avoid interference between controls
* Gyro handling:

  * request permission when enabling gyro mode
  * provide calibrate button to set current orientation as neutral
  * apply smoothing/low-pass filter to reduce jitter
  * clamp maximum delta per frame
* ECS integration:

  * create an entity at boot with `InputState` component
  * `InputSystem` updates `InputState` in the world each frame
* Document how to test on iOS Safari (permission and fullscreen constraints).

## Acceptance criteria

* On mobile, dual-stick touch produces stable movement and look values (visible via debug overlay or console log).
* Fire/secondary/boost buttons update `InputState` correctly.
* Gyro mode can be toggled:

  * requests permission when needed
  * after permission, look deltas come from gyro
  * calibration sets neutral orientation
* Input is accessible to gameplay via ECS `InputState` only (no gameplay system reads DOM events directly).
* No console errors on iOS Safari and Android Chrome.

## Testing notes

* Desktop:

  * Use mouse to emulate touch if implemented, or provide a simple fallback (optional).
  * Confirm sticks and buttons update `InputState`.
* Mobile (required):

  1. Open dev server on phone.
  2. Verify sticks appear and dragging each stick changes displayed values.
  3. Tap Fire and Missile buttons and confirm toggling.
  4. Toggle Gyro mode:

     * permission prompt appears (if applicable)
     * after accepting, rotate phone and confirm look values update
  5. Tap Calibrate, then rotate again and confirm neutral baseline changed.

## Affected files (expected)

* `src/engine/input/input_manager.ts`
* `src/engine/input/touch_sticks.ts`
* `src/engine/input/gyro.ts`
* `src/game/components/input_state.ts` (or similar)
* `src/game/systems/input_system.ts`
* `src/game/systems/index.ts`
* `src/main.ts` (boot wiring)

## Follow-ups

* Ticket 004: Flight controller system that consumes `InputState`
* Ticket 005: Event bus
* Ticket 006: HUD v1 to visualize input and ship state
