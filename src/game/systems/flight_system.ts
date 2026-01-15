import { Quaternion, Vector3 } from 'three';
import type { EntityId } from '../../engine/ecs/types';
import { INPUT_STATE_COMPONENT } from '../components/input_state';
import { AUTO_TRACE_COMPONENT } from '../components/auto_trace';
import { SHIP_CONTROLLER_COMPONENT, type ShipController } from '../components/ship_controller';
import { TRANSFORM_COMPONENT } from '../components/transform';
import { VELOCITY_COMPONENT } from '../components/velocity';
import type { FlightTuning } from '../tuning';
import { mapLook } from '../utils/look_mapping';
import type { GameContext, System } from './types';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const expDecay = (rate: number, dt: number): number => {
  return 1 - Math.exp(-rate * dt);
};

export const updateBoostState = (
  controller: ShipController,
  boostPressed: boolean,
  dt: number,
  flightTuning: FlightTuning,
): boolean => {
  const canTrigger =
    boostPressed && !controller.wasBoostPressed && controller.boostRemaining <= 0 && controller.boostCooldown <= 0;

  controller.wasBoostPressed = boostPressed;

  if (canTrigger) {
    controller.boostRemaining = flightTuning.boostDurationSec;
    controller.boostCooldown = flightTuning.boostCooldownSec;
  }

  if (controller.boostRemaining > 0) {
    controller.boostRemaining = Math.max(0, controller.boostRemaining - dt);
  } else if (controller.boostCooldown > 0) {
    controller.boostCooldown = Math.max(0, controller.boostCooldown - dt);
  }

  return controller.boostRemaining > 0;
};

export class FlightSystem implements System {
  private readonly shipEntities: EntityId[] = [];
  private readonly inputEntities: EntityId[] = [];
  private readonly desiredVelocity = new Vector3();
  private readonly forward = new Vector3();
  private readonly right = new Vector3();
  private readonly up = new Vector3();
  private readonly rotationQuat = new Quaternion();
  private readonly mappedLook = { x: 0, y: 0 };

  update(ctx: GameContext, dt: number): void {
    const flightTuning = ctx.tuning.flight;
    const lookTuning = ctx.tuning.look;
    const clampedDt = Math.min(dt, flightTuning.maxDt);

    if (clampedDt <= 0) {
      return;
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
      [TRANSFORM_COMPONENT, VELOCITY_COMPONENT, SHIP_CONTROLLER_COMPONENT],
      this.shipEntities,
    );

    for (const entityId of this.shipEntities) {
      const transform = ctx.world.getComponent(entityId, TRANSFORM_COMPONENT);
      const velocity = ctx.world.getComponent(entityId, VELOCITY_COMPONENT);
      const controller = ctx.world.getComponent(entityId, SHIP_CONTROLLER_COMPONENT);
      const autoTrace = ctx.world.getComponent(entityId, AUTO_TRACE_COMPONENT);

      if (!transform || !velocity || !controller) {
        continue;
      }

      const angularAlpha = expDecay(flightTuning.dampingAngular, clampedDt);
      const smoothing = clamp(lookTuning.lookSmoothing, 0, 1);
      const smoothAlpha = 1 - smoothing;
      const maxRate = (lookTuning.maxLookRateDegPerSec * Math.PI) / 180;

      mapLook(input.lookX, input.lookY, input.mode, lookTuning, this.mappedLook);

      if (autoTrace?.enabled) {
        this.mappedLook.x += autoTrace.lookX;
        this.mappedLook.y += autoTrace.lookY;
      }

      controller.lookXSmoothed += (this.mappedLook.x - controller.lookXSmoothed) * smoothAlpha;
      controller.lookYSmoothed += (this.mappedLook.y - controller.lookYSmoothed) * smoothAlpha;

      const targetYawRate = clamp(
        controller.lookXSmoothed * flightTuning.turnRateYaw,
        -maxRate,
        maxRate,
      );
      const targetPitchRate = clamp(
        controller.lookYSmoothed * flightTuning.turnRatePitch,
        -maxRate,
        maxRate,
      );

      controller.yawRate += (targetYawRate - controller.yawRate) * angularAlpha;
      controller.pitchRate += (targetPitchRate - controller.pitchRate) * angularAlpha;

      transform.rotation.y += controller.yawRate * clampedDt;
      transform.rotation.x += controller.pitchRate * clampedDt;
      transform.rotation.x = clamp(
        transform.rotation.x,
        -flightTuning.maxPitch,
        flightTuning.maxPitch,
      );

      const boostActive = updateBoostState(controller, input.boost, clampedDt, flightTuning);
      const speedMultiplier = boostActive ? flightTuning.boostMultiplier : 1;

      this.rotationQuat.setFromEuler(transform.rotation);
      this.forward.set(0, 0, -1).applyQuaternion(this.rotationQuat);
      this.right.set(1, 0, 0).applyQuaternion(this.rotationQuat);
      this.up.set(0, 1, 0).applyQuaternion(this.rotationQuat);

      this.desiredVelocity
        .copy(this.forward)
        .multiplyScalar(flightTuning.baseSpeed * speedMultiplier)
        .addScaledVector(this.right, input.moveX * flightTuning.strafeSpeed)
        .addScaledVector(this.up, input.moveY * flightTuning.verticalSpeed);

      const linearAlpha = expDecay(flightTuning.dampingLinear, clampedDt);
      velocity.linear.lerp(this.desiredVelocity, linearAlpha);
      transform.position.addScaledVector(velocity.linear, clampedDt);

      controller.currentSpeed = velocity.linear.length();
    }
  }
}
