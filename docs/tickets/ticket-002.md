# Ticket 002: ECS world and system scheduler (minimal)

## Context

The architecture relies on an ECS-like model where gameplay logic is implemented as systems operating over components. We need a minimal, strict, and testable ECS foundation before adding input, AI, weapons, or stages.

References:

* `docs/architecture.md`: Section 5 (ECS model), Section 6 (Frame loop and time)
* `docs/milestones/v0.1-foundation.md`: Technical foundation deliverable

## Goal

Implement a minimal ECS world with:

* entity creation/destruction
* component add/remove/get
* basic queries by component presence
* explicit system scheduler and update order

Integrate the scheduler into `src/main.ts` so the render loop calls the scheduler.

## Scope

### Included

* `World` with entity IDs and lifecycle
* Component registration/storage mechanism (simple and clear)
* Query helpers for “entities with components A+B+..."
* System interface and scheduler
* One example system (e.g. `SpinSystem` or `SimpleMovementSystem`) to prove integration
* Minimal unit tests for query and component operations (if test runner exists; otherwise add a tiny test setup)

### Excluded

* Performance-optimized SoA/typed-array storage (can be added later)
* Serialization
* Networking
* Full transform math library

## Tasks

* Create ECS primitives under `src/engine/ecs/`:

  * `world.ts`: entity allocation, destroy, component ops
  * `query.ts`: query helpers
  * `types.ts`: shared types
* Define a component model:

  * Components are keyed by a string or symbol ID.
  * Component data is plain object per entity (Map-based) for v0.1.
* Implement:

  * `world.createEntity(): EntityId`
  * `world.destroyEntity(id)`
  * `world.addComponent(id, componentId, data)`
  * `world.removeComponent(id, componentId)`
  * `world.getComponent(id, componentId)`
  * `world.hasComponent(id, componentId)`
* Implement queries:

  * `world.query([componentA, componentB, ...]) -> EntityId[]` (or iterable)
  * Ensure no duplicates, stable behavior
* Implement system scheduler under `src/game/systems/`:

  * `System` interface: `init?(ctx)`, `update(ctx, dt)`
  * `GameContext` containing `world`, `eventBus` placeholder (optional for now), and `tuning` placeholder
  * Explicit ordered list in `src/game/systems/index.ts`
* Integrate into render loop:

  * `main.ts` constructs `world`, `context`, `systems` and calls `systems.update(dt)`
* Add one sample system:

  * Rotate a test mesh entity (proof-of-life)
  * Keep rendering separate; the system should modify a component, renderer reads it

## Acceptance criteria

* ECS supports creating entities and adding/removing/getting components.
* Query returns correct entity sets for combinations of components.
* System scheduler runs systems in a defined order each frame.
* `src/main.ts` uses scheduler, and the sample system visibly changes the scene.
* No console errors.
* Basic tests exist and pass (query + component ops).

## Testing notes

* Run dev server and confirm:

  * the scene renders
  * the sample entity changes over time (rotation or motion)
* Run tests:

  * `pnpm test` (or the configured command)
  * Confirm query correctness and component lifecycle

## Affected files (expected)

* `src/engine/ecs/world.ts`
* `src/engine/ecs/query.ts`
* `src/engine/ecs/types.ts`
* `src/game/systems/index.ts`
* `src/game/systems/<sample_system>.ts`
* `src/main.ts`
* test config files (only if needed)

## Follow-ups

* Ticket 003: Mobile input abstraction and input system
* Ticket 004: Event bus and lifecycle hooks
* Ticket 005: Content schemas and loader
