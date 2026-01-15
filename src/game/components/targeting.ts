import type { EntityId } from '../../engine/ecs/types';
import type { ComponentId } from '../../engine/ecs/types';

export type Targeting = {
  currentTargetId: EntityId | null;
  lockProgress: number;
  lastSwitchTime: number;
};

export const TARGETING_COMPONENT: ComponentId<Targeting> = 'targeting';
