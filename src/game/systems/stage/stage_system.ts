import type { Scene } from 'three';
import { Quaternion, Vector3 } from 'three';
import type { EntityId } from '../../../engine/ecs/types';
import { EnemyFactory } from '../../entities/enemy_factory';
import { ECONOMY_COMPONENT } from '../../components/economy';
import { STAGE_RUNTIME_COMPONENT, type StageRunState } from '../../components/stage_runtime';
import { PLAYER_TAG_COMPONENT } from '../../components/tags';
import { TRANSFORM_COMPONENT, type Transform } from '../../components/transform';
import type { StageDef } from '../../data/schemas';
import type { GameContext, System } from '../types';

const TWO_PI = Math.PI * 2;

type StageSystemOptions = {
  root: HTMLElement;
  scene: Scene;
};

export class StageSystem implements System {
  private readonly stageEntities: EntityId[] = [];
  private readonly playerEntities: EntityId[] = [];
  private readonly economyEntities: EntityId[] = [];
  private readonly enemyFactory: EnemyFactory;
  private readonly overlay: HTMLDivElement;
  private readonly overlayLabel: HTMLDivElement;
  private readonly restartButton: HTMLButtonElement;
  private readonly killButton: HTMLButtonElement;
  private readonly selectionParam: string | null;
  private readonly debugKillEnabled: boolean;

  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  private readonly up = new Vector3();
  private readonly spawnCenter = new Vector3();
  private readonly spawnOffset = new Vector3();
  private readonly spawnPosition = new Vector3();
  private readonly rotationQuat = new Quaternion();

  private restartRequested = false;
  private killRequested = false;
  private deferStart = false;
  private resolvedStage = false;

  constructor(options: StageSystemOptions) {
    this.enemyFactory = new EnemyFactory(options.scene);
    const searchParams = new URLSearchParams(window.location.search);
    this.selectionParam = searchParams.get('stage');
    this.debugKillEnabled = searchParams.get('debug') === '1';

    this.overlay = document.createElement('div');
    this.overlay.id = 'stage-overlay';

    this.overlayLabel = document.createElement('div');
    this.overlayLabel.className = 'stage-label';
    this.overlayLabel.textContent = 'Stage: --';

    this.restartButton = document.createElement('button');
    this.restartButton.className = 'stage-button';
    this.restartButton.type = 'button';
    this.restartButton.textContent = 'Restart';

    this.killButton = document.createElement('button');
    this.killButton.className = 'stage-button';
    this.killButton.type = 'button';
    this.killButton.textContent = 'Kill';

    const buttonRow = document.createElement('div');
    buttonRow.className = 'stage-buttons';
    buttonRow.appendChild(this.restartButton);
    if (this.debugKillEnabled) {
      buttonRow.appendChild(this.killButton);
    }

    this.overlay.appendChild(this.overlayLabel);
    this.overlay.appendChild(buttonRow);
    options.root.appendChild(this.overlay);

    this.restartButton.addEventListener('pointerup', (event) => {
      event.preventDefault();
      this.restartRequested = true;
    });
    this.restartButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
    });

    if (this.debugKillEnabled) {
      this.killButton.addEventListener('pointerup', (event) => {
        event.preventDefault();
        this.killRequested = true;
      });
      this.killButton.addEventListener('pointerdown', (event) => {
        event.preventDefault();
      });
    }
  }

  update(ctx: GameContext, dt: number): void {
    void dt;
    ctx.world.query([STAGE_RUNTIME_COMPONENT], this.stageEntities);

    for (const entityId of this.stageEntities) {
      const stageState = ctx.world.getComponent(entityId, STAGE_RUNTIME_COMPONENT);
      if (!stageState) {
        continue;
      }

      if (!this.resolvedStage) {
        const desiredStage = this.selectionParam ?? stageState.stageId;
        stageState.stageId = desiredStage;
        this.resolvedStage = true;
      }

      if (this.restartRequested) {
        this.cleanupStage(ctx, stageState);
        stageState.status = 'Idle';
        stageState.objectiveComplete = false;
        stageState.killedEnemies = 0;
        stageState.remainingEnemies = 0;
        stageState.creditsAwarded = 0;
        stageState.spawnedEnemyIds.length = 0;
        this.restartRequested = false;
        this.deferStart = true;
      }

      if (stageState.status === 'Idle' && !this.deferStart) {
        this.startStage(ctx, stageState);
      }

      if (this.deferStart) {
        this.deferStart = false;
      }

      if (stageState.status === 'Running' && stageState.objectiveComplete) {
        this.completeStage(ctx, stageState);
      }

      if (this.killRequested && stageState.status === 'Running') {
        this.killRequested = false;
        this.killOneEnemy(ctx, stageState);
      }

      this.updateOverlay(stageState);
    }
  }

  private startStage(ctx: GameContext, stageState: StageRunState): void {
    const stage = this.getStageDef(ctx, stageState.stageId);
    if (!stage) {
      stageState.status = 'Completed';
      this.overlay.textContent = `Stage: ${stageState.stageId} (missing)`;
      return;
    }

    stageState.status = 'Running';
    stageState.startTime = performance.now();
    stageState.spawnedEnemyIds.length = 0;
    stageState.killedEnemies = 0;
    stageState.remainingEnemies = 0;
    stageState.creditsAwarded = 0;
    stageState.objectiveComplete = false;

    ctx.eventBus.publish({ type: 'StageStarted', stageId: stage.id });

    const totalEnemies = stage.enemies.reduce((sum, entry) => sum + entry.count, 0);
    const spawnRadius = Math.max(6, Math.min(14, totalEnemies * 1.6));
    const defaultDistance = Math.max(10, spawnRadius + 6);
    const spawnDistanceMin = stage.spawnDistanceMin ?? defaultDistance;
    const spawnDistanceMax = stage.spawnDistanceMax ?? spawnDistanceMin;

    const playerTransform = this.getPlayerTransform(ctx);
    if (playerTransform) {
      this.rotationQuat.setFromEuler(playerTransform.rotation);
      this.forward.set(0, 0, -1).applyQuaternion(this.rotationQuat);
      this.right.set(1, 0, 0).applyQuaternion(this.rotationQuat);
      this.up.set(0, 1, 0).applyQuaternion(this.rotationQuat);
      this.spawnCenter.copy(playerTransform.position);
    } else {
      this.forward.set(0, 0, -1);
      this.right.set(1, 0, 0);
      this.up.set(0, 1, 0);
      this.spawnCenter.set(0, 0, 0);
    }

    let spawnIndex = 0;
    for (const entry of stage.enemies) {
      const archetype = ctx.content.enemies.find((enemy) => enemy.id === entry.archetypeId);
      if (!archetype) {
        continue;
      }

      for (let count = 0; count < entry.count; count += 1) {
        const angle = totalEnemies > 0 ? (spawnIndex / totalEnemies) * TWO_PI : 0;
        const distanceT = totalEnemies > 1 ? spawnIndex / (totalEnemies - 1) : 0;
        const forwardDistance = spawnDistanceMin + (spawnDistanceMax - spawnDistanceMin) * distanceT;
        this.spawnOffset
          .copy(this.right)
          .multiplyScalar(Math.cos(angle) * spawnRadius)
          .addScaledVector(this.up, Math.sin(angle) * spawnRadius);

        this.spawnPosition
          .copy(this.spawnCenter)
          .addScaledVector(this.forward, forwardDistance)
          .add(this.spawnOffset);
        const entityId = this.enemyFactory.spawn(ctx.world, archetype, this.spawnPosition);
        stageState.spawnedEnemyIds.push(entityId);
        ctx.eventBus.publish({
          type: 'EnemySpawned',
          entityId,
          archetypeId: archetype.id,
        });
        spawnIndex += 1;
      }
    }

    stageState.remainingEnemies = stageState.spawnedEnemyIds.length;
  }

  private completeStage(ctx: GameContext, stageState: StageRunState): void {
    const stage = this.getStageDef(ctx, stageState.stageId);
    stageState.status = 'Completed';

    if (stage) {
      stageState.creditsAwarded = stage.rewards.credits;
      ctx.world.query([ECONOMY_COMPONENT], this.economyEntities);
      const economyEntity = this.economyEntities[0];
      if (economyEntity) {
        const economy = ctx.world.getComponent(economyEntity, ECONOMY_COMPONENT);
        if (economy) {
          economy.credits += stage.rewards.credits;
        }
      }
    }

    ctx.eventBus.publish({ type: 'StageCompleted', stageId: stageState.stageId });
  }

  private cleanupStage(ctx: GameContext, stageState: StageRunState): void {
    for (const entityId of stageState.spawnedEnemyIds) {
      if (ctx.world.isAlive(entityId)) {
        this.enemyFactory.despawn(ctx.world, entityId);
      }
    }
  }

  private killOneEnemy(ctx: GameContext, stageState: StageRunState): void {
    for (const entityId of stageState.spawnedEnemyIds) {
      if (!ctx.world.isAlive(entityId)) {
        continue;
      }
      this.enemyFactory.despawn(ctx.world, entityId);
      ctx.eventBus.publish({ type: 'EnemyKilled', entityId, byEntityId: undefined });
      break;
    }
  }

  private updateOverlay(stageState: StageRunState): void {
    const statusLabel = `Status: ${stageState.status}`;
    const remainingLabel = `Remaining: ${stageState.remainingEnemies}`;
    const creditsLabel = `Credits: ${stageState.creditsAwarded}`;
    const header = `Stage: ${stageState.stageId}`;
    this.overlayLabel.textContent = `${header}\n${statusLabel}\n${remainingLabel}\n${creditsLabel}`;
  }

  private getPlayerTransform(ctx: GameContext): Transform | null {
    ctx.world.query([PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT], this.playerEntities);
    const entityId = this.playerEntities[0];
    if (!entityId) {
      return null;
    }
    return ctx.world.getComponent(entityId, TRANSFORM_COMPONENT) ?? null;
  }

  private getStageDef(ctx: GameContext, stageId: string): StageDef | null {
    return ctx.content.stages.find((stage) => stage.id === stageId) ?? null;
  }
}
