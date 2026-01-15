import type { ComponentId } from '../../engine/ecs/types';

export type ShipController = {
  boostRemaining: number;
  boostCooldown: number;
  currentSpeed: number;
  yawRate: number;
  pitchRate: number;
  wasBoostPressed: boolean;
};

export const SHIP_CONTROLLER_COMPONENT: ComponentId<ShipController> = 'shipController';
