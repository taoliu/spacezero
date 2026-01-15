# Ticket 008: Enemy AI skeleton (perception + decision + steering with tick scheduling)

## Context

Sandbox stages use a small number of tougher enemies, so AI quality matters more than enemy count. We need the AI framework defined in `docs/architecture.md`:

* perception, decision, steering layers
* tick scheduling and basic LOD
* parameterized behavior by archetype

This ticket wires enemies spawned by the stage system into an AI loop that produces visible, readable behaviors.

References:

* `docs/architecture.md`: Section 10 (AI architecture), Section 9 (Stage system)
* `content/enemies.json`: archetype AI parameters (from Ticket 006)
* `docs/milestones/v0.1-foundation.md`: Enemy AI (v1)

## Goal

Implement a minimal but extensible enemy AI framework:

* PerceptionSystem (low rate)
* DecisionSystem (lower rate) using utility scoring
* SteeringSystem (high rate) to produce movement goals
* TickScheduler to control update frequencies and LOD

Enemies should:

* acquire the player as a target
* approach and orbit within a preferred range
* occasionally evade (simple dodge) based on parameters

## Scope

### Included

* AI components:

  * `AIState` with `archetypeId`, `currentAction`, timers
  * `Blackboard` fields (player distance, visible, threat)
  * `SteeringIntent` (desired velocity / desired direction)
* AI systems:

  * `tick_scheduler.ts`
  * `perception_system.ts`
  * `decision_system.ts`
  * `steering_system.ts`
* Parameter binding from `EnemyArchetypeDef.ai`
* Simple LOD:

  * far enemies update decision less often
* Debug overlay support:

  * show current action for nearest enemy

### Excluded

* Advanced obstacle avoidance
* Formations
* Coordinated squad tactics
* Weapon firing by enemies (can be later)

## Tasks

* Add components under `src/game/components/`:

  * `ai_state.ts`: archetypeId, action, actionUntil, rngSeed?
  * `blackboard.ts`: playerVisible, playerDistance, relAngle, lastSeenTime
  * `steering_intent.ts`: desiredVel (Vector3) or desiredDir+speed
* Implement tick scheduler:

  * `src/game/systems/ai/tick_scheduler.ts`
  * Provide helpers:

    * `shouldRun(entityId, channel, now): boolean`
  * Channels and default rates:

    * perception: 10 Hz
    * decision: 5 Hz
    * steering: 30–60 Hz
  * LOD:

    * if distance > `aiLodDistance`, reduce decision to 2 Hz
* Implement PerceptionSystem:

  * For each enemy:

    * compute distance to player
    * compute if within FOV cone (cheap)
    * set `playerVisible` (no raycast required v0.1)
    * update blackboard
* Implement DecisionSystem:

  * Utility-based action selection with hysteresis
  * Actions (v0.1):

    * `Approach`
    * `Orbit`
    * `Evade`
    * `Retreat` (optional)
  * Use archetype params:

    * aggression
    * preferredRange
    * orbitStrength
    * dodgeRate
    * bravery
  * Prevent thrashing:

    * minimum action duration (e.g. 0.5–1.5s)
* Implement SteeringSystem:

  * Convert chosen action into steering intent:

    * Approach: move toward player until preferred range
    * Orbit: lateral velocity around player while maintaining range
    * Evade: short lateral burst away from player forward axis
  * Write intent as desired velocity in world space
* Integrate with movement:

  * Add an `EnemyMovementSystem` or reuse a generic movement integrator:

    * apply steering intent to enemy velocity with damping
    * update transform position
  * Keep enemy speed/turn rate from archetype stats
* Wire systems into scheduler order:

  * Perception -> Decision -> Steering -> Movement
* Add tuning parameters:

  * `aiPerceptionHz`, `aiDecisionHz`, `aiSteeringHz`
  * `aiLodDistance`
  * `aiMinActionDurationSec`
* Add debug display:

  * show nearest enemy action and distance

## Acceptance criteria

* Enemies spawned by StageSystem move using AI (visible behavior).
* At least one archetype parameter (preferredRange) affects behavior.
* AI runs with staggered ticks (verified by debug counters/logs).
* Enemies approach player, then orbit instead of ramming continuously.
* No major FPS regression on mobile with 3–5 enemies.
* No console errors.

## Testing notes

* Mobile test:

  1. Start stage_001.
  2. Observe enemies moving toward you.
  3. When near, observe orbiting behavior.
  4. Wait and observe occasional evade bursts.
  5. Enable debug overlay and confirm action labels change.

* Parameter test:

  * Change `preferredRange` in `content/enemies.json` and confirm behavior changes.

## Affected files (expected)

* `src/game/components/ai_state.ts`
* `src/game/components/blackboard.ts`
* `src/game/components/steering_intent.ts`
* `src/game/systems/ai/tick_scheduler.ts`
* `src/game/systems/ai/perception_system.ts`
* `src/game/systems/ai/decision_system.ts`
* `src/game/systems/ai/steering_system.ts`
* `src/game/systems/ai/enemy_movement_system.ts` (or similar)
* `src/game/systems/index.ts`
* `src/game/tuning.ts`

## Follow-ups

* Ticket 009: Weapon system + damage pipeline (remove dev kill)
* Ticket 010: Targeting assistant selection and UI
* Later: obstacle avoidance and countermeasures
