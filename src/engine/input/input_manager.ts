import type { InputState } from '../../game/components/input_state';
import { GyroAim } from './gyro';
import { TouchSticks } from './touch_sticks';

const applyDeadzone = (value: number, deadzone: number): number => {
  return Math.abs(value) < deadzone ? 0 : value;
};

type ButtonState = {
  firePrimary: boolean;
  fireSecondary: boolean;
  boost: boolean;
};

export class InputManager {
  private readonly overlay: HTMLDivElement;
  private readonly touchSticks: TouchSticks;
  private readonly gyro: GyroAim;
  private readonly gyroVector = { x: 0, y: 0 };
  private readonly buttons: ButtonState = {
    firePrimary: false,
    fireSecondary: false,
    boost: false,
  };
  private readonly gyroButton: HTMLButtonElement;
  private readonly calibrateButton: HTMLButtonElement;
  private mode: InputState['mode'] = 'touch';

  constructor(root: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.id = 'input-overlay';
    root.appendChild(this.overlay);

    this.touchSticks = new TouchSticks(this.overlay);
    this.gyro = new GyroAim();

    const buttonCluster = document.createElement('div');
    buttonCluster.className = 'button-cluster';

    const fireButton = this.createButton('Fire', 'primary');
    const missileButton = this.createButton('Missile', 'secondary');
    const boostButton = this.createButton('Boost', 'boost');
    this.gyroButton = this.createButton('Gyro: Off', 'gyro');
    this.calibrateButton = this.createButton('Calibrate', 'calibrate');

    buttonCluster.appendChild(fireButton);
    buttonCluster.appendChild(missileButton);
    buttonCluster.appendChild(boostButton);
    buttonCluster.appendChild(this.gyroButton);
    buttonCluster.appendChild(this.calibrateButton);
    this.overlay.appendChild(buttonCluster);

    this.bindMomentaryButton(fireButton, (active) => {
      this.buttons.firePrimary = active;
    });
    this.bindMomentaryButton(missileButton, (active) => {
      this.buttons.fireSecondary = active;
    });
    this.bindMomentaryButton(boostButton, (active) => {
      this.buttons.boost = active;
    });

    this.bindToggleButton(this.gyroButton, async () => {
      if (!this.gyro.isSupported) {
        this.mode = 'touch';
        this.updateGyroLabel('Gyro: N/A', false);
        return;
      }

      if (this.mode === 'gyro') {
        this.gyro.disable();
        this.mode = 'touch';
        this.updateGyroLabel('Gyro: Off', false);
        return;
      }

      const granted = await this.gyro.requestPermission();
      if (granted) {
        this.gyro.enable();
        this.gyro.calibrate();
        this.mode = 'gyro';
        this.updateGyroLabel('Gyro: On', true);
      } else {
        this.mode = 'touch';
        this.updateGyroLabel('Gyro: Denied', false);
      }
    });

    this.bindActionButton(this.calibrateButton, () => {
      this.gyro.calibrate();
    });

    if (!this.gyro.isSupported) {
      this.gyroButton.disabled = true;
      this.updateGyroLabel('Gyro: N/A', false);
    }

    window.addEventListener('resize', () => this.touchSticks.updateLayout(), { passive: true });
    this.touchSticks.updateLayout();
  }

  update(state: InputState, dt: number): void {
    const left = this.touchSticks.left;
    const right = this.touchSticks.right;

    state.moveX = applyDeadzone(left.x, 0.08);
    state.moveY = applyDeadzone(-left.y, 0.08);

    if (this.mode === 'gyro') {
      this.gyro.update(this.gyroVector, dt);
      state.lookX = this.gyroVector.x;
      state.lookY = this.gyroVector.y;
    } else {
      state.lookX = applyDeadzone(right.x, 0.08);
      state.lookY = applyDeadzone(-right.y, 0.08);
    }

    state.firePrimary = this.buttons.firePrimary;
    state.fireSecondary = this.buttons.fireSecondary;
    state.boost = this.buttons.boost;
    state.mode = this.mode;
  }

  private createButton(label: string, kind: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `input-button input-${kind}`;
    button.type = 'button';
    button.textContent = label;
    return button;
  }

  private updateGyroLabel(label: string, active: boolean): void {
    this.gyroButton.textContent = label;
    this.gyroButton.dataset.active = active ? 'true' : 'false';
  }

  private bindMomentaryButton(button: HTMLButtonElement, onChange: (active: boolean) => void): void {
    let pointerId: number | null = null;

    const setActive = (active: boolean) => {
      button.dataset.active = active ? 'true' : 'false';
      onChange(active);
    };

    button.addEventListener('pointerdown', (event) => {
      if (pointerId !== null) {
        return;
      }

      event.preventDefault();
      pointerId = event.pointerId;
      button.setPointerCapture(pointerId);
      setActive(true);
    });

    const release = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      button.releasePointerCapture(pointerId);
      pointerId = null;
      setActive(false);
    };

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }

  private bindToggleButton(button: HTMLButtonElement, onToggle: () => void): void {
    let pointerId: number | null = null;

    button.addEventListener('pointerdown', (event) => {
      if (pointerId !== null) {
        return;
      }

      event.preventDefault();
      pointerId = event.pointerId;
      button.setPointerCapture(pointerId);
    });

    const release = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      button.releasePointerCapture(pointerId);
      pointerId = null;
      void onToggle();
    };

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }

  private bindActionButton(button: HTMLButtonElement, onAction: () => void): void {
    let pointerId: number | null = null;

    button.addEventListener('pointerdown', (event) => {
      if (pointerId !== null) {
        return;
      }

      event.preventDefault();
      pointerId = event.pointerId;
      button.setPointerCapture(pointerId);
      button.dataset.active = 'true';
    });

    const release = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      button.releasePointerCapture(pointerId);
      pointerId = null;
      button.dataset.active = 'false';
      onAction();
    };

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }
}
