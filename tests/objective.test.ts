import { describe, expect, it } from 'vitest';
import { World } from '../src/engine/ecs/world';
import { objectiveUtils } from '../src/game/systems/stage/objective_system';

const { countRemainingEnemies } = objectiveUtils;

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
});
