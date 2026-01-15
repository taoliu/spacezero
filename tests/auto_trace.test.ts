import { describe, expect, it } from 'vitest';
import { computeAimError, computeAutoTraceLook } from '../src/game/systems/auto_trace_system';

describe('auto trace math', () => {
  it('returns zero error when target is forward', () => {
    const result = computeAimError({ x: 0, y: 0, z: -1 });
    expect(result.yaw).toBeCloseTo(0);
    expect(result.pitch).toBeCloseTo(0);
  });

  it('yaw is negative when target is to the right', () => {
    const result = computeAimError({ x: 1, y: 0, z: 0 });
    expect(result.yaw).toBeLessThan(0);
  });

  it('pitch is positive when target is above', () => {
    const result = computeAimError({ x: 0, y: 1, z: 0 });
    expect(result.pitch).toBeGreaterThan(0);
  });

  it('scales look intent from yaw error', () => {
    const result = computeAutoTraceLook(Math.PI, 0, 1, 1, 2, 2);
    expect(result.x).toBeCloseTo(0.5);
    expect(result.y).toBeCloseTo(0);
  });
});
