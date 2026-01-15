import { Quaternion, Vector3 } from 'three';
import type { Scene } from 'three';
import { WeaponVfx } from '../../engine/renderer/vfx/weapon_vfx';
import { TRANSFORM_COMPONENT } from '../components/transform';
import type { WeaponDef } from '../data/schemas';
import type { GameContext, System } from './types';

export class VfxSystem implements System {
  private readonly vfx: WeaponVfx;
  private readonly weaponDefs = new Map<string, WeaponDef>();
  private readonly rotationQuat = new Quaternion();
  private readonly direction = new Vector3();
  private readonly origin = new Vector3();
  private readonly muzzle = new Vector3();
  private readonly hitPoint = new Vector3();

  constructor(scene: Scene) {
    this.vfx = new WeaponVfx();
    scene.add(this.vfx.group);
  }

  update(ctx: GameContext, dt: number): void {
    if (this.weaponDefs.size === 0) {
      for (const weapon of ctx.content.weapons) {
        this.weaponDefs.set(weapon.id, weapon);
      }
    }

    this.vfx.update(dt);

    const tuning = ctx.tuning.weapons;
    const muzzleOffset = 0.6;
    const muzzleSize = 0.35;
    const impactSize = 0.45;

    for (const event of ctx.events) {
      if (event.type !== 'WeaponFired') {
        continue;
      }

      const weaponDef = this.weaponDefs.get(event.weaponId);
      if (!weaponDef) {
        continue;
      }

      const transform = ctx.world.getComponent(event.byEntityId, TRANSFORM_COMPONENT);
      if (!transform) {
        continue;
      }

      this.rotationQuat.setFromEuler(transform.rotation);
      this.direction.set(0, 0, -1).applyQuaternion(this.rotationQuat).normalize();
      this.origin.copy(transform.position);
      this.muzzle.copy(this.origin).addScaledVector(this.direction, muzzleOffset);

      if (weaponDef.type === 'laser') {
        let beamLength = tuning.weaponLaserMaxRange;
        let hasHit = false;

        if (
          event.hitX !== undefined &&
          event.hitY !== undefined &&
          event.hitZ !== undefined
        ) {
          this.hitPoint.set(event.hitX, event.hitY, event.hitZ);
          const hitDistance = this.hitPoint.distanceTo(this.origin);
          beamLength = Math.max(0.1, hitDistance - muzzleOffset);
          hasHit = true;
        }

        this.vfx.spawnBeam(
          this.muzzle,
          this.direction,
          beamLength,
          tuning.laserBeamTtlMs / 1000,
          tuning.laserBeamWidth,
        );
        this.vfx.spawnMuzzleFlash(this.muzzle, muzzleSize, tuning.muzzleFlashTtlMs / 1000);

        if (hasHit) {
          this.vfx.spawnImpact(this.hitPoint, impactSize, tuning.impactSparkTtlMs / 1000);
        }
      } else if (weaponDef.type === 'missile') {
        this.vfx.spawnMuzzleFlash(this.muzzle, muzzleSize, tuning.muzzleFlashTtlMs / 1000);
        this.vfx.spawnMissileTrail(
          this.muzzle,
          this.direction,
          tuning.missileTrailLength,
          tuning.missileTrailTtlMs / 1000,
          tuning.laserBeamWidth,
        );
      }
    }
  }
}
