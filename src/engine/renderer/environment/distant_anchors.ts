import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

const placeOnSphere = (direction: Vector3, radius: number): Vector3 => {
  return direction.normalize().multiplyScalar(radius);
};

export class DistantAnchors {
  readonly group: Group;

  private enabled = true;

  constructor(options?: { radius?: number }) {
    const radius = options?.radius ?? 80;
    this.group = new Group();

    const beaconDirections = [
      new Vector3(0.8, 0.15, -0.55),
      new Vector3(-0.35, 0.65, 0.68),
      new Vector3(0.15, -0.65, 0.75),
    ];

    const beaconPositions = new Float32Array(beaconDirections.length * 3);
    for (let i = 0; i < beaconDirections.length; i += 1) {
      const position = placeOnSphere(beaconDirections[i], radius);
      const i3 = i * 3;
      beaconPositions[i3] = position.x;
      beaconPositions[i3 + 1] = position.y;
      beaconPositions[i3 + 2] = position.z;
    }

    const beaconGeometry = new BufferGeometry();
    beaconGeometry.setAttribute('position', new BufferAttribute(beaconPositions, 3));

    const beaconMaterial = new PointsMaterial({
      color: 0xf5fbff,
      size: 2.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const beacons = new Points(beaconGeometry, beaconMaterial);
    beacons.frustumCulled = false;
    this.group.add(beacons);

    const nebulaGeometry = new SphereGeometry(1, 10, 10);
    const nebulaConfigs = [
      { color: 0x6fb7ff, scale: 18, dir: new Vector3(0.42, 0.18, 0.88), opacity: 0.22 },
      { color: 0xffb15c, scale: 14, dir: new Vector3(-0.72, 0.22, -0.65), opacity: 0.2 },
      { color: 0x7fe0b2, scale: 12, dir: new Vector3(-0.15, -0.7, 0.68), opacity: 0.18 },
    ];

    for (const config of nebulaConfigs) {
      const material = new MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        blending: AdditiveBlending,
        depthWrite: false,
      });

      const mesh = new Mesh(nebulaGeometry, material);
      mesh.position.copy(placeOnSphere(config.dir, radius));
      mesh.scale.setScalar(config.scale);
      this.group.add(mesh);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.group.visible = enabled;
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }
}
