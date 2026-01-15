import type { EntityId } from '../../engine/ecs/types';

export type StageStarted = {
  type: 'StageStarted';
  stageId: string;
};

export type StageCompleted = {
  type: 'StageCompleted';
  stageId: string;
};

export type ObjectiveCompleted = {
  type: 'ObjectiveCompleted';
  objectiveId: string;
};

export type EnemySpawned = {
  type: 'EnemySpawned';
  entityId: EntityId;
  archetypeId: string;
};

export type EnemyKilled = {
  type: 'EnemyKilled';
  entityId: EntityId;
  byEntityId?: EntityId;
};

export type PlayerDamaged = {
  type: 'PlayerDamaged';
  amount: number;
  sourceEntityId?: EntityId;
};

export type WeaponFired = {
  type: 'WeaponFired';
  weaponId: string;
  byEntityId: EntityId;
};

export type DamageRequested = {
  type: 'DamageRequested';
  targetEntityId: EntityId;
  amount: number;
  sourceEntityId?: EntityId;
};

export type TargetChanged = {
  type: 'TargetChanged';
  fromEntityId?: EntityId;
  toEntityId?: EntityId;
};

export type PickupCollected = {
  type: 'PickupCollected';
  pickupId: string;
  byEntityId: EntityId;
};

export type GameEvent =
  | StageStarted
  | StageCompleted
  | ObjectiveCompleted
  | EnemySpawned
  | EnemyKilled
  | PlayerDamaged
  | WeaponFired
  | DamageRequested
  | TargetChanged
  | PickupCollected;
