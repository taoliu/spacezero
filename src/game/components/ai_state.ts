import type { ComponentId } from '../../engine/ecs/types';

export type AIState = {
  behavior: string;
};

export const AI_STATE_COMPONENT: ComponentId<AIState> = 'aiState';
