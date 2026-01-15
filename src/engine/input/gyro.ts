const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const deltaDegrees = (current: number, baseline: number): number => {
  const raw = current - baseline;
  return ((raw + 540) % 360) - 180;
};

const clampDelta = (current: number, target: number, maxStep: number): number => {
  const delta = clamp(target - current, -maxStep, maxStep);
  return current + delta;
};

type OrientationSample = {
  alpha: number;
  beta: number;
};

export class GyroAim {
  readonly isSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;

  private enabled = false;
  private permissionGranted = false;
  private hasSample = false;
  private baseline: OrientationSample = { alpha: 0, beta: 0 };
  private current: OrientationSample = { alpha: 0, beta: 0 };
  private filteredX = 0;
  private filteredY = 0;

  private readonly maxDegrees = 35;
  private readonly maxStepPerSecond = 3;
  private readonly smoothing = 8;

  private readonly onOrientation = (event: DeviceOrientationEvent): void => {
    if (event.alpha === null || event.beta === null) {
      return;
    }

    this.current.alpha = event.alpha;
    this.current.beta = event.beta;
    this.hasSample = true;
  };

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    const eventWithPermission = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (eventWithPermission.requestPermission) {
      try {
        const result = await eventWithPermission.requestPermission();
        this.permissionGranted = result === 'granted';
      } catch {
        this.permissionGranted = false;
      }
    } else {
      this.permissionGranted = true;
    }

    return this.permissionGranted;
  }

  enable(): void {
    if (!this.permissionGranted) {
      return;
    }

    if (!this.enabled) {
      window.addEventListener('deviceorientation', this.onOrientation, true);
      this.enabled = true;
    }
  }

  disable(): void {
    if (this.enabled) {
      window.removeEventListener('deviceorientation', this.onOrientation, true);
      this.enabled = false;
    }
  }

  calibrate(): void {
    if (!this.hasSample) {
      return;
    }

    this.baseline.alpha = this.current.alpha;
    this.baseline.beta = this.current.beta;
  }

  update(out: { x: number; y: number }, dt: number): void {
    if (!this.enabled || !this.hasSample) {
      out.x = 0;
      out.y = 0;
      return;
    }

    const yaw = deltaDegrees(this.current.alpha, this.baseline.alpha);
    const pitch = clamp(this.current.beta - this.baseline.beta, -90, 90);

    const targetX = clamp(yaw / this.maxDegrees, -1, 1);
    const targetY = clamp(-pitch / this.maxDegrees, -1, 1);

    const alpha = 1 - Math.exp(-this.smoothing * dt);
    const step = this.maxStepPerSecond * dt;

    const smoothedX = this.filteredX + (targetX - this.filteredX) * alpha;
    const smoothedY = this.filteredY + (targetY - this.filteredY) * alpha;

    this.filteredX = clampDelta(this.filteredX, smoothedX, step);
    this.filteredY = clampDelta(this.filteredY, smoothedY, step);

    out.x = clamp(this.filteredX, -1, 1);
    out.y = clamp(this.filteredY, -1, 1);
  }
}

export const gyroMath = {
  clampDelta,
};
