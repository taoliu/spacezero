# Whitepaper

## Project Overview

This project is a **mobile‑first browser‑based first‑person space combat game**. The player pilots a spaceship from a cockpit view and engages alien ships in open space. The design emphasizes **sandbox encounters** with a small number of intelligent enemies rather than large swarms.

The game runs entirely in the browser, targeting modern mobile devices, without native installation. The long‑term vision is a replayable, extensible space combat sandbox with deep combat systems, meaningful progression, and strong modifiability.

## Design Goals

1. **Mobile performance first**
   Stable frame times and predictable performance on mid‑range mobile devices are prioritized over visual complexity.

2. **Skill‑based combat with assistance**
   Combat should reward player skill, while using a targeting assistant to reduce friction on touch and gyro input.

3. **Sandbox encounters**
   Each stage contains a limited number of enemies with higher durability and smarter AI, making every encounter deliberate and tactical.

4. **Data‑driven and expandable**
   New weapons, enemies, stages, and upgrades can be added without rewriting engine code.

5. **Maintainable architecture**
   The codebase is structured for AI coding agents and long‑term iteration, not one‑off prototypes.

## Core Gameplay Loop

1. Player enters a stage (space arena).
2. Objectives are presented (destroy enemies, defend, disable, scan, etc.).
3. Player engages enemies using ship weapons and maneuvering.
4. Targeting assistant helps acquire and track nearby targets.
5. Enemies react with coordinated and adaptive AI behavior.
6. Stage completes when objectives are met.
7. Player receives rewards and selects upgrades.
8. Next stage or replay with modified build.

## Combat Philosophy

Combat is designed around **clarity and decision‑making** rather than raw reflex speed.

Key principles:

* Enemies have readable behaviors and limited resources.
* Player weapons have constraints (heat, cooldowns, lock times).
* Encounters last long enough for tactics to matter.
* Weak points, positioning, and timing are more important than raw damage output.

## Targeting Assistant

Mobile input makes precise aiming difficult. The targeting assistant reduces friction without removing player control.

Features:

* Automatic target selection near the crosshair.
* Sticky targeting with hysteresis to avoid flicker.
* Soft rotational assistance and mild projectile magnetism.
* Visual target indicators and lock feedback.

Counterplay:

* Elite enemies may reduce or disrupt targeting via countermeasures.
* Assist strength is tunable and upgrade‑dependent.

The assistant supports accessibility while preserving skill expression.

## Enemy Design and AI

Enemies are few but meaningful. Each enemy is an actor with:

* Individual health, shields, weapons, and cooldowns.
* Distinct roles such as chaser, sniper, flanker, or support.
* Parameterized personalities controlling aggression and tactics.

AI Architecture:

* **Perception**: visibility, distance, threat evaluation.
* **Decision**: utility‑based action selection with hysteresis.
* **Steering**: movement behaviors such as orbiting, evasion, and formation.

AI update rates are staggered to control CPU cost.

## Sandbox Stage Structure

Stages are defined as **encounters**, not waves.

Each stage specifies:

* Arena constraints and hazards.
* A curated set of enemies.
* Objectives and optional timers.
* Reward rules and reinforcement conditions.

This structure supports replayability and experimentation rather than linear progression.

## Weapons and Progression

Weapons:

* Multiple weapon classes with distinct mechanics (laser, missile, future expansion).
* Shared weapon interface allows new weapons to be added cleanly.

Progression:

* Credits earned from combat and objectives.
* Upgrades modify stats rather than unlocking hard‑coded behaviors.
* Builds emerge from combinations of upgrades, not predefined classes.

Progression is intentionally shallow per run but deep across runs.

## Technical Architecture Summary

* Browser‑based, no server dependency.
* Rendering via WebGL.
* Custom ECS‑style architecture.
* Strong separation of systems and data.
* Typed event bus for loose coupling.
* Content defined in external data files.

This architecture supports AI coding agents, fast iteration, and long‑term maintainability.

## Expandability Roadmap

Planned future extensions:

* Additional enemy factions and behaviors.
* Environmental effects (nebulae, gravity wells).
* Ship modules and loadouts.
* Meta progression and unlock trees.
* Mod support through validated content packs.
* Optional replay and challenge modes.

Each extension is designed to fit within existing system boundaries.

## Non‑Goals

The project intentionally avoids:

* Multiplayer or competitive balance.
* Heavy physics simulation.
* Photorealistic visuals.
* Platform‑specific native features.

These constraints keep scope realistic and iteration fast.

## Conclusion

This project aims to demonstrate that **deep, replayable, sandbox‑style action games can exist entirely in the browser**, even on mobile devices.

By combining disciplined architecture, data‑driven design, and AI‑assisted development workflows, the game is structured not only as a product, but as a sustainable system for ongoing experimentation and growth.
