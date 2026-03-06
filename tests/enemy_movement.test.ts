import { describe, expect, it } from 'vitest';
import { shortestAngleDelta } from '../src/game/systems/ai/enemy_movement_system';

const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

describe('enemy movement yaw helpers', () => {
  it('uses shortest arc across +pi / -pi boundary (positive)', () => {
    const from = degToRad(179);
    const to = degToRad(-179);

    const deltaDeg = radToDeg(shortestAngleDelta(from, to));
    expect(deltaDeg).toBeGreaterThan(0);
    expect(deltaDeg).toBeCloseTo(2, 4);
  });

  it('uses shortest arc across +pi / -pi boundary (negative)', () => {
    const from = degToRad(-179);
    const to = degToRad(179);

    const deltaDeg = radToDeg(shortestAngleDelta(from, to));
    expect(deltaDeg).toBeLessThan(0);
    expect(deltaDeg).toBeCloseTo(-2, 4);
  });
});
