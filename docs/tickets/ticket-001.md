# Ticket 001: Project bootstrap (Vite + TypeScript + Three.js)

## Context

We need a stable project skeleton to support mobile-first iteration and the architecture defined in `docs/architecture.md`.

This ticket creates the build/dev baseline and a minimal render loop so later tickets can focus on gameplay systems.

References:

* `docs/architecture.md`: Sections 2 (Tech stack), 4 (Repo structure), 6 (Frame loop)
* `docs/milestones/v0.1-foundation.md`: Technical foundation deliverable

## Goal

Create a working Vite + TypeScript + Three.js project that runs on desktop and mobile browsers, with a minimal scene and basic debug stats.

## Scope

### Included

* Project scaffolding for Vite + TS
* Three.js dependency
* Minimal scene rendering (camera + a simple object)
* Stable animation loop with dt
* Mobile-friendly dev server configuration for LAN testing
* Basic debug overlay (FPS and frame time) as a placeholder for later `DebugOverlaySystem`

### Excluded

* ECS implementation
* Input controls
* Asset pipeline
* Game systems (weapons, AI, targeting)
* Any significant UI/menus

## Tasks

* Initialize project with Vite + TypeScript.
* Add Three.js dependency.
* Create `src/main.ts` that:

  * creates renderer, scene, camera
  * renders a simple object (cube or ship placeholder)
  * runs an animation loop with clamped dt
* Add a lightweight FPS display (DOM overlay) without external heavy dependencies.
* Configure dev server to be reachable from LAN/mobile (document how to test on phone).
* Add minimal folder scaffolding that matches the intended structure (empty directories are fine if needed).
* Add `README` note (or short section in root README if present) describing how to run.

## Acceptance criteria

* `pnpm install` and `pnpm dev` work without errors.
* Opening the dev server in desktop browser shows a rendered scene.
* Opening the dev server from a phone on the same LAN works.
* FPS/frame time overlay is visible and updates.
* No console errors on load.
* Code is TypeScript strict-friendly (no implicit `any`).

## Testing notes

1. Desktop:

   * Run `pnpm dev`
   * Open the printed URL
   * Confirm you see the scene and FPS overlay
2. Mobile:

   * Start dev server with host enabled (see scripts/config)
   * Open `http://<your-lan-ip>:<port>/` on iOS Safari or Android Chrome
   * Confirm scene renders and FPS overlay updates

## Affected files (expected)

* `package.json`
* `vite.config.ts`
* `tsconfig.json`
* `index.html`
* `src/main.ts`
* `src/engine/` (optional empty scaffold)
* `src/game/` (optional empty scaffold)

## Follow-ups

* Ticket 002: ECS world and system scheduler
* Ticket 003: Mobile input abstraction
* Ticket 004: Event bus
* Ticket 005: Content loader and schemas
