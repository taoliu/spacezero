# Ticket 010: Targeting assistant + enemy direction indicator (HUD)

## Context
Mobile shooting needs assistance and awareness tools. We need:
- auto-select target near crosshair with hysteresis
- optional soft-lock / magnetism
- HUD indicators including off-screen direction marker

References:
- docs/architecture.md: Section 11 (Targeting assistant)
- Ticket 003 (Input), Ticket 004 (Flight), Ticket 009 (Weapons)

## Goal
Implement target selection and HUD target indicators:
- select best enemy near crosshair
- sticky target
- show target brackets + distance
- show off-screen direction arrow to nearest/active target

## Scope
Included:
- Target selection (screen-space scoring)
- Target stickiness (hysteresis)
- Optional assist (soft rotation cap or mild magnetism)
- HUD:
  - on-screen target box for active target
  - off-screen direction indicator (arrow at screen edge)
  - optional minimap later (excluded)

Excluded:
- Missile lock UI (can be stub)
- Full lead prediction

## Tasks
- Add `Targeting` component (player):
  - currentTargetId, lockProgress, lastSwitchTime
- Implement `TargetingSystem`:
  - for each enemy, project to NDC/screen
  - score by distance to screen center
  - filter by cone/radius threshold and visibility (skip raycast v0.1)
  - apply hysteresis: keep current unless new score better by factor or sticky time expired
  - publish `TargetChanged`
- Implement HUD overlay:
  - draw target brackets for active target (DOM positioned div)
  - show distance text
- Implement off-screen direction arrow:
  - If target is off-screen, compute direction in screen space and clamp to screen edge margin
  - Rotate arrow to point toward target
  - If no active target, point to nearest enemy by distance
- Optional assist:
  - soft lock: small yaw/pitch nudges toward target direction with max deg/sec, gated by assistStrength
  - or magnetism: in WeaponSystem, if target selected, slightly bend ray direction within cone

## Acceptance criteria
- When an enemy is close to crosshair, it becomes active target and stays stable.
- Target brackets appear when target is on-screen.
- If target goes off-screen, an arrow appears at screen edge pointing toward it.
- On mobile, player can locate enemies reliably without guessing.
- No console errors; stable FPS.

## Testing notes
- Start stage, observe arrow points to nearest enemy.
- Turn away so enemy is off-screen: arrow appears and rotates correctly.
- Aim near enemy: target locks and brackets show.
- Fire: hits work as before.

## Affected files (expected)
- src/game/systems/targeting_system.ts
- src/game/components/targeting.ts
- src/game/systems/ui/hud_system.ts (or overlay module)
- src/game/tuning.ts (assistConeDeg, stickyTime, assistStrength)
- src/game/systems/index.ts
