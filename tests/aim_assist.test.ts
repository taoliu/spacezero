import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { computeAssistedAim } from '../src/game/utils/aim_assist';

describe('aim assist', () => {
  it('returns forward when strength is zero', () => {
    const forward = new Vector3(0, 0, -1);
    const target = new Vector3(1, 0, 0);
    const result = computeAssistedAim(forward, target, 0, 10);

    expect(result.x).toBeCloseTo(forward.x);
    expect(result.y).toBeCloseTo(forward.y);
    expect(result.z).toBeCloseTo(forward.z);
  });

  it('returns target when within cone and strength is one', () => {
    const forward = new Vector3(0, 0, -1);
    const target = new Vector3(0.2, 0, -0.98).normalize();
    const result = computeAssistedAim(forward, target, 1, 30);

    expect(result.x).toBeCloseTo(target.x);
    expect(result.y).toBeCloseTo(target.y);
    expect(result.z).toBeCloseTo(target.z);
  });

  it('clamps when target is outside cone', () => {
    const forward = new Vector3(0, 0, -1);
    const target = new Vector3(1, 0, 0).normalize();
    const result = computeAssistedAim(forward, target, 1, 5);

    expect(result.x).toBeCloseTo(forward.x);
    expect(result.y).toBeCloseTo(forward.y);
    expect(result.z).toBeCloseTo(forward.z);
  });
});
