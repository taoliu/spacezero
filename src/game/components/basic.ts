import type { Object3D } from 'three';
import type { ComponentId } from '../../engine/ecs/types';

export type Rotation = {
  x: number;
  y: number;
  z: number;
};

export type Spin = {
  speedX: number;
  speedY: number;
  speedZ: number;
};

export type Renderable = {
  mesh: Object3D;
};

export const ROTATION_COMPONENT: ComponentId<Rotation> = 'rotation';
export const SPIN_COMPONENT: ComponentId<Spin> = 'spin';
export const RENDERABLE_COMPONENT: ComponentId<Renderable> = 'renderable';
