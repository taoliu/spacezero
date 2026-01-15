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
  weaponLaserMaxRange: number;
  heatMax: number;
  heatRecoverThreshold: number;
  hitMarkerDuration: number;
  laserBeamTtlMs: number;
  laserBeamWidth: number;
  muzzleFlashTtlMs: number;
  impactSparkTtlMs: number;
  missileTrailLength: number;
  missileTrailTtlMs: number;
};

export type TargetingTuning = {
  screenRadiusNdc: number;
  stickyTimeSec: number;
  switchScoreFactor: number;
  maxAcquireDistance: number;
  assistConeDeg: number;
  assistStrength: number;
  aimAssistConeDeg: number;
  aimAssistMaxDistance: number;
  aimAssistStrength: number;
};

export type AutoTraceTuning = {
  autoTraceMaxTurnDegPerSec: number;
  autoTraceStopAngleDeg: number;
  autoTraceCancelLookThreshold: number;
  autoTraceStrength: number;
};

export type EnvironmentTuning = {
  galacticBandIntensity: number;
  galacticBandWidth: number;
  galacticBandTiltDeg: number;
  sunDirection: [number, number, number];
  sunIntensity: number;
  sunSpriteSize: number;
  sunHaloIntensity: number;
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
  environment: EnvironmentTuning;
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
    weaponLaserMaxRange: 1500,
    heatMax: 1,
    heatRecoverThreshold: 0.35,
    hitMarkerDuration: 0.1,
    laserBeamTtlMs: 70,
    laserBeamWidth: 1,
    muzzleFlashTtlMs: 100,
    impactSparkTtlMs: 90,
    missileTrailLength: 6,
    missileTrailTtlMs: 240,
  },
  targeting: {
    screenRadiusNdc: 0.6,
    stickyTimeSec: 0.7,
    switchScoreFactor: 0.7,
    maxAcquireDistance: 2000,
    assistConeDeg: 8,
    assistStrength: 0.3,
    aimAssistConeDeg: 5,
    aimAssistMaxDistance: 1500,
    aimAssistStrength: 0.6,
  },
  autoTrace: {
    autoTraceMaxTurnDegPerSec: 90,
    autoTraceStopAngleDeg: 3,
    autoTraceCancelLookThreshold: 0.2,
    autoTraceStrength: 1,
  },
  environment: {
    galacticBandIntensity: 0.28,
    galacticBandWidth: 0.35,
    galacticBandTiltDeg: 22,
    sunDirection: [0.4, 0.2, -0.9],
    sunIntensity: 0.55,
    sunSpriteSize: 7,
    sunHaloIntensity: 0.35,
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
