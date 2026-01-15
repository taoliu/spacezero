# Ticket 005: Typed event bus and lifecycle hooks

## Context

As we add stages, objectives, AI, weapons, targeting, and upgrades, systems must communicate without direct calls. The architecture requires a typed event bus with per-frame queues and clear lifecycle semantics.

This ticket introduces the event bus and wires it into the `GameContext` so systems can publish and consume events safely.

References:

* `docs/architecture.md`: Section 7 (Event bus and hooks)
* `docs/milestones/v0.1-foundation.md`: Technical foundation deliverable

## Goal

Implement a lightweight, typed event bus with:

* per-frame event collection
* publish/consume APIs
* clear rules about when events are visible
* stage hook support (events as integration points)

## Scope

### Included

* `EventBus` implementation in `src/game/events/`
* Event type definitions in `src/game/events/events.ts`
* Integration into `GameContext`
* Scheduler wiring to clear events each frame
* Example usage in at least one system (publish + read)
* Unit tests for event ordering and clearing semantics

### Excluded

* Full stage scripting language
* Persistent event logs/replay recording
* Networking/multiplayer messaging

## Tasks

* Create event definitions:

  * `src/game/events/events.ts`
  * Define a discriminated union type `GameEvent`:

    * `StageStarted`, `StageCompleted`
    * `ObjectiveCompleted`
    * `EnemySpawned`, `EnemyKilled`
    * `PlayerDamaged`
    * `WeaponFired`
    * `TargetChanged`
    * `PickupCollected`
  * Each event has a `type` string and typed payload fields.

* Implement the bus:

  * `src/game/events/bus.ts`
  * Requirements:

    * `publish(event: GameEvent): void`
    * `drain(): ReadonlyArray<GameEvent>` (returns events published since last drain)
    * `peek(): ReadonlyArray<GameEvent>` (optional)
    * `clear(): void`
  * Semantics:

    * Events are collected during a frame.
    * Systems may read events from the current frame.
    * At the end of the frame, events are cleared.

* Wire into context:

  * Add `eventBus` to `GameContext`
  * Ensure systems receive `ctx.eventBus`

* Decide and enforce a read pattern:

  * Option A (recommended): scheduler drains once per system update and passes events snapshot
  * Option B: each system calls `ctx.eventBus.drain()` at start; but this may create coupling

  For v0.1, use a simple and explicit pattern and document it in code comments.

* Add an example system demonstrating correct usage:

  * Example: `DebugEventLogSystem` that reads events and shows counts in overlay
  * Example: `FlightSystem` publishes `PlayerDamaged`? (not yet)
  * Prefer a dedicated small system that publishes a test event on a timer.

* Add unit tests:

  * events are received in publish order
  * `drain()` empties the queue
  * `clear()` empties the queue
  * events do not persist across frames (simulate by calling clear)

## Acceptance criteria

* Event types are defined as a discriminated union with strict typing.
* EventBus supports publish + per-frame collection.
* Events can be consumed by systems without direct system-to-system calls.
* Events are cleared at the correct point in the frame.
* Unit tests cover ordering and clearing semantics.
* No console errors.

## Testing notes

* Run unit tests for bus semantics.
* Run the app and confirm:

  * the example system produces at least one visible indication (overlay log or console) that events are flowing
  * events do not accumulate indefinitely

## Affected files (expected)

* `src/game/events/events.ts`
* `src/game/events/bus.ts`
* `src/game/systems/index.ts` (scheduler integration)
* `src/game/systems/debug_event_log_system.ts` (or similar)
* test files under `src/` or `tests/`

## Follow-ups

* Ticket 006: Content schemas and loader (weapons/enemies/stages)
* Ticket 007: Stage system emits `StageStarted/Completed`
* Ticket 008: Enemy spawning emits `EnemySpawned`
* Ticket 009: Weapons emit `WeaponFired`, targeting emits `TargetChanged`
