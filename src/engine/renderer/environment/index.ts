import { Group, Quaternion, Vector3 } from 'three';
import type { Transform } from '../../../game/components/transform';
import { BoostStreaks } from './boost_streaks';
import { DistantAnchors } from './distant_anchors';
import { ReferenceObjects } from './reference_objects';
import { Starfield } from './starfield';

type AnchorOptions = {
  radius?: number;
  band?: {
    intensity?: number;
    width?: number;
    tiltDeg?: number;
    color?: number;
  };
  sun?: {
    direction?: [number, number, number];
    intensity?: number;
    spriteSize?: number;
    haloIntensity?: number;
    color?: number;
  };
};

export class EnvironmentCues {
  readonly group: Group;

  private readonly starfield: Starfield;
  private readonly referenceObjects: ReferenceObjects;
  private readonly boostStreaks: BoostStreaks;
  private readonly anchors: DistantAnchors;
  private readonly lastShipPosition = new Vector3();
  private readonly delta = new Vector3();
  private readonly rotationQuat = new Quaternion();
  private readonly streakOffset = new Vector3(0, 0, -0.6);
  private enabled = true;
  private hasLastPosition = false;

  constructor(options?: {
    starCount?: number;
    size?: number;
    referenceCount?: number;
    anchors?: AnchorOptions;
  }) {
    const size = options?.size ?? 140;
    const starCount = options?.starCount ?? 850;
    const referenceCount = options?.referenceCount ?? 4;
    const anchors = options?.anchors;

    this.group = new Group();

    this.starfield = new Starfield({ count: starCount, size });
    this.referenceObjects = new ReferenceObjects({ count: referenceCount, size });
    this.boostStreaks = new BoostStreaks({ count: 120, length: 8, radius: 1.8, speed: 16 });
    this.boostStreaks.setOffset(this.streakOffset);
    this.anchors = new DistantAnchors({
      radius: anchors?.radius ?? Math.min(80, size * 0.6),
      band: anchors?.band,
      sun: anchors?.sun,
    });

    this.group.add(this.starfield.points);
    this.group.add(this.referenceObjects.group);
    this.group.add(this.boostStreaks.points);
    this.group.add(this.anchors.group);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.starfield.points.visible = enabled;
    this.referenceObjects.group.visible = enabled;
    if (!enabled) {
      this.boostStreaks.points.visible = false;
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  setAnchorsEnabled(enabled: boolean): void {
    this.anchors.setEnabled(enabled);
  }

  toggleAnchors(): boolean {
    return this.anchors.toggle();
  }

  setBandEnabled(enabled: boolean): void {
    this.anchors.setBandEnabled(enabled);
  }

  toggleBand(): boolean {
    return this.anchors.toggleBand();
  }

  setSunEnabled(enabled: boolean): void {
    this.anchors.setSunEnabled(enabled);
  }

  toggleSun(): boolean {
    return this.anchors.toggleSun();
  }

  update(transform: Transform, dt: number, boostActive: boolean): void {
    this.group.position.copy(transform.position);

    if (!this.hasLastPosition) {
      this.lastShipPosition.copy(transform.position);
      this.hasLastPosition = true;
      this.boostStreaks.update(this.rotationQuat, 0, boostActive);
      return;
    }

    this.delta.copy(transform.position).sub(this.lastShipPosition);
    this.lastShipPosition.copy(transform.position);

    if (!this.enabled) {
      return;
    }

    this.starfield.update(this.delta);
    this.referenceObjects.update(this.delta);

    this.rotationQuat.setFromEuler(transform.rotation);
    this.boostStreaks.update(this.rotationQuat, dt, boostActive);
  }
}
