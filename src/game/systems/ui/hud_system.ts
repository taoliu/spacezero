import { Camera, Vector3 } from 'three';
import type { EntityId } from '../../../engine/ecs/types';
import { AUTO_TRACE_COMPONENT } from '../../components/auto_trace';
import { ENEMY_TAG_COMPONENT, PLAYER_TAG_COMPONENT } from '../../components/tags';
import { TARGETING_COMPONENT } from '../../components/targeting';
import { TRANSFORM_COMPONENT } from '../../components/transform';
import type { GameContext, System } from '../types';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export class HudSystem implements System {
  private readonly camera: Camera;
  private readonly root: HTMLElement;
  private readonly enemyEntities: EntityId[] = [];
  private readonly playerEntities: EntityId[] = [];
  private readonly projected = new Vector3();
  private readonly toEnemy = new Vector3();
  private readonly resolvedPosition = new Vector3();
  private resolvedDistance = 0;
  private resolvedTargetId: EntityId | null = null;
  private pendingAutoTrace = false;

  private readonly bracket: HTMLDivElement;
  private readonly distanceLabel: HTMLDivElement;
  private readonly arrow: HTMLDivElement;
  private readonly autoIndicator: HTMLDivElement;

  constructor(options: { root: HTMLElement; camera: Camera }) {
    this.camera = options.camera;
    this.root = options.root;

    this.bracket = document.createElement('div');
    this.bracket.id = 'target-bracket';

    this.distanceLabel = document.createElement('div');
    this.distanceLabel.className = 'target-distance';
    this.bracket.appendChild(this.distanceLabel);

    this.arrow = document.createElement('div');
    this.arrow.id = 'target-arrow';

    this.root.appendChild(this.bracket);
    this.root.appendChild(this.arrow);

    this.autoIndicator = document.createElement('div');
    this.autoIndicator.id = 'auto-trace-indicator';
    this.autoIndicator.textContent = 'AUTO';
    this.root.appendChild(this.autoIndicator);

    this.hideBracket();
    this.hideArrow();
    this.autoIndicator.dataset.active = 'false';

    const requestAutoTrace = (event: PointerEvent) => {
      event.preventDefault();
      this.pendingAutoTrace = true;
    };

    this.bracket.addEventListener('pointerdown', (event) => event.preventDefault());
    this.bracket.addEventListener('pointerup', requestAutoTrace);
    this.bracket.addEventListener('pointercancel', (event) => event.preventDefault());

    this.arrow.addEventListener('pointerdown', (event) => event.preventDefault());
    this.arrow.addEventListener('pointerup', requestAutoTrace);
    this.arrow.addEventListener('pointercancel', (event) => event.preventDefault());
  }

  update(ctx: GameContext, dt: number): void {
    void dt;

    ctx.world.query(
      [PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT, TARGETING_COMPONENT, AUTO_TRACE_COMPONENT],
      this.playerEntities,
    );
    const playerId = this.playerEntities[0];
    if (!playerId) {
      this.hideBracket();
      this.hideArrow();
      this.pendingAutoTrace = false;
      this.autoIndicator.dataset.active = 'false';
      return;
    }

    const playerTransform = ctx.world.getComponent(playerId, TRANSFORM_COMPONENT);
    const targeting = ctx.world.getComponent(playerId, TARGETING_COMPONENT);
    const autoTrace = ctx.world.getComponent(playerId, AUTO_TRACE_COMPONENT);
    if (!playerTransform || !targeting || !autoTrace) {
      this.hideBracket();
      this.hideArrow();
      this.pendingAutoTrace = false;
      this.autoIndicator.dataset.active = 'false';
      return;
    }

    if (!this.resolveTarget(ctx, targeting.currentTargetId, playerTransform.position)) {
      this.hideBracket();
      this.hideArrow();
      this.pendingAutoTrace = false;
      this.autoIndicator.dataset.active = autoTrace.enabled ? 'true' : 'false';
      return;
    }

    if (this.pendingAutoTrace) {
      this.pendingAutoTrace = false;
      if (this.resolvedTargetId !== null) {
        autoTrace.enabled = true;
        autoTrace.targetId = this.resolvedTargetId;
      }
    }

    this.autoIndicator.dataset.active = autoTrace.enabled ? 'true' : 'false';

    this.projected.copy(this.resolvedPosition).project(this.camera);
    const ndcX = this.projected.x;
    const ndcY = this.projected.y;
    const ndcZ = this.projected.z;

    const onScreen = ndcZ >= -1 && ndcZ <= 1 && Math.abs(ndcX) <= 1 && Math.abs(ndcY) <= 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (onScreen) {
      const screenX = (ndcX * 0.5 + 0.5) * width;
      const screenY = (-ndcY * 0.5 + 0.5) * height;

      this.bracket.style.left = `${screenX}px`;
      this.bracket.style.top = `${screenY}px`;
      this.bracket.dataset.active = 'true';
      this.distanceLabel.textContent = `${this.resolvedDistance.toFixed(0)}m`;
      this.hideArrow();
    } else {
      this.hideBracket();
      this.showArrow(ndcX, ndcY, width, height);
    }
  }

  private resolveTarget(
    ctx: GameContext,
    currentTarget: EntityId | null,
    playerPosition: Vector3,
  ): boolean {
    this.resolvedTargetId = null;

    if (currentTarget !== null && ctx.world.isAlive(currentTarget)) {
      const transform = ctx.world.getComponent(currentTarget, TRANSFORM_COMPONENT);
      if (transform) {
        this.resolvedPosition.copy(transform.position);
        this.resolvedDistance = transform.position.distanceTo(playerPosition);
        this.resolvedTargetId = currentTarget;
        return true;
      }
    }

    ctx.world.query([ENEMY_TAG_COMPONENT, TRANSFORM_COMPONENT], this.enemyEntities);

    let nearestId: EntityId | null = null;
    let nearestDistance = Infinity;
    let nearestPosition: Vector3 | null = null;

    for (const entityId of this.enemyEntities) {
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);
      if (!transform) {
        continue;
      }

      this.toEnemy.copy(transform.position).sub(playerPosition);
      const distance = this.toEnemy.length();
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = entityId;
        nearestPosition = transform.position;
      }
    }

    if (!nearestId || !nearestPosition) {
      return false;
    }

    this.resolvedPosition.copy(nearestPosition);
    this.resolvedDistance = nearestDistance;
    this.resolvedTargetId = nearestId;
    return true;
  }

  private showArrow(ndcX: number, ndcY: number, width: number, height: number): void {
    const maxAbs = Math.max(Math.abs(ndcX), Math.abs(ndcY));
    if (maxAbs < 1e-3) {
      this.hideArrow();
      return;
    }

    const edge = 0.88;
    const scale = edge / maxAbs;
    const clampedX = clamp(ndcX * scale, -edge, edge);
    const clampedY = clamp(ndcY * scale, -edge, edge);

    const screenX = (clampedX * 0.5 + 0.5) * width;
    const screenY = (-clampedY * 0.5 + 0.5) * height;
    const angle = Math.atan2(-ndcY, ndcX);

    this.arrow.style.left = `${screenX}px`;
    this.arrow.style.top = `${screenY}px`;
    this.arrow.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
    this.arrow.dataset.active = 'true';
  }

  private hideBracket(): void {
    this.bracket.dataset.active = 'false';
  }

  private hideArrow(): void {
    this.arrow.dataset.active = 'false';
  }
}
