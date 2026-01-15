import type { ComponentId } from '../../engine/ecs/types';

export type Health = {
  hp: number;
  maxHp: number;
};

export const HEALTH_COMPONENT: ComponentId<Health> = 'health';
