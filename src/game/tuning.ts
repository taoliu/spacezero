export type FlightTuning = {
  baseSpeed: number;
  strafeSpeed: number;
  verticalSpeed: number;
  turnRateYaw: number;
  turnRatePitch: number;
  dampingLinear: number;
  dampingAngular: number;
  boostMultiplier: number;
  boostDurationSec: number;
  boostCooldownSec: number;
  maxPitch: number;
  maxDt: number;
};

export type AITuning = {
  aiPerceptionHz: number;
  aiDecisionHz: number;
  aiDecisionLodHz: number;
  aiSteeringHz: number;
  aiLodDistance: number;
  aiMinActionDurationSec: number;
  aiEvadeDurationSec: number;
  aiFovDegrees: number;
  aiMoveDamping: number;
  aiTurnRate: number;
  aiOrbitRadialFactor: number;
};

export const tuning: { flight: FlightTuning; ai: AITuning } = {
  flight: {
    baseSpeed: 6,
    strafeSpeed: 3.2,
    verticalSpeed: 3.2,
    turnRateYaw: 2.2,
    turnRatePitch: 1.9,
    dampingLinear: 6,
    dampingAngular: 8,
    boostMultiplier: 1.8,
    boostDurationSec: 1.4,
    boostCooldownSec: 2.6,
    maxPitch: 1.2,
    maxDt: 0.05,
  },
  ai: {
    aiPerceptionHz: 10,
    aiDecisionHz: 5,
    aiDecisionLodHz: 2,
    aiSteeringHz: 40,
    aiLodDistance: 80,
    aiMinActionDurationSec: 0.9,
    aiEvadeDurationSec: 0.5,
    aiFovDegrees: 120,
    aiMoveDamping: 5,
    aiTurnRate: 3,
    aiOrbitRadialFactor: 0.6,
  },
};
