import { describe, expect, it } from 'vitest';
import { World } from '../src/engine/ecs/world';
import type { ComponentId } from '../src/engine/ecs/types';

const POSITION: ComponentId<{ x: number; y: number }> = 'position';
const VELOCITY: ComponentId<{ vx: number; vy: number }> = 'velocity';

describe('World components', () => {
  it('adds and retrieves components', () => {
    const world = new World();
    const entity = world.createEntity();

    world.addComponent(entity, POSITION, { x: 1, y: 2 });

    expect(world.hasComponent(entity, POSITION)).toBe(true);
    expect(world.getComponent(entity, POSITION)).toEqual({ x: 1, y: 2 });
  });

  it('removes components', () => {
    const world = new World();
    const entity = world.createEntity();

    world.addComponent(entity, POSITION, { x: 1, y: 2 });
    world.removeComponent(entity, POSITION);

    expect(world.hasComponent(entity, POSITION)).toBe(false);
    expect(world.getComponent(entity, POSITION)).toBeUndefined();
  });

  it('queries entities with component intersections', () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();
    const e3 = world.createEntity();

    world.addComponent(e1, POSITION, { x: 0, y: 0 });
    world.addComponent(e1, VELOCITY, { vx: 1, vy: 1 });

    world.addComponent(e2, POSITION, { x: 5, y: 5 });

    world.addComponent(e3, POSITION, { x: 2, y: 2 });
    world.addComponent(e3, VELOCITY, { vx: 0, vy: 0 });

    expect(world.query([POSITION])).toEqual([e1, e2, e3]);
    expect(world.query([POSITION, VELOCITY])).toEqual([e1, e3]);
  });

  it('removes components on entity destruction', () => {
    const world = new World();
    const entity = world.createEntity();

    world.addComponent(entity, POSITION, { x: 3, y: 4 });
    world.destroyEntity(entity);

    expect(world.hasComponent(entity, POSITION)).toBe(false);
    expect(world.query([POSITION])).toEqual([]);
  });

  it('returns all alive entities for empty queries', () => {
    const world = new World();
    const e1 = world.createEntity();
    const e2 = world.createEntity();

    expect(world.query([])).toEqual([e1, e2]);
  });
});
