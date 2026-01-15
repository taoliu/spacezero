import {
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { wrapCoordinate } from './starfield';

const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

export class ReferenceObjects {
  readonly group: Group;

  private readonly extent: number;
  private readonly size: number;
  private readonly meshes: Mesh[] = [];

  constructor(options: { count: number; size: number }) {
    this.group = new Group();
    this.size = options.size;
    this.extent = options.size * 0.5;

    const geometry = new IcosahedronGeometry(1, 0);
    const colors = [0x59677f, 0x3b4a62, 0x6f8098, 0x475a73];

    for (let i = 0; i < options.count; i += 1) {
      const material = new MeshStandardMaterial({
        color: new Color(colors[i % colors.length]),
        roughness: 0.9,
        metalness: 0.05,
      });

      const mesh = new Mesh(geometry, material);
      const scale = randomRange(2.5, 5.5);
      mesh.scale.setScalar(scale);
      mesh.position.set(
        randomRange(-this.extent, this.extent),
        randomRange(-this.extent, this.extent),
        randomRange(-this.extent, this.extent),
      );
      mesh.rotation.set(
        randomRange(-0.6, 0.6),
        randomRange(-Math.PI, Math.PI),
        randomRange(-0.6, 0.6),
      );

      this.group.add(mesh);
      this.meshes.push(mesh);
    }
  }

  update(delta: { x: number; y: number; z: number }): void {
    const dx = delta.x;
    const dy = delta.y;
    const dz = delta.z;

    if (dx === 0 && dy === 0 && dz === 0) {
      return;
    }

    for (const mesh of this.meshes) {
      mesh.position.x = wrapCoordinate(mesh.position.x - dx, this.extent, this.size);
      mesh.position.y = wrapCoordinate(mesh.position.y - dy, this.extent, this.size);
      mesh.position.z = wrapCoordinate(mesh.position.z - dz, this.extent, this.size);
    }
  }
}
