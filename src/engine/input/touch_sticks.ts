export type StickState = {
  x: number;
  y: number;
  active: boolean;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

class StickControl {
  readonly state: StickState = { x: 0, y: 0, active: false };

  private readonly area: HTMLDivElement;
  private readonly base: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  private pointerId: number | null = null;
  private centerX = 0;
  private centerY = 0;
  private radius = 0;

  constructor(container: HTMLElement, side: 'left' | 'right') {
    this.area = document.createElement('div');
    this.area.className = `stick-area stick-${side}`;

    this.base = document.createElement('div');
    this.base.className = 'stick-base';

    this.knob = document.createElement('div');
    this.knob.className = 'stick-knob';

    this.base.appendChild(this.knob);
    this.area.appendChild(this.base);
    container.appendChild(this.area);

    this.area.addEventListener('pointerdown', this.onPointerDown);
    this.area.addEventListener('pointermove', this.onPointerMove);
    this.area.addEventListener('pointerup', this.onPointerUp);
    this.area.addEventListener('pointercancel', this.onPointerUp);
    this.area.addEventListener('pointerleave', this.onPointerLeave);
  }

  updateLayout(): void {
    const rect = this.base.getBoundingClientRect();
    this.centerX = rect.left + rect.width * 0.5;
    this.centerY = rect.top + rect.height * 0.5;
    this.radius = rect.width * 0.3;
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== null) {
      return;
    }

    event.preventDefault();
    this.pointerId = event.pointerId;
    this.area.setPointerCapture(event.pointerId);
    this.state.active = true;
    this.updateLayout();
    this.applyPointer(event.clientX, event.clientY);
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    this.applyPointer(event.clientX, event.clientY);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    this.area.releasePointerCapture(event.pointerId);
    this.pointerId = null;
    this.state.active = false;
    this.state.x = 0;
    this.state.y = 0;
    this.updateKnob(0, 0);
  };

  private onPointerLeave = (event: PointerEvent): void => {
    if (this.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    this.applyPointer(event.clientX, event.clientY);
  };

  private applyPointer(x: number, y: number): void {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const distance = Math.hypot(dx, dy);
    const clampedDistance = Math.min(this.radius, distance);
    const angle = distance > 0 ? clampedDistance / distance : 0;
    const offsetX = dx * angle;
    const offsetY = dy * angle;

    const normalizedX = this.radius > 0 ? offsetX / this.radius : 0;
    const normalizedY = this.radius > 0 ? offsetY / this.radius : 0;

    this.state.x = clamp(normalizedX, -1, 1);
    this.state.y = clamp(normalizedY, -1, 1);

    this.updateKnob(offsetX, offsetY);
  }

  private updateKnob(offsetX: number, offsetY: number): void {
    this.knob.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }
}

export class TouchSticks {
  readonly root: HTMLDivElement;
  readonly left: StickState;
  readonly right: StickState;

  private readonly leftControl: StickControl;
  private readonly rightControl: StickControl;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'touch-sticks';
    container.appendChild(this.root);

    this.leftControl = new StickControl(this.root, 'left');
    this.rightControl = new StickControl(this.root, 'right');

    this.left = this.leftControl.state;
    this.right = this.rightControl.state;
  }

  updateLayout(): void {
    this.leftControl.updateLayout();
    this.rightControl.updateLayout();
  }
}
