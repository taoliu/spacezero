import type { ComponentId } from '../../engine/ecs/types';

export type Blackboard = {
  playerVisible: boolean;
  playerDistance: number;
  relAngle: number;
  lastSeenTime: number;
};

export const BLACKBOARD_COMPONENT: ComponentId<Blackboard> = 'blackboard';
