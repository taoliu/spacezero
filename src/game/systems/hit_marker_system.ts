import type { EntityId } from '../../engine/ecs/types';
import { HIT_MARKER_COMPONENT } from '../components/hit_marker';
import type { GameContext, System } from './types';

export class HitMarkerSystem implements System {
  private readonly entities: EntityId[] = [];
  private readonly marker: HTMLDivElement;
  private readonly flash: HTMLDivElement;
  private readonly killPopup: HTMLDivElement;
  private flashTimer = 0;
  private killTimer = 0;

  constructor(root: HTMLElement) {
    this.marker = document.createElement('div');
    this.marker.id = 'hit-marker';
    this.marker.textContent = '✦';
    this.marker.dataset.active = 'false';
    root.appendChild(this.marker);

    this.flash = document.createElement('div');
    this.flash.id = 'hit-flash';
    this.flash.dataset.active = 'false';
    root.appendChild(this.flash);

    this.killPopup = document.createElement('div');
    this.killPopup.id = 'kill-popup';
    this.killPopup.textContent = 'KILL!';
    this.killPopup.dataset.active = 'false';
    root.appendChild(this.killPopup);
  }

  update(ctx: GameContext, dt: number): void {
    for (const event of ctx.events) {
      if (event.type === 'WeaponFired' && event.hitEntityId !== undefined) {
        this.flashTimer = Math.max(this.flashTimer, 0.085);
      }
      if (event.type === 'EnemyKilled') {
        this.flashTimer = Math.max(this.flashTimer, 0.16);
        this.killTimer = 0.45;
      }
    }

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

    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      const alpha = Math.min(1, this.flashTimer / 0.16);
      this.flash.style.opacity = (alpha * 0.42).toFixed(3);
      this.flash.dataset.active = 'true';
    } else {
      this.flash.style.opacity = '0';
      this.flash.dataset.active = 'false';
    }

    if (this.killTimer > 0) {
      this.killTimer = Math.max(0, this.killTimer - dt);
      this.killPopup.dataset.active = 'true';
      const t = 1 - this.killTimer / 0.45;
      this.killPopup.style.transform = `translate(-50%, ${-15 - t * 18}px) scale(${1 + (1 - t) * 0.15})`;
      this.killPopup.style.opacity = `${Math.max(0, 1 - t * 1.1)}`;
    } else {
      this.killPopup.dataset.active = 'false';
      this.killPopup.style.opacity = '0';
      this.killPopup.style.transform = 'translate(-50%, -15px) scale(1)';
    }
  }
}
