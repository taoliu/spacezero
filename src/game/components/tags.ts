import type { ComponentId } from '../../engine/ecs/types';

export type PlayerTag = {};
export type EnemyTag = {};

export const PLAYER_TAG_COMPONENT: ComponentId<PlayerTag> = 'playerTag';
export const ENEMY_TAG_COMPONENT: ComponentId<EnemyTag> = 'enemyTag';
