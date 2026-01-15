import type { EntityId } from '../../engine/ecs/types';
import type { ComponentId } from '../../engine/ecs/types';

export type StageStatus = 'Idle' | 'Running' | 'Completed';

export type StageRunState = {
  status: StageStatus;
  stageId: string;
  startTime: number;
  spawnedEnemyIds: EntityId[];
  killedEnemies: number;
  remainingEnemies: number;
  creditsAwarded: number;
  objectiveComplete: boolean;
};

export const STAGE_RUNTIME_COMPONENT: ComponentId<StageRunState> = 'stageRuntime';
