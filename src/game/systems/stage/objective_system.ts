import type { EntityId } from '../../../engine/ecs/types';
import type { World } from '../../../engine/ecs/world';
import type { GameEvent } from '../../events/events';
import { STAGE_RUNTIME_COMPONENT } from '../../components/stage_runtime';
import type { GameContext, System } from '../types';

const countRemainingEnemies = (world: World, ids: EntityId[], killed: Set<EntityId>): number => {
  let remaining = 0;
  for (const id of ids) {
    if (killed.has(id)) {
      continue;
    }
    if (world.isAlive(id)) {
      remaining += 1;
    } else {
      killed.add(id);
    }
  }
  return remaining;
};

const applyEnemyKilledEvents = (events: ReadonlyArray<GameEvent>, killed: Set<EntityId>): void => {
  for (const event of events) {
    if (event.type === 'EnemyKilled') {
      killed.add(event.entityId);
    }
  }
};

export class ObjectiveSystem implements System {
  private readonly stageEntities: EntityId[] = [];
  private readonly killedEnemies = new Set<EntityId>();

  update(ctx: GameContext, dt: number): void {
    void dt;
    ctx.world.query([STAGE_RUNTIME_COMPONENT], this.stageEntities);

    for (const entityId of this.stageEntities) {
      const stageState = ctx.world.getComponent(entityId, STAGE_RUNTIME_COMPONENT);
      if (!stageState) {
        continue;
      }

      if (stageState.status !== 'Running') {
        this.killedEnemies.clear();
        continue;
      }

      applyEnemyKilledEvents(ctx.events, this.killedEnemies);

      const remaining = countRemainingEnemies(
        ctx.world,
        stageState.spawnedEnemyIds,
        this.killedEnemies,
      );

      stageState.remainingEnemies = remaining;
      stageState.killedEnemies = Math.max(0, stageState.spawnedEnemyIds.length - remaining);
      stageState.objectiveComplete = remaining === 0;
    }
  }

  reset(): void {
    this.killedEnemies.clear();
  }
}

export const objectiveUtils = {
  countRemainingEnemies,
};
