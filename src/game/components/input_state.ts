import type { ComponentId } from '../../engine/ecs/types';

export type InputMode = 'touch' | 'gyro';

export type InputState = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  firePrimary: boolean;
  fireSecondary: boolean;
  boost: boolean;
  mode: InputMode;
};

export const INPUT_STATE_COMPONENT: ComponentId<InputState> = 'inputState';
