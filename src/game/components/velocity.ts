import { Vector3 } from 'three';
import type { ComponentId } from '../../engine/ecs/types';

export type Velocity = {
  linear: Vector3;
};

export const VELOCITY_COMPONENT: ComponentId<Velocity> = 'velocity';
