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

  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new Texture(canvas);
  texture.needsUpdate = true;
  return texture;
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
    const beamCount = options?.beamCount ?? 24;
    const spriteCount = options?.spriteCount ?? 24;
    const missileTrailCount = options?.missileTrailCount ?? 12;

    this.group = new Group();

    this.beamMaterial = new LineBasicMaterial({
      color: new Color(0x8fd4ff),
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.missileTrailMaterial = new LineBasicMaterial({
      color: new Color(0xffc46f),
      transparent: true,
      opacity: 0.7,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    const texture = createRadialTexture();

    this.muzzleMaterial = new SpriteMaterial({
      color: 0x9ad5ff,
      map: texture ?? undefined,
      transparent: true,
      opacity: 0.9,
      blending: AdditiveBlending,
      depthWrite: false,
    });

    this.impactMaterial = new SpriteMaterial({
      color: 0xffe6b3,
      map: texture ?? undefined,
      transparent: true,
      opacity: 0.9,
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
      this.muzzleFlashes.push({ sprite, ttl: 0 });
    }

    for (let i = 0; i < spriteCount; i += 1) {
      const sprite = new Sprite(this.impactMaterial);
      sprite.visible = false;
      this.group.add(sprite);
      this.impactSparks.push({ sprite, ttl: 0 });
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

    for (const sprite of this.muzzleFlashes) {
      if (sprite.ttl <= 0) {
        continue;
      }
      sprite.ttl -= dt;
      if (sprite.ttl <= 0) {
        sprite.sprite.visible = false;
      }
    }

    for (const sprite of this.impactSparks) {
      if (sprite.ttl <= 0) {
        continue;
      }
      sprite.ttl -= dt;
      if (sprite.ttl <= 0) {
        sprite.sprite.visible = false;
      }
    }
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

    flash.sprite.position.copy(position);
    flash.sprite.scale.setScalar(size);
    flash.sprite.visible = true;
    flash.ttl = ttlSeconds;
  }

  spawnImpact(position: Vector3, size: number, ttlSeconds: number): void {
    const spark = this.impactSparks[this.impactCursor];
    this.impactCursor = (this.impactCursor + 1) % this.impactSparks.length;

    spark.sprite.position.copy(position);
    spark.sprite.scale.setScalar(size);
    spark.sprite.visible = true;
    spark.ttl = ttlSeconds;
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
