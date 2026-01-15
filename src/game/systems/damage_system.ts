import type { Scene } from 'three';
import { HEALTH_COMPONENT, type Health } from '../components/health';
import { SHIELD_COMPONENT, type Shield } from '../components/shield';
import { ENEMY_TAG_COMPONENT } from '../components/tags';
import { RENDERABLE_COMPONENT } from '../components/basic';
import type { GameEvent } from '../events/events';
import type { GameContext, System } from './types';

export type DamageResult = {
  remainingHp: number;
  remainingShield: number;
  killed: boolean;
};

export const applyDamage = (health: Health, shield: Shield | undefined, amount: number): DamageResult => {
  let remaining = amount;
  let remainingShield = shield ? shield.value : 0;

  if (shield && remaining > 0) {
    const absorbed = Math.min(shield.value, remaining);
    shield.value -= absorbed;
    remaining -= absorbed;
    remainingShield = shield.value;
  }

  if (remaining > 0) {
    health.hp = Math.max(0, health.hp - remaining);
  }

  return {
    remainingHp: health.hp,
    remainingShield,
    killed: health.hp <= 0,
  };
};

export class DamageSystem implements System {
  private readonly scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  update(ctx: GameContext, dt: number): void {
    void dt;

    for (const event of ctx.events) {
      if (event.type !== 'DamageRequested') {
        continue;
      }

      this.applyDamageEvent(ctx, event);
    }
  }

  private applyDamageEvent(ctx: GameContext, event: GameEvent): void {
    if (event.type !== 'DamageRequested') {
      return;
    }

    const targetId = event.targetEntityId;
    const health = ctx.world.getComponent(targetId, HEALTH_COMPONENT);
    if (!health) {
      return;
    }

    const shield = ctx.world.getComponent(targetId, SHIELD_COMPONENT);
    const result = applyDamage(health, shield, event.amount);

    if (!result.killed) {
      return;
    }

    const renderable = ctx.world.getComponent(targetId, RENDERABLE_COMPONENT);
    if (renderable) {
      this.scene.remove(renderable.mesh);
    }

    if (ctx.world.hasComponent(targetId, ENEMY_TAG_COMPONENT)) {
      ctx.eventBus.publish({
        type: 'EnemyKilled',
        entityId: targetId,
        byEntityId: event.sourceEntityId,
      });
    }

    ctx.world.destroyEntity(targetId);
  }
}
