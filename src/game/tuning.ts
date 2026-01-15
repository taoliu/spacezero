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

export const tuning: { flight: FlightTuning } = {
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
};
