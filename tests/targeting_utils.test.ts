import { describe, expect, it } from 'vitest';
import { computeScreenScore, shouldSwitchTarget } from '../src/game/systems/targeting_system';

describe('targeting utils', () => {
  it('scores closer to center lower', () => {
    const center = computeScreenScore(0, 0, 0);
    const offset = computeScreenScore(0.3, 0.3, 0);

    expect(center).toBeLessThan(offset);
  });

  it('holds target during sticky time', () => {
    const result = shouldSwitchTarget(0.2, 0.1, 0.2, 0.7, 0.7);
    expect(result).toBe(false);
  });

  it('switches when new score is much better', () => {
    const result = shouldSwitchTarget(0.4, 0.1, 1.0, 0.7, 0.7);
    expect(result).toBe(true);
  });
});
