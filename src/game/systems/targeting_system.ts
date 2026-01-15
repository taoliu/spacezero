import { Camera, Vector3 } from 'three';
import type { EntityId } from '../../engine/ecs/types';
import { ENEMY_TAG_COMPONENT, PLAYER_TAG_COMPONENT } from '../components/tags';
import { TARGETING_COMPONENT } from '../components/targeting';
import { TRANSFORM_COMPONENT } from '../components/transform';
import type { GameContext, System } from './types';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const computeScreenScore = (ndcX: number, ndcY: number, ndcZ: number): number => {
  const depthPenalty = clamp((ndcZ + 1) * 0.5, 0, 1) * 0.15;
  return ndcX * ndcX + ndcY * ndcY + depthPenalty;
};

export const shouldSwitchTarget = (
  currentScore: number,
  bestScore: number,
  timeSinceSwitch: number,
  stickyTime: number,
  switchFactor: number,
): boolean => {
  if (!Number.isFinite(currentScore)) {
    return true;
  }
  if (timeSinceSwitch < stickyTime) {
    return false;
  }
  return bestScore < currentScore * switchFactor;
};

export class TargetingSystem implements System {
  private readonly camera: Camera;
  private readonly playerEntities: EntityId[] = [];
  private readonly enemyEntities: EntityId[] = [];
  private readonly projected = new Vector3();
  private readonly toEnemy = new Vector3();
  private time = 0;

  constructor(camera: Camera) {
    this.camera = camera;
  }

  update(ctx: GameContext, dt: number): void {
    this.time += dt;
    const tuning = ctx.tuning.targeting;
    const maxDistance = tuning.maxAcquireDistance;
    const screenRadiusSq = tuning.screenRadiusNdc * tuning.screenRadiusNdc;

    ctx.world.query([PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT, TARGETING_COMPONENT], this.playerEntities);
    const playerId = this.playerEntities[0];
    if (!playerId) {
      return;
    }

    const playerTransform = ctx.world.getComponent(playerId, TRANSFORM_COMPONENT);
    const targeting = ctx.world.getComponent(playerId, TARGETING_COMPONENT);
    if (!playerTransform || !targeting) {
      return;
    }

    ctx.world.query([ENEMY_TAG_COMPONENT, TRANSFORM_COMPONENT], this.enemyEntities);

    let bestEntity: EntityId | null = null;
    let bestScore = Infinity;

    for (const entityId of this.enemyEntities) {
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);
      if (!transform) {
        continue;
      }

      this.toEnemy.copy(transform.position).sub(playerTransform.position);
      const distance = this.toEnemy.length();
      if (distance > maxDistance) {
        continue;
      }

      this.projected.copy(transform.position).project(this.camera);
      const ndcX = this.projected.x;
      const ndcY = this.projected.y;
      const ndcZ = this.projected.z;

      if (ndcZ < -1 || ndcZ > 1) {
        continue;
      }

      const screenDistSq = ndcX * ndcX + ndcY * ndcY;
      if (screenDistSq > screenRadiusSq) {
        continue;
      }

      const score = computeScreenScore(ndcX, ndcY, ndcZ);
      if (score < bestScore) {
        bestScore = score;
        bestEntity = entityId;
      }
    }

    let currentScore = Infinity;
    const currentTargetId = targeting.currentTargetId;
    const currentTargetAlive =
      currentTargetId !== null && ctx.world.isAlive(currentTargetId);

    if (currentTargetAlive) {
      const currentTransform = ctx.world.getComponent(currentTargetId, TRANSFORM_COMPONENT);
      if (currentTransform) {
        this.toEnemy.copy(currentTransform.position).sub(playerTransform.position);
        const distance = this.toEnemy.length();
        if (distance <= maxDistance) {
          this.projected.copy(currentTransform.position).project(this.camera);
          const ndcX = this.projected.x;
          const ndcY = this.projected.y;
          const ndcZ = this.projected.z;

          if (ndcZ >= -1 && ndcZ <= 1) {
            const screenDistSq = ndcX * ndcX + ndcY * ndcY;
            if (screenDistSq <= screenRadiusSq) {
              currentScore = computeScreenScore(ndcX, ndcY, ndcZ);
            }
          }
        }
      }
    }

    const timeSinceSwitch = this.time - targeting.lastSwitchTime;

    if (bestEntity !== null && shouldSwitchTarget(
      currentScore,
      bestScore,
      timeSinceSwitch,
      tuning.stickyTimeSec,
      tuning.switchScoreFactor,
    )) {
      if (bestEntity !== targeting.currentTargetId) {
        ctx.eventBus.publish({
          type: 'TargetChanged',
          fromEntityId: targeting.currentTargetId ?? undefined,
          toEntityId: bestEntity,
        });
      }
      targeting.currentTargetId = bestEntity;
      targeting.lastSwitchTime = this.time;
      targeting.lockProgress = 1;
      return;
    }

    if (currentScore === Infinity && timeSinceSwitch >= tuning.stickyTimeSec) {
      if (targeting.currentTargetId !== null) {
        ctx.eventBus.publish({
          type: 'TargetChanged',
          fromEntityId: targeting.currentTargetId,
          toEntityId: undefined,
        });
      }
      targeting.currentTargetId = null;
      targeting.lockProgress = 0;
    }
  }
}
