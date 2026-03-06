import { describe, expect, it } from 'vitest';
import { World } from '../src/engine/ecs/world';
import type { GameEvent } from '../src/game/events/events';
import { objectiveUtils } from '../src/game/systems/stage/objective_system';

const { countRemainingEnemies, applyEnemyKilledEvents } = objectiveUtils;

describe('objective utils', () => {
  it('counts remaining enemies and tracks killed ids', () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();
    const e3 = world.createEntity();

    world.destroyEntity(e2);

    const killed = new Set<number>();
    const remaining = countRemainingEnemies(world, [e1, e2, e3], killed);

    expect(remaining).toBe(2);
    expect(killed.has(e2)).toBe(true);
  });

  it('applies EnemyKilled events only for ids in the stage spawn list', () => {
    const stageEnemyA = 11;
    const stageEnemyB = 12;
    const otherStageEnemy = 99;

    const events: GameEvent[] = [
      { type: 'EnemyKilled', entityId: otherStageEnemy },
      { type: 'EnemyKilled', entityId: stageEnemyB },
    ];

    const killed = new Set<number>();
    applyEnemyKilledEvents(events, [stageEnemyA, stageEnemyB], killed);

    expect(killed.has(stageEnemyA)).toBe(false);
    expect(killed.has(stageEnemyB)).toBe(true);
    expect(killed.has(otherStageEnemy)).toBe(false);
  });
});
