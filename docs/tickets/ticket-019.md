# Ticket 019: Add shooting VFX (laser + missile) with mobile-friendly effects

## Context

Weapons currently work mechanically but have little or no visual feedback. We need lightweight VFX so firing feels responsive:

* muzzle flash / emitter at ship
* visible laser beam or tracer
* impact spark on hit
* missile launch flash and missile trail (if missile exists)

Must remain mobile-friendly and avoid heavy postprocessing.

## Goal

Add minimal but satisfying visual effects for:

* Laser firing
* Missile firing
* Hit impact feedback

## Scope

### Included

* Laser:

  * short-lived beam/tracer (line or thin cylinder)
  * small muzzle flash sprite
  * impact spark at hit point
* Missile:

  * launch flash sprite
  * simple trail (line strip or particle points)
  * optional explosion sprite on hit (if missile damage exists)
* Object pooling for transient VFX

### Excluded

* Complex volumetric effects
* Bloom pipelines
* High-particle-count systems

## Tasks

### 1. VFX primitives and pooling

* Implement a small VFX pool module:

  * `spawnBeam(origin, dir, length, ttl)`
  * `spawnSprite(position, size, ttl, kind)`
  * `spawnImpact(position, normal, ttl)`
* Use instanced meshes or reused objects where possible.

### 2. Laser visuals

On `WeaponFired` (laser):

* render a beam for ~50–80 ms
* render a muzzle flash sprite for ~80–120 ms
  If hit:
* render impact spark at hit point
* optional brief enemy flash tint (cheap)

### 3. Missile visuals

On `WeaponFired` (missile):

* show launch flash
* ensure missile entity has a trail renderer
  On missile impact:
* show explosion sprite

### 4. Tuning parameters

Add to `tuning.ts`:

* `laserBeamTtlMs`, `laserBeamWidth`
* `muzzleFlashTtlMs`
* `impactSparkTtlMs`
* `missileTrailLength`, `missileTrailTtlMs`

## Acceptance criteria

* When firing laser, player sees beam and muzzle flash immediately.
* When laser hits, impact spark appears at the correct location.
* When firing missile, player sees launch flash and a visible trail.
* Effects are pooled (no per-shot allocations that cause GC spikes).
* No major FPS regression on mobile.

## Testing notes

* Fire repeatedly for 10+ seconds and confirm no stutter/GC spikes.
* Aim at enemies and confirm impact effects appear consistently.
* On mobile, confirm effects are visible but not too bright.

## Affected files (expected)

* `src/engine/renderer/vfx/` or `src/game/vfx/`
* `src/game/systems/weapon_system.ts`
* `src/game/systems/projectile_system.ts` (missiles)
* `src/game/events/events.ts` (if needing hit point in event payload)
* `src/game/tuning.ts`
