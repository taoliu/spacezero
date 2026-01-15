# Ticket 006: Content schemas + loader (weapons, upgrades, enemies, stages)

## Context

To keep the project expandable and sandbox-friendly, core gameplay content must be data-driven. We need strict schemas (TypeScript types + runtime validation) and a loader that can fetch JSON content from `content/`.

This ticket establishes the content pipeline used by later systems:

* stage system (encounters and objectives)
* enemy spawner and AI archetypes
* weapon definitions and upgrade effects

References:

* `docs/architecture.md`: Section 8 (Data-driven content), Section 9 (Stage system), Section 13 (Progression)
* `docs/milestones/v0.1-foundation.md`: Content loading and validation framework

## Goal

Implement:

* TypeScript schemas for weapons, upgrades, enemies, and stages
* Runtime validation with clear error messages
* `ContentLoader` that loads JSON from `content/` and exposes a typed `ContentDB`
* Minimal sample content files to prove loading

## Scope

### Included

* TS types in `src/game/data/schemas.ts`
* Runtime validation (manual or small helper; avoid heavy dependencies unless already used)
* Loader in `src/game/data/content_loader.ts`
* `content/` JSON files:

  * `weapons.json`
  * `upgrades.json`
  * `enemies.json`
  * `stages/stage_001.json`
* Integration in boot flow so the game loads content before entering the battle scene

### Excluded

* Full stage scripting language
* Mod pack loading from user filesystem
* Save migrations tied to content versions

## Tasks

* Create schemas:

  * `src/game/data/schemas.ts`
  * Define discriminated unions where needed:

  Weapons:

  * `WeaponDefBase { id, name, type }`
  * `LaserWeaponDef extends base { baseDamage, fireRate, heatPerShot, coolRate }`
  * `MissileWeaponDef extends base { baseDamage, lockTime, ammoMax, reloadTime }`

  Upgrades:

  * `UpgradeDef { id, name, cost, effects: UpgradeEffectDef[] }`
  * `UpgradeEffectDef { target, stat, op, value }`

  Enemies:

  * `EnemyArchetypeDef { id, name, stats, weapons, ai, counters? }`

  Stages:

  * `StageDef { id, name, arena, enemies, objectives, rewards, reinforcements? }`

* Implement runtime validation:

  * Provide a `validateContent(raw): ContentDB` function
  * Fail fast with readable messages (include file name, entity id, and field)
  * Ensure uniqueness of IDs across each category
  * Ensure referenced IDs exist (enemy weapons reference weapon IDs, etc.)

* Implement `ContentLoader`:

  * `src/game/data/content_loader.ts`
  * Provide API:

    * `loadAll(): Promise<ContentDB>`
    * internally fetch JSON from `content/`
  * In dev, allow fallback to static import if fetch is difficult, but prefer fetch.

* Create minimal sample content:

  * `content/weapons.json`: at least 2 weapons (laser + missile)
  * `content/upgrades.json`: at least 3 upgrades (laser damage, missile lock speed, targeting cone)
  * `content/enemies.json`: at least 1 archetype referencing weapons
  * `content/stages/stage_001.json`: 1 sandbox stage with 3–5 enemies and `KillAll` objective

* Wire into app boot:

  * Ensure content loads before gameplay systems that depend on it
  * Show a simple loading message if needed
  * Store content in `GameContext.content`

* Add tests for validation:

  * duplicate IDs rejected
  * missing referenced weapon ID rejected
  * invalid enum values rejected

## Acceptance criteria

* Content types exist in `schemas.ts` and are used throughout loader output.
* Loader fetches JSON from `content/` and returns typed `ContentDB`.
* Validation catches:

  * missing fields
  * wrong types
  * invalid enums
  * duplicate IDs
  * broken references
* App boots successfully with the sample content.
* Unit tests cover at least 3 validation failure cases.
* No console errors.

## Testing notes

* Run app:

  * confirm loading succeeds
  * confirm the loaded content is accessible in context (log once at boot)
* Break a content file intentionally (e.g., wrong weapon ID) and confirm the error message is clear.
* Run tests for validation.

## Affected files (expected)

* `src/game/data/schemas.ts`
* `src/game/data/content_loader.ts`
* `src/main.ts` or `src/scenes/boot.ts` (boot wiring)
* `content/weapons.json`
* `content/upgrades.json`
* `content/enemies.json`
* `content/stages/stage_001.json`
* test files for validation

## Follow-ups

* Ticket 007: Stage system consumes `StageDef` and emits stage events
* Ticket 008: Enemy spawner consumes `EnemyArchetypeDef`
* Ticket 009: Weapon system consumes `WeaponDef` and upgrade effects
