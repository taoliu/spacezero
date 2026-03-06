# Ticket 022: Stability hardening for stage flow, AI turning, and content validation

## Context
Recent review surfaced several correctness risks in core gameplay flow:
- stage overlay control loss in an error path
- AI yaw interpolation taking long rotation arcs near ±π
- permissive content numeric validation that allows invalid runtime values
- objective tracking state coupling that can bleed across stage runtimes

This ticket aligns with architecture goals in `docs/architecture.md`:
- Section 7 (event bus and hooks)
- Section 8 (data-driven content + fail-fast validation)
- Section 16 (performance/stability constraints)

## Goal
Improve runtime robustness without changing core gameplay design by fixing high-impact correctness issues and adding targeted regression tests.

## Scope
Included:
- Fix stage overlay behavior when configured stage is missing
- Normalize enemy yaw turn delta to shortest path
- Strengthen numeric content validation constraints in content loader
- Isolate objective kill-tracking state per stage runtime and filter events by stage spawn list
- Add/extend tests for the above logic

Excluded:
- Stage content discovery refactor (auto-loading all `content/stages/*.json`)
- New gameplay features or balancing changes
- UI redesign beyond bug fix

## Tasks
1. Fix missing-stage overlay path in `StageSystem` to keep control UI mounted.
2. Add shortest-angle yaw delta helper in enemy movement and apply it during turn integration.
3. Harden content loader numeric validators (finite/positive/non-negative/integer constraints) and apply to critical schema fields.
4. Update objective system bookkeeping to maintain per-stage killed sets and ignore unrelated `EnemyKilled` events.
5. Add/update unit tests for:
   - enemy yaw shortest-arc behavior
   - invalid numeric content rejection
   - objective event isolation behavior
6. Run checks: `pnpm test`, `pnpm typecheck`, `pnpm build`.

## Acceptance criteria
- Missing-stage path no longer destroys stage control buttons.
- Enemy yaw interpolation rotates by shortest arc across wrap boundaries.
- Invalid content values (e.g., non-finite numbers, non-positive fire rate, non-integer enemy count) are rejected at load with clear errors.
- Objective tracking does not count kill events from entities outside that stage’s spawned enemy set.
- Tests and typecheck pass; production build succeeds.

## Testing notes
- Unit tests cover new helper logic and validation failures.
- Manual spot check:
  - Run with an invalid `?stage=` query and verify stage overlay remains interactive.
  - Observe enemy turning near yaw wrap boundary in local debug scenario.

## Affected files (expected)
- `src/game/systems/stage/stage_system.ts`
- `src/game/systems/ai/enemy_movement_system.ts`
- `src/game/data/content_loader.ts`
- `src/game/systems/stage/objective_system.ts`
- `tests/content_validation.test.ts`
- `tests/objective.test.ts`
- `tests/enemy_movement.test.ts` (new)

## Follow-ups
- Separate ticket for stage file discovery/index loading (`content/stages/*.json`) and stage catalog expansion.
