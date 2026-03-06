import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three';

type BeamInstance = {
  line: Line;
  positions: Float32Array;
  attribute: BufferAttribute;
  ttl: number;
};

type SpriteInstance = {
  sprite: Sprite;
  ttl: number;
  maxTtl: number;
  baseSize: number;
  growth: number;
};

const createRadialTexture = (): Texture | null => {
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

  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.45, 'rgba(130, 220, 255, 0.45)');
  gradient.addColorStop(0.78, 'rgba(255, 170, 120, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const updateSpritePool = (pool: SpriteInstance[], dt: number): void => {
  for (const instance of pool) {
    if (instance.ttl <= 0) {
      continue;
    }

    instance.ttl -= dt;
    if (instance.ttl <= 0) {
      instance.sprite.visible = false;
      continue;
    }

    const life = Math.max(0, instance.ttl / Math.max(instance.maxTtl, Number.EPSILON));
    const growthScale = 1 + (1 - life) * instance.growth;
    instance.sprite.scale.setScalar(instance.baseSize * growthScale);
  }
};

export class WeaponVfx {
  readonly group: Group;

  private readonly beams: BeamInstance[] = [];
  private readonly muzzleFlashes: SpriteInstance[] = [];
  private readonly impactSparks: SpriteInstance[] = [];
  private readonly missileTrails: BeamInstance[] = [];
  private readonly beamMaterial: LineBasicMaterial;
  private readonly missileTrailMaterial: LineBasicMaterial;
  private readonly muzzleMaterial: SpriteMaterial;
  private readonly impactMaterial: SpriteMaterial;
  private readonly origin = new Vector3();
  private readonly end = new Vector3();

  private beamCursor = 0;
  private muzzleCursor = 0;
  private impactCursor = 0;
  private missileCursor = 0;

  constructor(options?: { beamCount?: number; spriteCount?: number; missileTrailCount?: number }) {
    const beamCount = options?.beamCount ?? 30;
    const spriteCount = options?.spriteCount ?? 26;
    const missileTrailCount = options?.missileTrailCount ?? 14;

    this.group = new Group();

    this.beamMaterial = new LineBasicMaterial({
      color: new Color(0x6de8ff),
      transparent: true,
      opacity: 0.98,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.missileTrailMaterial = new LineBasicMaterial({
      color: new Color(0xff9f56),
      transparent: true,
      opacity: 0.78,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    const texture = createRadialTexture();

    this.muzzleMaterial = new SpriteMaterial({
      color: 0x99e0ff,
      map: texture ?? undefined,
      transparent: true,
      opacity: 0.95,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.impactMaterial = new SpriteMaterial({
      color: 0xffd39a,
      map: texture ?? undefined,
      transparent: true,
      opacity: 0.95,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < beamCount; i += 1) {
      this.beams.push(this.createBeamInstance(this.beamMaterial));
    }

    for (let i = 0; i < missileTrailCount; i += 1) {
      this.missileTrails.push(this.createBeamInstance(this.missileTrailMaterial));
    }

    for (let i = 0; i < spriteCount; i += 1) {
      const sprite = new Sprite(this.muzzleMaterial);
      sprite.visible = false;
      this.group.add(sprite);
      this.muzzleFlashes.push({ sprite, ttl: 0, maxTtl: 0.001, baseSize: 0.35, growth: 0.35 });
    }

    for (let i = 0; i < spriteCount; i += 1) {
      const sprite = new Sprite(this.impactMaterial);
      sprite.visible = false;
      this.group.add(sprite);
      this.impactSparks.push({ sprite, ttl: 0, maxTtl: 0.001, baseSize: 0.45, growth: 0.6 });
    }
  }

  update(dt: number): void {
    for (const beam of this.beams) {
      if (beam.ttl <= 0) {
        continue;
      }
      beam.ttl -= dt;
      if (beam.ttl <= 0) {
        beam.line.visible = false;
      }
    }

    for (const trail of this.missileTrails) {
      if (trail.ttl <= 0) {
        continue;
      }
      trail.ttl -= dt;
      if (trail.ttl <= 0) {
        trail.line.visible = false;
      }
    }

    updateSpritePool(this.muzzleFlashes, dt);
    updateSpritePool(this.impactSparks, dt);
  }

  spawnBeam(origin: Vector3, direction: Vector3, length: number, ttlSeconds: number, width: number): void {
    const beam = this.beams[this.beamCursor];
    this.beamCursor = (this.beamCursor + 1) % this.beams.length;

    this.origin.copy(origin);
    this.end.copy(direction).multiplyScalar(length).add(this.origin);

    beam.positions[0] = this.origin.x;
    beam.positions[1] = this.origin.y;
    beam.positions[2] = this.origin.z;
    beam.positions[3] = this.end.x;
    beam.positions[4] = this.end.y;
    beam.positions[5] = this.end.z;
    beam.attribute.needsUpdate = true;
    beam.line.visible = true;
    (beam.line.material as LineBasicMaterial).linewidth = width;
    beam.ttl = ttlSeconds;
  }

  spawnMissileTrail(origin: Vector3, direction: Vector3, length: number, ttlSeconds: number, width: number): void {
    const trail = this.missileTrails[this.missileCursor];
    this.missileCursor = (this.missileCursor + 1) % this.missileTrails.length;

    this.origin.copy(origin);
    this.end.copy(direction).multiplyScalar(length).add(this.origin);

    trail.positions[0] = this.origin.x;
    trail.positions[1] = this.origin.y;
    trail.positions[2] = this.origin.z;
    trail.positions[3] = this.end.x;
    trail.positions[4] = this.end.y;
    trail.positions[5] = this.end.z;
    trail.attribute.needsUpdate = true;
    trail.line.visible = true;
    (trail.line.material as LineBasicMaterial).linewidth = width;
    trail.ttl = ttlSeconds;
  }

  spawnMuzzleFlash(position: Vector3, size: number, ttlSeconds: number): void {
    const flash = this.muzzleFlashes[this.muzzleCursor];
    this.muzzleCursor = (this.muzzleCursor + 1) % this.muzzleFlashes.length;

    flash.baseSize = size;
    flash.maxTtl = Math.max(ttlSeconds, 0.001);
    flash.ttl = flash.maxTtl;
    flash.sprite.position.copy(position);
    flash.sprite.scale.setScalar(size);
    flash.sprite.visible = true;
  }

  spawnImpact(position: Vector3, size: number, ttlSeconds: number): void {
    const spark = this.impactSparks[this.impactCursor];
    this.impactCursor = (this.impactCursor + 1) % this.impactSparks.length;

    spark.baseSize = size;
    spark.maxTtl = Math.max(ttlSeconds, 0.001);
    spark.ttl = spark.maxTtl;
    spark.sprite.position.copy(position);
    spark.sprite.scale.setScalar(size);
    spark.sprite.visible = true;
  }

  private createBeamInstance(material: LineBasicMaterial): BeamInstance {
    const positions = new Float32Array(6);
    const geometry = new BufferGeometry();
    const attribute = new BufferAttribute(positions, 3);
    geometry.setAttribute('position', attribute);

    const line = new Line(geometry, material);
    line.visible = false;
    this.group.add(line);

    return { line, positions, attribute, ttl: 0 };
  }
}
