import type { ComponentId } from '../../engine/ecs/types';

export type HitMarker = {
  timer: number;
};

export const HIT_MARKER_COMPONENT: ComponentId<HitMarker> = 'hitMarker';
