import { Quaternion, Vector3 } from 'three';
import type { EntityId } from '../../../engine/ecs/types';
import { AI_STATE_COMPONENT } from '../../components/ai_state';
import { BLACKBOARD_COMPONENT } from '../../components/blackboard';
import { ENEMY_TAG_COMPONENT, PLAYER_TAG_COMPONENT } from '../../components/tags';
import { TRANSFORM_COMPONENT } from '../../components/transform';
import type { EnemyArchetypeDef } from '../../data/schemas';
import type { GameContext, System } from '../types';
import type { AITickScheduler } from './tick_scheduler';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export class PerceptionSystem implements System {
  private readonly scheduler: AITickScheduler;
  private readonly enemyEntities: EntityId[] = [];
  private readonly playerEntities: EntityId[] = [];
  private readonly toPlayer = new Vector3();
  private readonly forward = new Vector3();
  private readonly rotationQuat = new Quaternion();
  private readonly archetypes = new Map<string, EnemyArchetypeDef>();
  private time = 0;

  constructor(scheduler: AITickScheduler) {
    this.scheduler = scheduler;
  }

  update(ctx: GameContext, dt: number): void {
    this.time += dt;
    const tuning = ctx.tuning.ai;
    const interval = 1 / tuning.aiPerceptionHz;
    const fovCos = Math.cos((tuning.aiFovDegrees * Math.PI) / 360);

    if (this.archetypes.size === 0) {
      for (const archetype of ctx.content.enemies) {
        this.archetypes.set(archetype.id, archetype);
      }
    }

    ctx.world.query([PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT], this.playerEntities);
    const playerId = this.playerEntities[0];
    if (!playerId) {
      return;
    }
    const playerTransform = ctx.world.getComponent(playerId, TRANSFORM_COMPONENT);
    if (!playerTransform) {
      return;
    }

    ctx.world.query(
      [ENEMY_TAG_COMPONENT, AI_STATE_COMPONENT, BLACKBOARD_COMPONENT, TRANSFORM_COMPONENT],
      this.enemyEntities,
    );

    for (const entityId of this.enemyEntities) {
      if (!this.scheduler.shouldRun(entityId, 'perception', this.time, interval)) {
        continue;
      }

      const aiState = ctx.world.getComponent(entityId, AI_STATE_COMPONENT);
      const blackboard = ctx.world.getComponent(entityId, BLACKBOARD_COMPONENT);
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);

      if (!aiState || !blackboard || !transform) {
        continue;
      }

      const archetype = this.archetypes.get(aiState.archetypeId);
      const maxRange = archetype ? archetype.ai.preferredRange * 3 : tuning.aiLodDistance;

      this.toPlayer.copy(playerTransform.position).sub(transform.position);
      const distance = this.toPlayer.length();
      const dir = distance > 0 ? this.toPlayer.multiplyScalar(1 / distance) : this.toPlayer.set(0, 0, -1);

      this.rotationQuat.setFromEuler(transform.rotation);
      this.forward.set(0, 0, -1).applyQuaternion(this.rotationQuat);
      const cosAngle = clamp(this.forward.dot(dir), -1, 1);

      blackboard.playerDistance = distance;
      blackboard.relAngle = Math.acos(cosAngle);
      blackboard.playerVisible = distance <= maxRange && cosAngle >= fovCos;
      if (blackboard.playerVisible) {
        blackboard.lastSeenTime = this.time;
      }
    }

    this.scheduler.prune((id) => ctx.world.isAlive(id));
  }
}
