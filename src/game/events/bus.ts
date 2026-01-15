import type { GameEvent } from './events';

export class EventBus {
  private current: GameEvent[] = [];
  private next: GameEvent[] = [];

  publish(event: GameEvent): void {
    this.current.push(event);
  }

  peek(): ReadonlyArray<GameEvent> {
    return this.current;
  }

  drain(): ReadonlyArray<GameEvent> {
    const drained = this.current;
    this.current = this.next;
    this.current.length = 0;
    this.next = drained;
    return drained;
  }

  clear(): void {
    this.current.length = 0;
  }
}
