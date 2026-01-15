import type { ComponentId } from '../../engine/ecs/types';

export type HitSphere = {
  radius: number;
};

export const HIT_SPHERE_COMPONENT: ComponentId<HitSphere> = 'hitSphere';
