import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
  Texture,
  Vector3,
} from 'three';

const placeOnSphere = (direction: Vector3, radius: number): Vector3 => {
  return direction.normalize().multiplyScalar(radius);
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const createSunTexture = (): Texture | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

type BandOptions = {
  intensity?: number;
  width?: number;
  tiltDeg?: number;
  color?: number;
};

type SunOptions = {
  direction?: [number, number, number];
  intensity?: number;
  spriteSize?: number;
  haloIntensity?: number;
  color?: number;
};

export class DistantAnchors {
  readonly group: Group;

  private enabled = true;
  private bandEnabled = true;
  private sunEnabled = true;
  private bandMesh: Mesh | null = null;
  private sunGroup: Group | null = null;

  constructor(options?: { radius?: number; band?: BandOptions; sun?: SunOptions }) {
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

    this.bandMesh = this.createBand(radius, options?.band);
    if (this.bandMesh) {
      this.group.add(this.bandMesh);
    }

    this.sunGroup = this.createSun(radius, options?.sun);
    if (this.sunGroup) {
      this.group.add(this.sunGroup);
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

  setBandEnabled(enabled: boolean): void {
    this.bandEnabled = enabled;
    if (this.bandMesh) {
      this.bandMesh.visible = enabled;
    }
  }

  toggleBand(): boolean {
    this.setBandEnabled(!this.bandEnabled);
    return this.bandEnabled;
  }

  setSunEnabled(enabled: boolean): void {
    this.sunEnabled = enabled;
    if (this.sunGroup) {
      this.sunGroup.visible = enabled;
    }
  }

  toggleSun(): boolean {
    this.setSunEnabled(!this.sunEnabled);
    return this.sunEnabled;
  }

  private createBand(radius: number, options?: BandOptions): Mesh | null {
    const intensity = options?.intensity ?? 0.25;
    if (intensity <= 0) {
      return null;
    }

    const width = clamp(options?.width ?? 0.3, 0.05, 1);
    const tilt = ((options?.tiltDeg ?? 20) * Math.PI) / 180;
    const baseColor = new Color(options?.color ?? 0x7fb7ff);
    const normal = new Vector3(0, 1, 0).applyAxisAngle(new Vector3(1, 0, 0), tilt).normalize();

    const geometry = new SphereGeometry(1, 32, 16);
    const positionAttr = geometry.getAttribute('position') as BufferAttribute;
    const colors = new Float32Array(positionAttr.count * 3);
    const vertex = new Vector3();
    const color = new Color();

    for (let i = 0; i < positionAttr.count; i += 1) {
      vertex.fromBufferAttribute(positionAttr, i).normalize();
      const distance = Math.abs(normal.dot(vertex));
      const bandFactor = clamp(1 - distance / width, 0, 1);
      const glow = bandFactor * bandFactor * intensity;
      color.copy(baseColor).multiplyScalar(glow);
      const i3 = i * 3;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('color', new BufferAttribute(colors, 3));

    const material = new MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
    });

    const mesh = new Mesh(geometry, material);
    mesh.scale.setScalar(radius);
    mesh.frustumCulled = false;
    return mesh;
  }

  private createSun(radius: number, options?: SunOptions): Group | null {
    const intensity = options?.intensity ?? 0.6;
    if (intensity <= 0) {
      return null;
    }

    const direction = options?.direction ?? [0.4, 0.2, -0.9];
    const dir = new Vector3(direction[0], direction[1], direction[2]).normalize();
    const sunColor = options?.color ?? 0xffffff;
    const size = options?.spriteSize ?? 7;
    const haloIntensity = options?.haloIntensity ?? 0.35;
    const texture = createSunTexture();

    const group = new Group();

    const material = new SpriteMaterial({
      color: sunColor,
      map: texture ?? undefined,
      transparent: true,
      opacity: 1,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new Sprite(material);
    sprite.position.copy(dir).multiplyScalar(radius);
    sprite.scale.setScalar(size);
    group.add(sprite);

    if (haloIntensity > 0) {
      const haloMaterial = new SpriteMaterial({
        color: sunColor,
        map: texture ?? undefined,
        transparent: true,
        opacity: haloIntensity,
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const halo = new Sprite(haloMaterial);
      halo.position.copy(sprite.position);
      halo.scale.setScalar(size * 2.2);
      group.add(halo);
    }

    const light = new DirectionalLight(sunColor, intensity);
    light.position.copy(dir).multiplyScalar(radius);
    const target = new Object3D();
    target.position.set(0, 0, 0);
    group.add(target);
    light.target = target;
    group.add(light);

    return group;
  }
}
