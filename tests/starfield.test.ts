import { describe, expect, it } from 'vitest';
import { wrapCoordinate } from '../src/engine/renderer/environment/starfield';

describe('starfield wrap', () => {
  it('wraps coordinates outside extent', () => {
    expect(wrapCoordinate(6, 5, 10)).toBeCloseTo(-4);
    expect(wrapCoordinate(-6, 5, 10)).toBeCloseTo(4);
    expect(wrapCoordinate(3, 5, 10)).toBeCloseTo(3);
  });
});
