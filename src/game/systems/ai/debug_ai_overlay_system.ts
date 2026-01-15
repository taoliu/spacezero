import { Vector3 } from 'three';
import type { EntityId } from '../../../engine/ecs/types';
import { AI_STATE_COMPONENT } from '../../components/ai_state';
import { BLACKBOARD_COMPONENT } from '../../components/blackboard';
import { ENEMY_TAG_COMPONENT, PLAYER_TAG_COMPONENT } from '../../components/tags';
import { TRANSFORM_COMPONENT } from '../../components/transform';
import type { GameContext, System } from '../types';

export class DebugAIOverlaySystem implements System {
  private readonly label: HTMLDivElement;
  private readonly enemyEntities: EntityId[] = [];
  private readonly playerEntities: EntityId[] = [];
  private readonly toEnemy = new Vector3();
  private timer = 0;

  constructor(root: HTMLElement) {
    this.label = document.createElement('div');
    this.label.id = 'ai-overlay';
    this.label.textContent = 'AI: --';
    root.appendChild(this.label);
  }

  update(ctx: GameContext, dt: number): void {
    this.timer += dt;
    if (this.timer < 0.25) {
      return;
    }
    this.timer = 0;

    ctx.world.query([PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT], this.playerEntities);
    const playerId = this.playerEntities[0];
    if (!playerId) {
      this.label.textContent = 'AI: --';
      return;
    }
    const playerTransform = ctx.world.getComponent(playerId, TRANSFORM_COMPONENT);
    if (!playerTransform) {
      this.label.textContent = 'AI: --';
      return;
    }

    ctx.world.query(
      [ENEMY_TAG_COMPONENT, AI_STATE_COMPONENT, BLACKBOARD_COMPONENT, TRANSFORM_COMPONENT],
      this.enemyEntities,
    );

    let nearestId: EntityId | null = null;
    let nearestDistance = Infinity;
    let nearestAction = '--';

    for (const entityId of this.enemyEntities) {
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);
      const aiState = ctx.world.getComponent(entityId, AI_STATE_COMPONENT);
      if (!transform || !aiState) {
        continue;
      }

      this.toEnemy.copy(transform.position).sub(playerTransform.position);
      const distance = this.toEnemy.length();
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = entityId;
        nearestAction = aiState.currentAction;
      }
    }

    if (!nearestId) {
      this.label.textContent = 'AI: no enemies';
      return;
    }

    this.label.textContent = `AI: ${nearestAction} | ${nearestDistance.toFixed(1)}m`;
  }
}
