import type { Object3D } from 'three';
import type { ComponentId } from '../../engine/ecs/types';

export type Spin = {
  speedX: number;
  speedY: number;
  speedZ: number;
};

export type Renderable = {
  mesh: Object3D;
};

export const SPIN_COMPONENT: ComponentId<Spin> = 'spin';
export const RENDERABLE_COMPONENT: ComponentId<Renderable> = 'renderable';
