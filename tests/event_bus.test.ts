import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/game/events/bus';
import type { GameEvent } from '../src/game/events/events';

const makeEvent = (type: GameEvent['type'], id: number): GameEvent => {
  switch (type) {
    case 'StageStarted':
      return { type, stageId: `stage-${id}` };
    case 'StageCompleted':
      return { type, stageId: `stage-${id}` };
    case 'ObjectiveCompleted':
      return { type, objectiveId: `obj-${id}` };
    case 'EnemySpawned':
      return { type, entityId: id, archetypeId: 'drone' };
    case 'EnemyKilled':
      return { type, entityId: id };
    case 'PlayerDamaged':
      return { type, amount: id };
    case 'WeaponFired':
      return { type, weaponId: 'laser', byEntityId: id };
    case 'TargetChanged':
      return { type, fromEntityId: id, toEntityId: id + 1 };
    case 'PickupCollected':
      return { type, pickupId: 'loot', byEntityId: id };
  }
};

describe('EventBus', () => {
  it('publishes events in order', () => {
    const bus = new EventBus();
    const first = makeEvent('StageStarted', 1);
    const second = makeEvent('ObjectiveCompleted', 2);

    bus.publish(first);
    bus.publish(second);

    expect(bus.peek()).toEqual([first, second]);
  });

  it('drain empties the queue', () => {
    const bus = new EventBus();
    const event = makeEvent('EnemySpawned', 1);

    bus.publish(event);
    const drained = bus.drain();

    expect(drained).toEqual([event]);
    expect(bus.peek()).toEqual([]);
  });

  it('clear empties the queue', () => {
    const bus = new EventBus();
    bus.publish(makeEvent('PlayerDamaged', 3));

    bus.clear();

    expect(bus.peek()).toEqual([]);
  });
});
