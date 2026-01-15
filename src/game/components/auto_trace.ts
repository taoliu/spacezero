import type { EntityId } from '../../engine/ecs/types';
import type { ComponentId } from '../../engine/ecs/types';

export type AutoTrace = {
  enabled: boolean;
  targetId: EntityId | null;
  strength: number;
  stopAngleDeg: number;
  cancelLookThreshold: number;
  lookX: number;
  lookY: number;
};

export const AUTO_TRACE_COMPONENT: ComponentId<AutoTrace> = 'autoTrace';
