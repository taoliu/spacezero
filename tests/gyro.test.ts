import { describe, expect, it } from 'vitest';
import { deltaDegrees, gyroMath } from '../src/engine/input/gyro';

describe('gyro math', () => {
  it('wraps delta degrees across 0/360', () => {
    expect(deltaDegrees(5, 355)).toBeCloseTo(10);
    expect(deltaDegrees(355, 5)).toBeCloseTo(-10);
  });

  it('clamps delta steps', () => {
    expect(gyroMath.clampDelta(0, 1, 0.2)).toBeCloseTo(0.2);
    expect(gyroMath.clampDelta(0, -1, 0.2)).toBeCloseTo(-0.2);
    expect(gyroMath.clampDelta(0.5, 0.6, 0.2)).toBeCloseTo(0.6);
  });
});
