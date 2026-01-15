import type { ComponentId } from '../../engine/ecs/types';

export type EconomyState = {
  credits: number;
};

export const ECONOMY_COMPONENT: ComponentId<EconomyState> = 'economy';
