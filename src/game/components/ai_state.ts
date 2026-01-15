import type { ComponentId } from '../../engine/ecs/types';

export type AIAction = 'Approach' | 'Orbit' | 'Evade' | 'Retreat';

export type AIState = {
  archetypeId: string;
  currentAction: AIAction;
  actionUntil: number;
  rngState: number;
};

export const AI_STATE_COMPONENT: ComponentId<AIState> = 'aiState';
