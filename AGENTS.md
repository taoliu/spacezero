# AGENTS.md

## 1. Role and expectations
You are an AI coding agent working on a mobile-first browser game (spaceship cockpit FPS) implemented with TypeScript + Vite + Three.js.

Your goal is to implement tickets with:
- correct functionality
- stable performance on mobile browsers
- clean, maintainable architecture consistent with `docs/architecture.md`

You must keep changes small and reviewable. Prefer incremental commits.

## 2. Project principles (non-negotiable)
1. **Mobile performance first**
   - Avoid per-frame allocations in hot paths.
   - Use object pools for projectiles, explosions, and transient entities.
   - Use AI tick scheduling (perception/decision/steering at different rates).
2. **Data-driven content**
   - Weapons, upgrades, enemies, and stages must be definable in JSON (or TS objects temporarily).
   - All new gameplay parameters must be in `src/game/tuning.ts` or in content files.
3. **Systems and components**
   - Gameplay logic belongs in systems operating on components.
   - Do not put gameplay logic into rendering code.
   - Do not create “God classes”.
4. **Explicit ordering**
   - System update order must be explicit and documented in `src/game/systems/index.ts`.
5. **Determinism-friendly**
   - Use seeded RNG for spawns/loot where applicable.
   - Avoid time-based randomness that prevents reproduction.

## 3. Development workflow
### Environment
- Node 18+ recommended
- Package manager: `pnpm` (preferred). Use `npm` only if the repo already uses it.

### Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`

### Testing and checks
- If the repo has these configured, run them before finishing a ticket:
  - `pnpm test` (or `pnpm vitest`)
  - `pnpm lint`
  - `pnpm typecheck`
- If not present, add minimal checks when you introduce utilities that can be unit tested
  (for example targeting score, hysteresis, vector math).

## 4. Code style rules
- TypeScript `strict: true`
- Prefer pure functions for math/utility logic.
- Avoid hidden globals and singletons. Pass references (world, content, bus) through constructors or system init.
- Keep modules small. Each file should have a single responsibility.
- Avoid circular imports. Put shared types in `src/game/data/schemas.ts`.

## 5. Architecture references
You must follow `docs/architecture.md`, especially:
- ECS model and system boundaries
- event bus and hooks
- targeting assistant rules
- AI layers with tick scheduling and LOD
- data-driven schemas and validation
- performance constraints

If you need to deviate, document why in the ticket PR description and update `docs/architecture.md`.

## 6. Ticket implementation contract
For each ticket:
1. **Read the ticket acceptance criteria** and restate them in your own words in the PR description.
2. **Implement the minimal working solution** that satisfies acceptance.
3. **Add or update docs** if behavior or schema changes.
4. **Add tests** for non-trivial pure logic (scoring, hysteresis, schema validation).
5. **Self-review**
   - check for allocations in hot loops
   - check system ordering
   - check mobile input works on touch devices
6. **Deliverables**
   - code changes
   - updated docs (if needed)
   - brief “How to test” steps

## 7. Performance rules (practical)
- Prefer instancing for repeated meshes where possible.
- Keep postprocessing off by default.
- Cap entity counts; enforce stage limits.
- Use pooling for:
  - projectiles
  - explosions
  - hit markers
- Avoid creating new vectors/quaternions per frame; reuse temp objects or typed arrays where reasonable.

## 8. Content and schema rules
- Content lives under `content/`:
  - `weapons.json`, `upgrades.json`, `enemies.json`, `stages/*.json`
- All content must validate on load with clear error messages.
- If you add fields, update:
  - `src/game/data/schemas.ts`
  - content loader validation
  - `docs/architecture.md` if it affects extension points

## 9. Safety and compatibility
- Target browsers: iOS Safari and Chrome/Android.
- Avoid APIs that break iOS Safari unless guarded.
- Provide fallback for gyro permissions and calibration.

## 10. Definition of done
A ticket is done when:
- acceptance criteria are met
- basic tests/checks pass
- code follows architecture principles
- no obvious performance regressions are introduced
- documentation updated if required
