import { BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';

const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

export const wrapCoordinate = (value: number, extent: number, size: number): number => {
  if (value > extent) {
    return value - size;
  }
  if (value < -extent) {
    return value + size;
  }
  return value;
};

export class Starfield {
  readonly points: Points;

  private readonly positions: Float32Array;
  private readonly attribute: BufferAttribute;
  private readonly size: number;
  private readonly extent: number;
  private readonly count: number;

  constructor(options: { count: number; size: number; color?: number }) {
    this.count = options.count;
    this.size = options.size;
    this.extent = options.size * 0.5;

    this.positions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3;
      this.positions[i3] = randomRange(-this.extent, this.extent);
      this.positions[i3 + 1] = randomRange(-this.extent, this.extent);
      this.positions[i3 + 2] = randomRange(-this.extent, this.extent);
    }

    const geometry = new BufferGeometry();
    this.attribute = new BufferAttribute(this.positions, 3);
    geometry.setAttribute('position', this.attribute);

    const material = new PointsMaterial({
      color: options.color ?? 0xcfe6ff,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.points = new Points(geometry, material);
    this.points.frustumCulled = false;
  }

  update(delta: { x: number; y: number; z: number }): void {
    const dx = delta.x;
    const dy = delta.y;
    const dz = delta.z;

    if (dx === 0 && dy === 0 && dz === 0) {
      return;
    }

    for (let i = 0; i < this.count; i += 1) {
      const i3 = i * 3;
      const x = this.positions[i3] - dx;
      const y = this.positions[i3 + 1] - dy;
      const z = this.positions[i3 + 2] - dz;

      this.positions[i3] = wrapCoordinate(x, this.extent, this.size);
      this.positions[i3 + 1] = wrapCoordinate(y, this.extent, this.size);
      this.positions[i3 + 2] = wrapCoordinate(z, this.extent, this.size);
    }

    this.attribute.needsUpdate = true;
  }
}
