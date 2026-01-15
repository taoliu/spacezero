import { Vector3 } from 'three';
import type { ComponentId } from '../../engine/ecs/types';

export type SteeringIntent = {
  desiredVelocity: Vector3;
};

export const STEERING_INTENT_COMPONENT: ComponentId<SteeringIntent> = 'steeringIntent';
