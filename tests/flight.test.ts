import { describe, expect, it } from 'vitest';
import { updateBoostState } from '../src/game/systems/flight_system';
import type { ShipController } from '../src/game/components/ship_controller';
import { tuning } from '../src/game/tuning';

const makeController = (): ShipController => ({
  boostRemaining: 0,
  boostCooldown: 0,
  currentSpeed: 0,
  yawRate: 0,
  pitchRate: 0,
  wasBoostPressed: false,
});

describe('flight boost state', () => {
  it('activates boost on rising edge', () => {
    const controller = makeController();

    const active = updateBoostState(controller, true, 0.1, tuning.flight);

    expect(active).toBe(true);
    expect(controller.boostRemaining).toBeCloseTo(tuning.flight.boostDurationSec - 0.1, 3);
    expect(controller.boostCooldown).toBeCloseTo(tuning.flight.boostCooldownSec, 3);
  });

  it('does not retrigger boost while held', () => {
    const controller = makeController();

    updateBoostState(controller, true, 0.05, tuning.flight);
    const remainingAfterFirst = controller.boostRemaining;
    updateBoostState(controller, true, 0.05, tuning.flight);

    expect(controller.boostRemaining).toBeLessThan(remainingAfterFirst);
    expect(controller.boostCooldown).toBeCloseTo(tuning.flight.boostCooldownSec, 3);
  });

  it('ticks cooldown after boost ends', () => {
    const controller = makeController();
    controller.boostRemaining = 0;
    controller.boostCooldown = 1;

    updateBoostState(controller, false, 0.4, tuning.flight);
    expect(controller.boostCooldown).toBeCloseTo(0.6, 3);
  });
});
