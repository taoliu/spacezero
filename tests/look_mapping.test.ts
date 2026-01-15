import { describe, expect, it } from 'vitest';
import type { LookTuning } from '../src/game/tuning';
import { mapLook } from '../src/game/utils/look_mapping';

const baseTuning: LookTuning = {
  lookSensitivityTouch: 1,
  lookSensitivityGyro: 1,
  lookSmoothing: 0,
  maxLookRateDegPerSec: 120,
  invertLookXTouch: false,
  invertLookYTouch: false,
  invertLookXGyro: false,
  invertLookYGyro: false,
};

describe('look mapping', () => {
  it('inverts touch yaw so drag left turns left', () => {
    const left = mapLook(-1, 0, 'touch', baseTuning);
    const right = mapLook(1, 0, 'touch', baseTuning);

    expect(left.x).toBeGreaterThan(0);
    expect(right.x).toBeLessThan(0);
  });

  it('applies gyro inversion toggle', () => {
    const normal = mapLook(0.6, 0, 'gyro', baseTuning);
    const inverted = mapLook(0.6, 0, 'gyro', {
      ...baseTuning,
      invertLookXGyro: true,
    });

    expect(inverted.x).toBeCloseTo(-normal.x);
  });
});
