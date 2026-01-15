# Architecture

## 1. Purpose
This document defines the architecture for a mobile-first browser FPS space shooter with a sandbox stage structure (few but smart enemies). It is written for coding agents to implement consistently.

Primary goals:
- Mobile performance first (stable frame time, low GC).
- Data-driven content (stages, enemies, weapons, upgrades).
- Expandable systems (new weapons, AI brains, objectives) without refactoring core loops.
- Deterministic-enough gameplay to debug and reproduce issues.

Non-goals (v1):
- Full rigid-body physics.
- Multiplayer.
- WebXR.


## 2. Tech stack
- Rendering: Three.js (WebGL2)
- Build: Vite + TypeScript
- Runtime: ECS-like components + systems (custom, minimal)
- UI: DOM overlay for HUD/menus (fast iteration), optional Canvas2D for some HUD later
- Audio: WebAudio
- Storage: localStorage (v1) with versioned saves; optional IndexedDB later


## 3. Top-level design
The game is structured as:
- **Engine layer**: rendering, timing, input, ECS primitives, asset loading, audio.
- **Game layer**: gameplay systems (flight, weapons, AI, targeting, stages, progression).
- **Content layer**: JSON/TS data for weapons, upgrades, enemies, stages.

Key architectural rules:
1. No gameplay logic inside rendering code.
2. Systems operate on components only, avoid direct cross-system calls.
3. All tunables live in one place (`src/game/tuning.ts`) or in data files.
4. Allocate at load time when possible; use object pools for transient entities.


## 4. Repository structure
Recommended structure:

```
src/
  main.ts
  engine/
    ecs/
      world.ts
      entity.ts
      components.ts
      query.ts
    time/
      clock.ts
    input/
      input_manager.ts
      touch_sticks.ts
      gyro.ts
    assets/
      asset_manager.ts
      registry.ts
    audio/
      audio_manager.ts
    renderer/
      renderer.ts
      camera.ts
      postfx.ts
  game/
    tuning.ts
    events/
      bus.ts
      events.ts
    data/
      schemas.ts
      content_loader.ts
    components/
      index.ts
    systems/
      index.ts
      flight_system.ts
      targeting_system.ts
      weapon_system.ts
      projectile_system.ts
      damage_system.ts
      shield_system.ts
      ai/
        perception_system.ts
        decision_system.ts
        steering_system.ts
        tick_scheduler.ts
      stage/
        stage_system.ts
        objective_system.ts
        loot_system.ts
      ui/
        hud_system.ts
        menu_system.ts
      debug/
        debug_overlay_system.ts
    weapons/
      weapon_types.ts
      laser.ts
      missile.ts
    ai/
      brains.ts
      utilities.ts
    progression/
      upgrades.ts
      economy.ts
      save.ts
    scenes/
      boot.ts
      menu.ts
      battle.ts
      upgrade.ts
public/
  assets/
    models/
    textures/
    audio/
content/
  weapons.json
  upgrades.json
  enemies.json
  stages/
    stage_001.json
    stage_002.json
```

Notes:
- `content/` is loaded at runtime (fetch) in production. During development it can be imported as TS objects.
- Avoid circular imports by keeping types in `game/data/schemas.ts`.


## 5. ECS model
We use a minimal ECS style.

### Entities
- An entity is an integer ID.

### Components
- Components are plain objects or structured typed arrays.
- Favor SoA/typed arrays for hot paths if needed (projectiles, transforms). Start with simple objects and optimize later.

Core components (v1):
- `Transform`: position, rotation, velocity (and optional angular velocity)
- `Renderable`: mesh handle / instance ID
- `PlayerTag`, `EnemyTag`
- `Health`: hp, maxHp
- `Shield`: shield, maxShield, regenRate, regenDelay
- `WeaponSlots`: list of weapon IDs / cooldown states
- `Targeting`: currentTarget, lockProgress, lastSwitchTime
- `AIState`: archetype, blackboard, timers
- `StageActor`: used by stage/objective logic
- `Lifetime`: ttl for temporary entities (explosions)

### Systems
Systems are pure update functions:
- `update(world, dt)`
- They query entities by component presence.

System ordering is explicit (see `src/game/systems/index.ts`).


## 6. Frame loop and time
`Clock` supplies:
- `dt` clamped to avoid spiral of death (ex: max 1/20 sec).
- `fixedDt` optional (not required v1).

Update order (typical):
1. Input
2. Stage/Objectives
3. AI perception (low rate)
4. AI decision (lower rate)
5. AI steering (higher rate)
6. Flight/Movement integration
7. Targeting assistant
8. Weapons/Projectiles
9. Damage/Shield
10. UI/HUD
11. Debug overlay
12. Render


## 7. Event bus and hooks
Use a typed event bus to decouple systems.

### Event types (v1)
- `StageStarted(stageId)`
- `StageCompleted(stageId)`
- `ObjectiveCompleted(objectiveId)`
- `EnemySpawned(entityId, archetypeId)`
- `EnemyKilled(entityId, byEntityId)`
- `PlayerDamaged(amount, sourceEntityId)`
- `WeaponFired(weaponId, byEntityId)`
- `TargetChanged(fromEntityId, toEntityId)`
- `PickupCollected(pickupId, byEntityId)`

Rules:
- Systems publish events; subscribers read events during their update.
- Events are collected per frame, then cleared.

Stage hooks:
- Stage scripts can be implemented as data-driven rules that listen to these events.


## 8. Data-driven content
All content is defined by schemas (TypeScript types) and loaded by `ContentLoader`.

### Weapon definition (example fields)
- `id`, `name`, `type` (laser/missile)
- `baseDamage`, `fireRate`, `heatPerShot`, `coolRate` (laser)
- `lockRequired`, `lockTime`, `ammoMax`, `reloadTime` (missile)
- `projectile` or `hitscan` config

### Upgrade definition
- `id`, `name`, `cost`
- `effects`: list of effect descriptors

Effect descriptor pattern:
- `target`: `weapon:laser`, `weapon:missile`, `ship`, `targeting`
- `stat`: string key (ex: `damage`, `fireRate`, `assistConeDeg`)
- `op`: `add`, `mul`, `set`
- `value`: number

### Enemy archetype
- `id`, `name`
- `stats`: hp, shield, speed, turnRate
- `weapons`: loadout IDs
- `ai`: behavior parameters (aggression, preferredRange, dodgeRate, accuracy)
- `counters`: ECM strength, lockBreakChance

### Stage definition (sandbox)
- `id`, `name`
- `arena`: bounds, hazards (asteroids, nebula), visibility
- `enemies`: list of spawns (archetype, level, count, spawn points)
- `objectives`: list (type, params)
- `rewards`: credits, loot tables
- `reinforcements`: optional rules (only if stuck)

Validation:
- Validate content on load. Fail fast with clear error messages.


## 9. Sandbox stage system
Stages are small encounters:
- Few enemies (3–8) with stronger stats and better AI.
- Objectives drive variety.

StageSystem responsibilities:
- Load stage data
- Spawn enemies and stage actors
- Track objective states
- Emit stage events

ObjectiveSystem responsibilities:
- Implement objective types:
  - `KillAll`
  - `DefendBeacon(timeSeconds)`
  - `DisableJammer(nodes)`
  - `ScanDebris(n)`


## 10. AI architecture (few smart enemies)
Use a 3-layer AI with tick scheduling.

### Perception (10 Hz typical)
- Compute visibility (cheap line-of-sight)
- Compute distances and relative angles
- Compute threat score
- Update blackboard fields

### Decision (5 Hz typical)
Use a utility-based selector:
- Candidate actions: `Attack`, `Flank`, `Evade`, `Retreat`, `Reposition`, `CallSupport`
- Each action has a score from blackboard and archetype params
- Choose highest score, apply hysteresis to prevent thrashing

### Steering (30–60 Hz)
- Seek/orbit/strafe around player
- Avoid hazards (simple sphere casts)
- Optional separation for swarms

### AI LOD
- Full AI only when within engagement range
- Far enemies update less often or follow simple patrol


## 11. Targeting assistant
Goal: auto-select targets close to crosshair and provide mild assist.

### Target selection
Each frame:
1. Project enemy positions to screen
2. Compute distance to crosshair center
3. Filter by cone/radius threshold and visibility
4. Score candidates (screen distance primary, world distance secondary, threat optional)
5. Apply hysteresis (sticky target)

### Assist modes
- Soft lock: apply limited rotation toward target direction
- Projectile magnetism: small adjustment within cone

Counterplay:
- Elite enemies can reduce assist via ECM:
  - smaller cone
  - lock breaks on ECM burst

All parameters live in tuning or enemy counters.


## 12. Weapons and damage pipeline
Weapons are implementations of a shared interface.

### Weapon interface
- `update(dt)`
- `tryFire(context)`
- `getHudState()`

Laser:
- Heat model: build heat per shot, cool over time, overheat lockout

Missile:
- Requires active target and lock progress
- Lock time affected by upgrades and enemy ECM

DamageSystem:
- Apply damage to shield first, then health
- Emit `EnemyKilled` and `PlayerDamaged`

Object pooling:
- Projectiles, explosions, hit markers


## 13. Progression and upgrades
Economy:
- Credits awarded by stage completion, objectives, kills

Upgrades:
- Applied as modifiers to stats
- Prefer additive and multiplicative modifiers, avoid hard-coded special cases

Between-stage UI:
- Show credits, available upgrades, current build summary


## 14. Saving
Save goals:
- Versioned schema with migrations
- Store meta progression and last known build

Suggested save fields:
- `saveVersion`
- `unlockedWeapons`
- `purchasedUpgrades`
- `options` (input mode, sensitivities, quality)


## 15. Debugging and tuning
Debug overlay (toggle):
- FPS and frame time
- Entity counts (enemies, projectiles)
- Current target ID and score components
- AI current action per enemy (nearby)
- Assist cone visualization

Tuning workflow:
- Centralize constants in `tuning.ts`
- Allow overriding tuning via query string in dev (optional)


## 16. Performance constraints
Targets:
- 60fps on mid-range phones, degrade gracefully

Rules:
- Limit draw calls (instancing for repeated enemy meshes)
- Avoid expensive postprocessing by default
- Avoid per-frame allocations on hot paths
- Use tick scheduling for AI
- Use pools for transient entities


## 17. Coding conventions for agents
- TypeScript strict mode.
- No hidden singletons; pass references (world, content, bus).
- Avoid side effects across systems; communicate via components/events.
- Every new feature must list:
  - data schema impact
  - tuning parameters
  - acceptance checks

