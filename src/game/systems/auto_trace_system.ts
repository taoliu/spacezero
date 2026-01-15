import { Quaternion, Vector3 } from 'three';
import type { EntityId } from '../../engine/ecs/types';
import { INPUT_STATE_COMPONENT } from '../components/input_state';
import { AUTO_TRACE_COMPONENT } from '../components/auto_trace';
import { PLAYER_TAG_COMPONENT } from '../components/tags';
import { TRANSFORM_COMPONENT } from '../components/transform';
import type { GameContext, System } from './types';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const computeAimError = (
  localDir: { x: number; y: number; z: number },
  out?: { yaw: number; pitch: number },
): { yaw: number; pitch: number } => {
  const result = out ?? { yaw: 0, pitch: 0 };
  result.yaw = Math.atan2(-localDir.x, -localDir.z);
  result.pitch = Math.atan2(localDir.y, -localDir.z);
  return result;
};

export const computeAutoTraceLook = (
  yawError: number,
  pitchError: number,
  strength: number,
  maxRate: number,
  turnRateYaw: number,
  turnRatePitch: number,
  out?: { x: number; y: number },
): { x: number; y: number } => {
  const result = out ?? { x: 0, y: 0 };
  const yawRate = clamp(yawError * strength, -maxRate, maxRate);
  const pitchRate = clamp(pitchError * strength, -maxRate, maxRate);

  result.x = turnRateYaw !== 0 ? clamp(yawRate / turnRateYaw, -1, 1) : 0;
  result.y = turnRatePitch !== 0 ? clamp(pitchRate / turnRatePitch, -1, 1) : 0;
  return result;
};

export class AutoTraceSystem implements System {
  private readonly playerEntities: EntityId[] = [];
  private readonly inputEntities: EntityId[] = [];
  private readonly toTarget = new Vector3();
  private readonly localDir = new Vector3();
  private readonly inverseQuat = new Quaternion();
  private readonly aimError = { yaw: 0, pitch: 0 };
  private readonly lookIntent = { x: 0, y: 0 };

  update(ctx: GameContext, dt: number): void {
    void dt;

    ctx.world.query([PLAYER_TAG_COMPONENT, TRANSFORM_COMPONENT, AUTO_TRACE_COMPONENT], this.playerEntities);
    const playerId = this.playerEntities[0];
    if (!playerId) {
      return;
    }

    const playerTransform = ctx.world.getComponent(playerId, TRANSFORM_COMPONENT);
    const autoTrace = ctx.world.getComponent(playerId, AUTO_TRACE_COMPONENT);
    if (!playerTransform || !autoTrace) {
      return;
    }

    autoTrace.lookX = 0;
    autoTrace.lookY = 0;

    if (!autoTrace.enabled || autoTrace.targetId === null) {
      return;
    }

    if (!ctx.world.isAlive(autoTrace.targetId)) {
      autoTrace.enabled = false;
      autoTrace.targetId = null;
      return;
    }

    ctx.world.query([INPUT_STATE_COMPONENT], this.inputEntities);
    const inputEntity = this.inputEntities[0];
    const input = inputEntity ? ctx.world.getComponent(inputEntity, INPUT_STATE_COMPONENT) : null;

    if (input) {
      const lookMagnitude = Math.max(Math.abs(input.lookX), Math.abs(input.lookY));
      if (lookMagnitude > autoTrace.cancelLookThreshold) {
        autoTrace.enabled = false;
        return;
      }
    }

    const targetTransform = ctx.world.getComponent(autoTrace.targetId, TRANSFORM_COMPONENT);
    if (!targetTransform) {
      autoTrace.enabled = false;
      autoTrace.targetId = null;
      return;
    }

    this.toTarget.copy(targetTransform.position).sub(playerTransform.position);
    if (this.toTarget.lengthSq() < 1e-6) {
      return;
    }

    this.inverseQuat.setFromEuler(playerTransform.rotation).invert();
    this.localDir.copy(this.toTarget).normalize().applyQuaternion(this.inverseQuat);

    computeAimError(this.localDir, this.aimError);
    const stopAngle = (autoTrace.stopAngleDeg * Math.PI) / 180;
    if (Math.max(Math.abs(this.aimError.yaw), Math.abs(this.aimError.pitch)) <= stopAngle) {
      autoTrace.enabled = false;
      autoTrace.targetId = null;
      return;
    }

    const maxRate = (ctx.tuning.autoTrace.autoTraceMaxTurnDegPerSec * Math.PI) / 180;
    computeAutoTraceLook(
      this.aimError.yaw,
      this.aimError.pitch,
      autoTrace.strength,
      maxRate,
      ctx.tuning.flight.turnRateYaw,
      ctx.tuning.flight.turnRatePitch,
      this.lookIntent,
    );

    autoTrace.lookX = this.lookIntent.x;
    autoTrace.lookY = this.lookIntent.y;
  }
}
