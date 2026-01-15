import type { EntityId } from '../../engine/ecs/types';
import { HIT_MARKER_COMPONENT } from '../components/hit_marker';
import type { GameContext, System } from './types';

export class HitMarkerSystem implements System {
  private readonly entities: EntityId[] = [];
  private readonly marker: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.marker = document.createElement('div');
    this.marker.id = 'hit-marker';
    this.marker.textContent = '+';
    this.marker.dataset.active = 'false';
    root.appendChild(this.marker);
  }

  update(ctx: GameContext, dt: number): void {
    ctx.world.query([HIT_MARKER_COMPONENT], this.entities);
    const entityId = this.entities[0];
    if (!entityId) {
      return;
    }

    const marker = ctx.world.getComponent(entityId, HIT_MARKER_COMPONENT);
    if (!marker) {
      return;
    }

    if (marker.timer > 0) {
      marker.timer = Math.max(0, marker.timer - dt);
      this.marker.dataset.active = 'true';
    } else {
      this.marker.dataset.active = 'false';
    }
  }
}
