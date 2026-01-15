import { Quaternion, Vector3 } from 'three';
import type { EntityId } from '../../engine/ecs/types';
import { HIT_MARKER_COMPONENT } from '../components/hit_marker';
import { HIT_SPHERE_COMPONENT } from '../components/hit_sphere';
import { INPUT_STATE_COMPONENT } from '../components/input_state';
import { TARGETING_COMPONENT } from '../components/targeting';
import { WEAPON_SLOTS_COMPONENT } from '../components/weapon_slots';
import { ENEMY_TAG_COMPONENT, PLAYER_TAG_COMPONENT } from '../components/tags';
import { TRANSFORM_COMPONENT } from '../components/transform';
import type { WeaponDef } from '../data/schemas';
import type { GameContext, System } from './types';

export class WeaponSystem implements System {
  private readonly playerEntities: EntityId[] = [];
  private readonly inputEntities: EntityId[] = [];
  private readonly enemyEntities: EntityId[] = [];
  private readonly hitMarkerEntities: EntityId[] = [];
  private readonly weaponDefs = new Map<string, WeaponDef>();

  private readonly origin = new Vector3();
  private readonly direction = new Vector3();
  private readonly toCenter = new Vector3();
  private readonly rotationQuat = new Quaternion();

  update(ctx: GameContext, dt: number): void {
    if (this.weaponDefs.size === 0) {
      for (const weapon of ctx.content.weapons) {
        this.weaponDefs.set(weapon.id, weapon);
      }
    }

    ctx.world.query([INPUT_STATE_COMPONENT], this.inputEntities);
    const inputEntity = this.inputEntities[0];
    if (!inputEntity) {
      return;
    }
    const input = ctx.world.getComponent(inputEntity, INPUT_STATE_COMPONENT);
    if (!input) {
      return;
    }

    ctx.world.query(
      [PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT, WEAPON_SLOTS_COMPONENT, TARGETING_COMPONENT],
      this.playerEntities,
    );
    const playerId = this.playerEntities[0];
    if (!playerId) {
      return;
    }

    const playerTransform = ctx.world.getComponent(playerId, TRANSFORM_COMPONENT);
    const weaponSlots = ctx.world.getComponent(playerId, WEAPON_SLOTS_COMPONENT);
    const targeting = ctx.world.getComponent(playerId, TARGETING_COMPONENT);
    if (!playerTransform || !weaponSlots || !targeting) {
      return;
    }

    const weaponDef = this.weaponDefs.get(weaponSlots.activeWeaponId);
    if (!weaponDef || weaponDef.type !== 'laser') {
      return;
    }

    weaponSlots.cooldown = Math.max(0, weaponSlots.cooldown - dt);
    if (weaponSlots.heat > 0) {
      weaponSlots.heat = Math.max(0, weaponSlots.heat - weaponDef.coolRate * dt);
    }
    if (weaponSlots.overheated && weaponSlots.heat <= ctx.tuning.weapons.heatRecoverThreshold) {
      weaponSlots.overheated = false;
    }

    if (!input.firePrimary) {
      return;
    }

    if (weaponSlots.cooldown > 0 || weaponSlots.overheated) {
      return;
    }

    weaponSlots.cooldown = 1 / weaponDef.fireRate;
    weaponSlots.heat = Math.min(
      ctx.tuning.weapons.heatMax,
      weaponSlots.heat + weaponDef.heatPerShot,
    );
    if (weaponSlots.heat >= ctx.tuning.weapons.heatMax) {
      weaponSlots.overheated = true;
    }

    ctx.eventBus.publish({
      type: 'WeaponFired',
      weaponId: weaponDef.id,
      byEntityId: playerId,
    });

    this.rotationQuat.setFromEuler(playerTransform.rotation);
    this.direction.set(0, 0, -1).applyQuaternion(this.rotationQuat).normalize();
    this.origin.copy(playerTransform.position);

    const assistTargetId = targeting.currentTargetId;
    if (assistTargetId !== null && ctx.world.isAlive(assistTargetId)) {
      const targetTransform = ctx.world.getComponent(assistTargetId, TRANSFORM_COMPONENT);
      if (targetTransform) {
        this.toCenter.copy(targetTransform.position).sub(this.origin);
        const distance = this.toCenter.length();
        if (distance > 0.01) {
          this.toCenter.multiplyScalar(1 / distance);
          const assistCos = Math.cos((ctx.tuning.targeting.assistConeDeg * Math.PI) / 180);
          const dot = this.direction.dot(this.toCenter);
          if (dot >= assistCos) {
            this.direction.lerp(this.toCenter, ctx.tuning.targeting.assistStrength).normalize();
          }
        }
      }
    }

    const hit = this.findNearestHit(
      ctx,
      this.origin,
      this.direction,
      ctx.tuning.weapons.weaponLaserMaxRange,
    );
    if (hit) {
      ctx.eventBus.publish({
        type: 'DamageRequested',
        targetEntityId: hit.entityId,
        amount: weaponDef.baseDamage,
        sourceEntityId: playerId,
      });
      this.triggerHitMarker(ctx);
    }
  }

  private findNearestHit(
    ctx: GameContext,
    origin: Vector3,
    direction: Vector3,
    range: number,
  ): { entityId: EntityId; distance: number } | null {
    ctx.world.query([ENEMY_TAG_COMPONENT, TRANSFORM_COMPONENT, HIT_SPHERE_COMPONENT], this.enemyEntities);

    let closestDistance = range;
    let closestEntity: EntityId | null = null;

    for (const entityId of this.enemyEntities) {
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);
      const hitSphere = ctx.world.getComponent(entityId, HIT_SPHERE_COMPONENT);
      if (!transform || !hitSphere) {
        continue;
      }

      this.toCenter.copy(transform.position).sub(origin);
      const tca = this.toCenter.dot(direction);
      if (tca < 0) {
        continue;
      }

      const d2 = this.toCenter.lengthSq() - tca * tca;
      const radius2 = hitSphere.radius * hitSphere.radius;
      if (d2 > radius2) {
        continue;
      }

      const thc = Math.sqrt(radius2 - d2);
      let t = tca - thc;
      if (t < 0) {
        t = tca + thc;
      }

      if (t >= 0 && t < closestDistance) {
        closestDistance = t;
        closestEntity = entityId;
      }
    }

    if (closestEntity === null) {
      return null;
    }

    return { entityId: closestEntity, distance: closestDistance };
  }

  private triggerHitMarker(ctx: GameContext): void {
    ctx.world.query([HIT_MARKER_COMPONENT], this.hitMarkerEntities);
    const markerEntity = this.hitMarkerEntities[0];
    if (!markerEntity) {
      return;
    }

    const marker = ctx.world.getComponent(markerEntity, HIT_MARKER_COMPONENT);
    if (!marker) {
      return;
    }

    marker.timer = ctx.tuning.weapons.hitMarkerDuration;
  }
}
