import type { EntityId } from '../../../engine/ecs/types';
import { AI_STATE_COMPONENT, type AIAction } from '../../components/ai_state';
import { BLACKBOARD_COMPONENT } from '../../components/blackboard';
import { ENEMY_TAG_COMPONENT } from '../../components/tags';
import type { EnemyArchetypeDef } from '../../data/schemas';
import type { GameContext, System } from '../types';
import type { AITickScheduler } from './tick_scheduler';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const nextRandom = (state: number): { value: number; nextState: number } => {
  const next = (state * 1664525 + 1013904223) >>> 0;
  return { value: next / 0xffffffff, nextState: next };
};

export class DecisionSystem implements System {
  private readonly scheduler: AITickScheduler;
  private readonly enemyEntities: EntityId[] = [];
  private readonly archetypes = new Map<string, EnemyArchetypeDef>();
  private time = 0;

  constructor(scheduler: AITickScheduler) {
    this.scheduler = scheduler;
  }

  update(ctx: GameContext, dt: number): void {
    this.time += dt;
    const tuning = ctx.tuning.ai;

    if (this.archetypes.size === 0) {
      for (const archetype of ctx.content.enemies) {
        this.archetypes.set(archetype.id, archetype);
      }
    }

    ctx.world.query([ENEMY_TAG_COMPONENT, AI_STATE_COMPONENT, BLACKBOARD_COMPONENT], this.enemyEntities);

    for (const entityId of this.enemyEntities) {
      const aiState = ctx.world.getComponent(entityId, AI_STATE_COMPONENT);
      const blackboard = ctx.world.getComponent(entityId, BLACKBOARD_COMPONENT);
      if (!aiState || !blackboard) {
        continue;
      }

      const archetype = this.archetypes.get(aiState.archetypeId);
      if (!archetype) {
        continue;
      }

      const baseHz = tuning.aiDecisionHz;
      const lodHz = tuning.aiDecisionLodHz;
      const interval = 1 / (blackboard.playerDistance > tuning.aiLodDistance ? lodHz : baseHz);

      if (!this.scheduler.shouldRun(entityId, 'decision', this.time, interval)) {
        continue;
      }

      if (this.time < aiState.actionUntil) {
        continue;
      }

      const preferredRange = archetype.ai.preferredRange;
      const distance = blackboard.playerDistance;
      const visible = blackboard.playerVisible;

      let nextAction: AIAction = aiState.currentAction;

      if (!visible) {
        nextAction = 'Approach';
      } else {
        const approachScore = clamp((distance - preferredRange) / preferredRange, 0, 1);
        const orbitScore = 1 - Math.abs(distance - preferredRange) / preferredRange;

        const dodgeChance = clamp(archetype.ai.dodgeRate, 0, 1);
        const random = nextRandom(aiState.rngState);
        aiState.rngState = random.nextState;
        const shouldDodge = random.value < dodgeChance * interval;

        if (shouldDodge) {
          nextAction = 'Evade';
        } else if (approachScore >= orbitScore) {
          nextAction = 'Approach';
        } else {
          nextAction = 'Orbit';
        }
      }

      aiState.currentAction = nextAction;
      aiState.actionUntil = this.time + (nextAction === 'Evade'
        ? tuning.aiEvadeDurationSec
        : tuning.aiMinActionDurationSec);
    }
  }
}
