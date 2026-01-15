import type { EntityId } from '../../../engine/ecs/types';

export type AITickChannel = 'perception' | 'decision' | 'steering';

type TickRecord = {
  perception: number;
  decision: number;
  steering: number;
};

const DEFAULT_RECORD: TickRecord = {
  perception: -Infinity,
  decision: -Infinity,
  steering: -Infinity,
};

export class AITickScheduler {
  private readonly records = new Map<EntityId, TickRecord>();

  shouldRun(entityId: EntityId, channel: AITickChannel, now: number, interval: number): boolean {
    let record = this.records.get(entityId);
    if (!record) {
      record = { ...DEFAULT_RECORD };
      this.records.set(entityId, record);
    }

    if (now - record[channel] < interval) {
      return false;
    }

    record[channel] = now;
    return true;
  }

  prune(isAlive: (id: EntityId) => boolean): void {
    for (const id of this.records.keys()) {
      if (!isAlive(id)) {
        this.records.delete(id);
      }
    }
  }
}
