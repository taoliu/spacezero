import { describe, expect, it } from 'vitest';
import { AITickScheduler } from '../src/game/systems/ai/tick_scheduler';

describe('AITickScheduler', () => {
  it('runs based on interval per channel', () => {
    const scheduler = new AITickScheduler();

    expect(scheduler.shouldRun(1, 'perception', 0, 0.1)).toBe(true);
    expect(scheduler.shouldRun(1, 'perception', 0.05, 0.1)).toBe(false);
    expect(scheduler.shouldRun(1, 'perception', 0.12, 0.1)).toBe(true);

    expect(scheduler.shouldRun(1, 'decision', 0, 0.2)).toBe(true);
    expect(scheduler.shouldRun(1, 'decision', 0.1, 0.2)).toBe(false);
  });

  it('prunes missing entities', () => {
    const scheduler = new AITickScheduler();
    scheduler.shouldRun(1, 'steering', 0, 0.1);
    scheduler.prune((id) => id === 2);
    expect(scheduler.shouldRun(1, 'steering', 1, 0.1)).toBe(true);
  });
});
