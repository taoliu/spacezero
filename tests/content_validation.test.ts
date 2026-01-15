import { describe, expect, it } from 'vitest';
import type { ContentSources, RawContent } from '../src/game/data/content_loader';
import { validateContent } from '../src/game/data/content_loader';

const sources: ContentSources = {
  weapons: 'content/weapons.json',
  upgrades: 'content/upgrades.json',
  enemies: 'content/enemies.json',
  stages: 'content/stages/stage_001.json',
};

const baseRaw: RawContent = {
  weapons: [
    {
      id: 'laser_mk1',
      name: 'Pulse Laser',
      type: 'laser',
      baseDamage: 6,
      fireRate: 6,
      heatPerShot: 0.2,
      coolRate: 0.45,
    },
    {
      id: 'missile_mk1',
      name: 'Homing Missile',
      type: 'missile',
      baseDamage: 22,
      lockTime: 1.1,
      ammoMax: 4,
      reloadTime: 2.4,
    },
  ],
  upgrades: [
    {
      id: 'laser_damage_1',
      name: 'Laser Damage I',
      cost: 120,
      effects: [
        { target: 'weapon', stat: 'laserDamage', op: 'add', value: 2 },
      ],
    },
  ],
  enemies: [
    {
      id: 'drone_light',
      name: 'Light Drone',
      stats: { maxHp: 25, shield: 5, speed: 5 },
      weapons: ['laser_mk1'],
      ai: {
        behavior: 'aggressive',
        aggression: 0.7,
        preferredRange: 18,
        orbitStrength: 0.9,
        dodgeRate: 0.25,
        bravery: 0.6,
      },
    },
  ],
  stages: [
    {
      id: 'stage_001',
      name: 'Drift Field',
      arena: { radius: 1200 },
      enemies: [{ archetypeId: 'drone_light', count: 4 }],
      objectives: [{ type: 'KillAll' }],
      rewards: { credits: 200, upgrades: ['laser_damage_1'] },
    },
  ],
};

describe('content validation', () => {
  it('rejects duplicate ids', () => {
    const raw = {
      ...baseRaw,
      weapons: [
        ...(baseRaw.weapons as unknown[]),
        {
          id: 'laser_mk1',
          name: 'Duplicate Laser',
          type: 'laser',
          baseDamage: 4,
          fireRate: 5,
          heatPerShot: 0.2,
          coolRate: 0.4,
        },
      ],
    } as RawContent;

    expect(() => validateContent(raw, sources)).toThrow(/duplicate id/i);
  });

  it('rejects missing referenced weapon ids', () => {
    const raw = {
      ...baseRaw,
      enemies: [
        {
          id: 'drone_light',
          name: 'Light Drone',
          stats: { maxHp: 25, shield: 5, speed: 5 },
          weapons: ['missing_weapon'],
          ai: {
            behavior: 'aggressive',
            aggression: 0.7,
            preferredRange: 18,
            orbitStrength: 0.9,
            dodgeRate: 0.25,
            bravery: 0.6,
          },
        },
      ],
    } as RawContent;

    expect(() => validateContent(raw, sources)).toThrow(/unknown weapon id/i);
  });

  it('rejects invalid enum values', () => {
    const raw = {
      ...baseRaw,
      upgrades: [
        {
          id: 'laser_damage_1',
          name: 'Laser Damage I',
          cost: 120,
          effects: [
            { target: 'oops', stat: 'laserDamage', op: 'add', value: 2 },
          ],
        },
      ],
    } as RawContent;

    expect(() => validateContent(raw, sources)).toThrow(/invalid value/i);
  });
});
