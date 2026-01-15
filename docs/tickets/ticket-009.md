# Ticket 009: Weapons + damage pipeline (laser first, missile stub)

## Context
Stage completion currently depends on a dev-kill path. To reach first playable, we need real combat:
player fires, hits enemies, enemies die, `EnemyKilled` is emitted, and StageSystem completes KillAll.

References:
- docs/architecture.md: Sections 11 (Targeting), 12 (Weapons and damage pipeline)
- Ticket 005 (Event bus), Ticket 006 (Content), Ticket 007 (Stage), Ticket 008 (AI)

## Goal
Implement a minimal weapon and damage pipeline:
- Primary weapon: Laser (hitscan recommended)
- Apply damage to shield then health
- Enemy death triggers cleanup + events
- Stage completes without dev-kill

## Scope
Included:
- Weapon framework interface and PlayerWeaponSystem
- Laser weapon driven by `InputState.firePrimary`
- Hitscan raycast against enemy hit volumes (bounding sphere is enough v0.1)
- DamageSystem: shield -> health -> death
- Emit events: `WeaponFired`, `PlayerDamaged` (optional), `EnemyKilled`
- Remove or disable dev-kill path by default (keep behind debug flag)

Excluded:
- Enemy weapons (later)
- Missiles full implementation (stub ok)
- Complex VFX

## Tasks
- Define components:
  - `WeaponSlots` (player): active weapon id, cooldown/heat state
  - `HitSphere` (enemy): radius for hitscan test
  - Ensure enemies have `Health`, `Shield`, `EnemyTag`
- Implement `WeaponSystem`:
  - Read `InputState`
  - Look direction comes from player ship forward vector
  - Laser: heat model; if overheated, no fire
  - On fire, compute hit:
    - intersect ray (origin = ship position, dir = forward) with each enemy HitSphere
    - choose nearest hit
  - Publish `WeaponFired`
  - If hit, publish `DamageEvent` internally or call DamageSystem API (prefer event)
- Implement `DamageSystem`:
  - Apply to shield then health
  - On death:
    - publish `EnemyKilled(entityId, byEntityId)`
    - destroy enemy entity and remove renderable
- Wire StageSystem:
  - consume `EnemyKilled` events to update KillAll objective
- Add minimal feedback:
  - hit marker flash (DOM overlay) and/or enemy flash color (cheap)

## Acceptance criteria
- Holding Fire shoots laser repeatedly with heat constraint.
- When aiming at an enemy, hits reduce shield/health and eventually kill it.
- Enemy death emits `EnemyKilled`, reduces stage remaining count, and stage completes when all are dead.
- No console errors on mobile.
- Performance remains stable with 2–5 enemies.

## Testing notes
- Start `stage_001`
- Aim at enemy, hold Fire
- Confirm enemy HP decreases and enemy disappears at 0 HP
- Confirm stage completes normally and credits awarded
- Verify heat prevents infinite firing

## Affected files (expected)
- src/game/weapons/* (laser.ts, weapon_types.ts)
- src/game/systems/weapon_system.ts
- src/game/systems/damage_system.ts
- src/game/components/weapon_slots.ts
- src/game/components/hit_sphere.ts
- src/game/systems/index.ts
- src/game/systems/stage/* (consume EnemyKilled)

## Follow-ups
- Ticket 010: Targeting assistant (selection + UI)
- Later: missiles, enemy firing, VFX polish
