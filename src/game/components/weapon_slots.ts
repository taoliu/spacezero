import type { ComponentId } from '../../engine/ecs/types';

export type WeaponSlots = {
  activeWeaponId: string;
  cooldown: number;
  heat: number;
  overheated: boolean;
};

export const WEAPON_SLOTS_COMPONENT: ComponentId<WeaponSlots> = 'weaponSlots';
