# Ticket 007: Stage system (sandbox encounter) + KillAll objective

## Context

With the event bus (Ticket 005) and content loader (Ticket 006), we can implement the sandbox stage flow. Stages define a small curated encounter: arena, enemy spawns, objectives, and rewards.

This ticket delivers the first end-to-end stage lifecycle:

* start stage
* spawn stage entities
* evaluate objectives
* complete stage and emit events

References:

* `docs/architecture.md`: Section 9 (Sandbox stage system), Section 7 (Events), Section 8 (Content)
* `docs/milestones/v0.1-foundation.md`: Single sandbox stage end-to-end

## Goal

Implement `StageSystem` and a minimal `ObjectiveSystem` to run `stage_001`:

* Load selected stage from content
* Emit `StageStarted`
* Spawn the stage-defined enemies (using a placeholder spawner if needed)
* Track and complete a `KillAll` objective
* Emit `StageCompleted` and award credits (tracked in a simple runtime state)

## Scope

### Included

* Stage runtime state machine: `Idle -> Running -> Completed`
* Stage selection (default to `stage_001`)
* Enemy spawning from stage definition (count and archetype)
* Objective evaluation:

  * `KillAll`
* Event emission:

  * `StageStarted(stageId)`
  * `StageCompleted(stageId)`
  * `EnemySpawned(entityId, archetypeId)`
  * `EnemyKilled(entityId, byEntityId)` (consumed from later systems, but stage should handle it)
* Minimal UI hook:

  * show stage name and objective status on overlay (simple DOM text is fine)

### Excluded

* Multiple objective types beyond `KillAll`
* Reinforcements logic
* Loot drops
* Save/persistence
* Complex menus (only minimal start/restart)

## Tasks

* Create stage modules under `src/game/systems/stage/`:

  * `stage_system.ts`
  * `objective_system.ts`
* Define runtime state types:

  * `StageRunState` with `status`, `stageId`, `startTime`, `killedEnemies`, `spawnedEnemyIds`, `creditsAwarded`
* Implement stage selection:

  * default `stage_001`
  * optionally allow query string override `?stage=stage_001`
* Implement stage start flow:

  * on first update (or on a Start button), transition to Running
  * emit `StageStarted`
  * spawn enemies defined in the stage
* Enemy spawning integration:

  * Create a minimal `EnemyFactory.spawn(archetypeId, position)` that:

    * creates an ECS entity with `EnemyTag`, `Transform`, `Health`, `Shield` (if defined)
    * assigns `AIState` placeholder (real AI in later ticket)
    * creates a simple renderable mesh so enemies are visible
  * Emit `EnemySpawned` for each
  * If stage spawn points are not defined, spawn in a ring in front of the player
* Objective evaluation:

  * Implement `KillAll`:

    * objective completes when all spawned enemy entities are destroyed
    * stage completion triggers once objective completes
  * Consume `EnemyKilled` events when available; otherwise detect via entity existence (fallback) to keep v0.1 moving
* Stage completion:

  * compute reward credits from stage def
  * store credits in a simple runtime `EconomyState` in context or a singleton component
  * emit `StageCompleted`
* Add a minimal overlay text:

  * Stage name
  * Remaining enemies
  * Status: Running/Completed
  * Credits earned this stage
* Provide restart behavior:

  * Add a simple `Restart` button that resets stage state and respawns
  * Ensure cleanup: remove spawned enemy entities and any stage actors

## Acceptance criteria

* On boot, the game loads `stage_001` and starts (auto-start or via Start button).
* Enemies spawn visibly in the arena.
* Stage overlay shows remaining enemies.
* When all enemies are destroyed (temporary kill method allowed, see testing), stage completes:

  * emits `StageCompleted`
  * credits are awarded and displayed
* Restart resets the stage and respawns enemies.
* Stage system uses content definitions (no hard-coded enemy counts).
* No console errors.

## Testing notes

Because full weapons/damage may not exist yet, provide a temporary kill path:

* Option A (recommended): Tap on an enemy to instantly destroy it (dev-only)
* Option B: Press a debug key to destroy the current target/enemy under crosshair

Manual test:

1. Load stage and confirm 3–5 enemies spawn.
2. Use dev kill method to destroy enemies.
3. Confirm remaining count decreases.
4. After last enemy, confirm Completed status and credits displayed.
5. Press Restart and confirm enemies respawn and status resets.

## Affected files (expected)

* `src/game/systems/stage/stage_system.ts`
* `src/game/systems/stage/objective_system.ts`
* `src/game/systems/index.ts` (register systems)
* `src/game/entities/enemy_factory.ts` (or similar)
* `src/game/components/` (EnemyTag, Health, Shield, AIState if not existing)
* overlay UI files (if needed)

## Follow-ups

* Ticket 008: Enemy AI (perception/decision/steering) wired to archetypes
* Ticket 009: Weapon system + damage pipeline (remove dev kill)
* Ticket 010: Targeting assistant UI integrated with stage enemies
* Ticket 011: Proper economy + upgrade screen between stages
