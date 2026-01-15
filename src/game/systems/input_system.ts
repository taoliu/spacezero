import type { EntityId } from '../../engine/ecs/types';
import { InputManager } from '../../engine/input/input_manager';
import { INPUT_STATE_COMPONENT } from '../components/input_state';
import type { GameContext, System } from './types';

export class InputSystem implements System {
  private readonly inputManager: InputManager;
  private readonly entities: EntityId[] = [];

  constructor(inputRoot: HTMLElement) {
    this.inputManager = new InputManager(inputRoot);
  }

  update(ctx: GameContext, dt: number): void {
    ctx.world.query([INPUT_STATE_COMPONENT], this.entities);

    for (const entityId of this.entities) {
      const inputState = ctx.world.getComponent(entityId, INPUT_STATE_COMPONENT);
      if (!inputState) {
        continue;
      }

      this.inputManager.update(inputState, dt);
    }
  }
}
