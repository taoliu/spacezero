# Ticket 023: Visual style upgrade pack (kid-friendly cool combat)

## Context
Tao requested that the game feel more visually exciting and less plain, especially for a child audience that prefers a cool-looking space experience.

This ticket focuses on visual/game-feel improvements without changing core control complexity.

Architecture alignment:
- `docs/architecture.md` section 2 (rendering stack)
- section 3 (no gameplay logic in rendering)
- section 16 (mobile performance constraints)

## Goal
Make the game look significantly more stylish and dynamic while keeping performance suitable for mobile browsers.

## Scope
Included:
- Visual pass for scene mood (lighting/background intensity and contrast)
- Ship/enemy readability upgrades (stronger silhouette + emissive accents)
- Weapon hit feel upgrades (clearer muzzle/impact cues + subtle screen feedback)
- HUD style polish (less plain, more sci-fi cockpit feel)

Excluded:
- New gameplay mechanics (powerups/progression/enemy archetypes)
- Heavy postprocessing pipelines likely to hurt mobile fps
- Large UI architecture refactors

## Tasks
1. Tune scene look to feel punchier and more cinematic while preserving readability.
2. Improve player/enemy material styling for stronger contrast and "cool" visual identity.
3. Upgrade combat VFX timing/colors for more satisfying weapon feedback.
4. Add lightweight screen-space feedback for hits/impact moments (no expensive effects).
5. Polish key HUD elements (target bracket/indicator/hit marker) for a cohesive sci-fi look.
6. Validate no obvious performance regressions and keep frame loop allocation-free in hot paths.
7. Run checks: `pnpm test`, `pnpm typecheck`, `pnpm build`.

## Acceptance criteria
- Visual presentation is clearly less plain and more stylized/cinematic.
- Player can easily distinguish targets and combat events under motion.
- Combat feedback (fire/hit/targeting) feels noticeably more satisfying.
- No new runtime errors.
- Existing tests pass and build succeeds.

## Testing notes
- Manual check on desktop + mobile-sized viewport:
  - verify readability of enemies and HUD during movement
  - verify hit/target feedback is visible but not overwhelming
- Programmatic checks:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm build`

## Affected files (expected)
- `src/main.ts`
- `src/engine/renderer/environment/*`
- `src/engine/renderer/vfx/*`
- `src/game/systems/vfx_system.ts`
- `src/game/systems/hit_marker_system.ts`
- `index.html`

## Follow-ups
- Ticket for gameplay fun pack (power-ups + score combo + wave progression).
