import type { ComponentId } from '../../engine/ecs/types';

export type Shield = {
  value: number;
  maxValue: number;
};

export const SHIELD_COMPONENT: ComponentId<Shield> = 'shield';
