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

export type WeaponTuning = {
  laserRange: number;
  heatMax: number;
  heatRecoverThreshold: number;
  hitMarkerDuration: number;
};

export type TargetingTuning = {
  screenRadius: number;
  stickyTimeSec: number;
  switchScoreFactor: number;
  maxTargetDistance: number;
  assistConeDeg: number;
  assistStrength: number;
};

export type AutoTraceTuning = {
  autoTraceMaxTurnDegPerSec: number;
  autoTraceStopAngleDeg: number;
  autoTraceCancelLookThreshold: number;
  autoTraceStrength: number;
};

export type LookTuning = {
  lookSensitivityTouch: number;
  lookSensitivityGyro: number;
  lookSmoothing: number;
  maxLookRateDegPerSec: number;
  invertLookXTouch: boolean;
  invertLookYTouch: boolean;
  invertLookXGyro: boolean;
  invertLookYGyro: boolean;
};

export const tuning: {
  flight: FlightTuning;
  ai: AITuning;
  weapons: WeaponTuning;
  targeting: TargetingTuning;
  autoTrace: AutoTraceTuning;
  look: LookTuning;
} = {
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
  weapons: {
    laserRange: 120,
    heatMax: 1,
    heatRecoverThreshold: 0.35,
    hitMarkerDuration: 0.1,
  },
  targeting: {
    screenRadius: 0.45,
    stickyTimeSec: 0.7,
    switchScoreFactor: 0.7,
    maxTargetDistance: 90,
    assistConeDeg: 6,
    assistStrength: 0.3,
  },
  autoTrace: {
    autoTraceMaxTurnDegPerSec: 90,
    autoTraceStopAngleDeg: 3,
    autoTraceCancelLookThreshold: 0.2,
    autoTraceStrength: 1,
  },
  look: {
    lookSensitivityTouch: 0.4,
    lookSensitivityGyro: 0.25,
    lookSmoothing: 0.15,
    maxLookRateDegPerSec: 120,
    invertLookXTouch: false,
    invertLookYTouch: false,
    invertLookXGyro: false,
    invertLookYGyro: false,
  },
};
