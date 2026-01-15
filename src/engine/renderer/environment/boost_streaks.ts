import { BufferAttribute, BufferGeometry, Points, PointsMaterial, Vector3 } from 'three';

const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

export class BoostStreaks {
  readonly points: Points;

  private readonly positions: Float32Array;
  private readonly attribute: BufferAttribute;
  private readonly count: number;
  private readonly length: number;
  private readonly radius: number;
  private readonly speed: number;
  private active = false;

  constructor(options: { count: number; length: number; radius: number; speed: number }) {
    this.count = options.count;
    this.length = options.length;
    this.radius = options.radius;
    this.speed = options.speed;

    this.positions = new Float32Array(this.count * 3);
    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3;
      const angle = randomRange(0, Math.PI * 2);
      const radial = randomRange(0, this.radius);
      this.positions[i3] = Math.cos(angle) * radial;
      this.positions[i3 + 1] = Math.sin(angle) * radial;
      this.positions[i3 + 2] = randomRange(-this.length, -0.8);
    }

    const geometry = new BufferGeometry();
    this.attribute = new BufferAttribute(this.positions, 3);
    geometry.setAttribute('position', this.attribute);

    const material = new PointsMaterial({
      color: 0x8fd4ff,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    this.points = new Points(geometry, material);
    this.points.visible = false;
  }

  update(rotation: { x: number; y: number; z: number; w: number }, dt: number, active: boolean): void {
    if (active !== this.active) {
      this.active = active;
      this.points.visible = active;
    }

    if (!active) {
      return;
    }

    this.points.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

    const advance = this.speed * dt;
    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3 + 2;
      let z = this.positions[i3] + advance;
      if (z > -0.8) {
        z = -this.length;
      }
      this.positions[i3] = z;
    }

    this.attribute.needsUpdate = true;
  }

  setOffset(offset: Vector3): void {
    this.points.position.copy(offset);
  }
}
