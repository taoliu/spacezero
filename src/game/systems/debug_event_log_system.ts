import type { GameContext, System } from './types';

export class DebugEventLogSystem implements System {
  private readonly label: HTMLDivElement;
  private timer = 0;
  private totalEvents = 0;
  private lastType = 'None';
  private frameEvents = 0;

  constructor(root: HTMLElement) {
    this.label = document.createElement('div');
    this.label.id = 'event-overlay';
    this.label.textContent = 'Events: 0 | Total: 0 | Last: None';
    root.appendChild(this.label);
  }

  update(ctx: GameContext, dt: number): void {
    const events = ctx.events;
    if (events.length > 0) {
      this.frameEvents = events.length;
      this.totalEvents += events.length;
      this.lastType = events[events.length - 1].type;
    }

    this.timer += dt;
    if (this.timer < 0.25) {
      return;
    }

    this.timer = 0;
    this.label.textContent = `Events: ${this.frameEvents} | Total: ${this.totalEvents} | Last: ${this.lastType}`;
    this.frameEvents = 0;
  }
}
