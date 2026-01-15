import { Euler, Vector3 } from 'three';
import type { ComponentId } from '../../engine/ecs/types';

export type Transform = {
  position: Vector3;
  rotation: Euler;
};

export const TRANSFORM_COMPONENT: ComponentId<Transform> = 'transform';
