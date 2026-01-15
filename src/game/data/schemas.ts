export type WeaponType = 'laser' | 'missile';

export type WeaponDefBase = {
  id: string;
  name: string;
  type: WeaponType;
};

export type LaserWeaponDef = WeaponDefBase & {
  type: 'laser';
  baseDamage: number;
  fireRate: number;
  heatPerShot: number;
  coolRate: number;
};

export type MissileWeaponDef = WeaponDefBase & {
  type: 'missile';
  baseDamage: number;
  lockTime: number;
  ammoMax: number;
  reloadTime: number;
};

export type WeaponDef = LaserWeaponDef | MissileWeaponDef;

export type UpgradeEffectTarget = 'weapon' | 'ship' | 'targeting';
export type UpgradeEffectOp = 'add' | 'mul' | 'set';

export type UpgradeEffectDef = {
  target: UpgradeEffectTarget;
  stat: string;
  op: UpgradeEffectOp;
  value: number;
};

export type UpgradeDef = {
  id: string;
  name: string;
  cost: number;
  effects: UpgradeEffectDef[];
};

export type EnemyStatsDef = {
  maxHp: number;
  shield: number;
  speed: number;
};

export type EnemyAIDef = {
  behavior: string;
  aggression: number;
  preferredRange: number;
  orbitStrength: number;
  dodgeRate: number;
  bravery: number;
};

export type EnemyArchetypeDef = {
  id: string;
  name: string;
  stats: EnemyStatsDef;
  weapons: string[];
  ai: EnemyAIDef;
  counters?: string[];
};

export type StageEnemyDef = {
  archetypeId: string;
  count: number;
};

export type StageObjectiveDef = {
  type: 'KillAll';
};

export type StageRewardsDef = {
  credits: number;
  upgrades?: string[];
};

export type StageReinforcementDef = {
  delay: number;
  archetypeId: string;
  count: number;
};

export type StageDef = {
  id: string;
  name: string;
  arena: {
    radius: number;
  };
  enemies: StageEnemyDef[];
  objectives: StageObjectiveDef[];
  rewards: StageRewardsDef;
  reinforcements?: StageReinforcementDef[];
};

export type ContentDB = {
  weapons: WeaponDef[];
  upgrades: UpgradeDef[];
  enemies: EnemyArchetypeDef[];
  stages: StageDef[];
};
