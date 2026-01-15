import { describe, expect, it } from 'vitest';
import { applyDamage } from '../src/game/systems/damage_system';
import type { Health } from '../src/game/components/health';
import type { Shield } from '../src/game/components/shield';

describe('damage system', () => {
  it('applies damage to shield first', () => {
    const health: Health = { hp: 10, maxHp: 10 };
    const shield: Shield = { value: 5, maxValue: 5 };

    const result = applyDamage(health, shield, 3);

    expect(result.remainingShield).toBeCloseTo(2);
    expect(result.remainingHp).toBeCloseTo(10);
    expect(result.killed).toBe(false);
  });

  it('overflows damage into health', () => {
    const health: Health = { hp: 10, maxHp: 10 };
    const shield: Shield = { value: 2, maxValue: 2 };

    const result = applyDamage(health, shield, 5);

    expect(result.remainingShield).toBeCloseTo(0);
    expect(result.remainingHp).toBeCloseTo(7);
    expect(result.killed).toBe(false);
  });

  it('kills when health reaches zero', () => {
    const health: Health = { hp: 3, maxHp: 10 };

    const result = applyDamage(health, undefined, 5);

    expect(result.remainingHp).toBe(0);
    expect(result.killed).toBe(true);
  });
});
