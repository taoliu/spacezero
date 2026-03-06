import {
  AdditiveBlending,
  Color,
  Euler,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';
import type { World } from '../../engine/ecs/world';
import { RENDERABLE_COMPONENT } from '../components/basic';
import { AI_STATE_COMPONENT } from '../components/ai_state';
import { BLACKBOARD_COMPONENT } from '../components/blackboard';
import { HIT_SPHERE_COMPONENT } from '../components/hit_sphere';
import { HEALTH_COMPONENT } from '../components/health';
import { SHIELD_COMPONENT } from '../components/shield';
import { STEERING_INTENT_COMPONENT } from '../components/steering_intent';
import { ENEMY_TAG_COMPONENT } from '../components/tags';
import { TRANSFORM_COMPONENT } from '../components/transform';
import { VELOCITY_COMPONENT } from '../components/velocity';
import type { EnemyArchetypeDef } from '../data/schemas';

export class EnemyFactory {
  private readonly scene: Scene;
  private readonly hullGeometry = new IcosahedronGeometry(0.56, 1);
  private readonly shellGeometry = new IcosahedronGeometry(0.78, 1);
  private readonly coreGeometry = new SphereGeometry(0.16, 10, 8);
  private readonly hullMaterials: MeshStandardMaterial[];
  private readonly shellMaterials: MeshBasicMaterial[];
  private readonly coreMaterials: MeshBasicMaterial[];
  private materialIndex = 0;

  constructor(scene: Scene) {
    this.scene = scene;

    const colors = [0xff8968, 0xffc76a, 0xff6eb0, 0xe38bff];
    this.hullMaterials = colors.map(
      (color) =>
        new MeshStandardMaterial({
          color: new Color(color),
          roughness: 0.42,
          metalness: 0.35,
          emissive: new Color(0x2c1110),
          emissiveIntensity: 0.55,
        }),
    );

    this.shellMaterials = colors.map(
      (color) =>
        new MeshBasicMaterial({
          color: new Color(color).multiplyScalar(0.9),
          transparent: true,
          opacity: 0.22,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
    );

    this.coreMaterials = colors.map(
      (color) =>
        new MeshBasicMaterial({
          color: new Color(color).lerp(new Color(0xffffff), 0.35),
          transparent: true,
          opacity: 0.88,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
    );
  }

  spawn(world: World, archetype: EnemyArchetypeDef, position: Vector3): number {
    const entityId = world.createEntity();
    const materialSlot = this.materialIndex % this.hullMaterials.length;
    this.materialIndex += 1;

    const enemyRoot = new Group();

    const hull = new Mesh(this.hullGeometry, this.hullMaterials[materialSlot]);
    const shell = new Mesh(this.shellGeometry, this.shellMaterials[materialSlot]);
    const core = new Mesh(this.coreGeometry, this.coreMaterials[materialSlot]);

    shell.scale.setScalar(1.02);

    enemyRoot.add(shell);
    enemyRoot.add(hull);
    enemyRoot.add(core);
    enemyRoot.position.copy(position);

    const yawSeed = ((entityId * 17) % 360) * (Math.PI / 180);
    const scaleSeed = ((entityId * 37) % 7) - 3;
    const scale = 1 + scaleSeed * 0.03;
    enemyRoot.scale.setScalar(scale);
    enemyRoot.rotation.set(0, yawSeed, 0);

    world.addComponent(entityId, ENEMY_TAG_COMPONENT, {});
    world.addComponent(entityId, HEALTH_COMPONENT, {
      hp: archetype.stats.maxHp,
      maxHp: archetype.stats.maxHp,
    });
    if (archetype.stats.shield > 0) {
      world.addComponent(entityId, SHIELD_COMPONENT, {
        value: archetype.stats.shield,
        maxValue: archetype.stats.shield,
      });
    }
    world.addComponent(entityId, AI_STATE_COMPONENT, {
      archetypeId: archetype.id,
      currentAction: 'Approach',
      actionUntil: 0,
      rngState: (entityId * 9301 + 49297) % 233280,
    });
    world.addComponent(entityId, BLACKBOARD_COMPONENT, {
      playerVisible: false,
      playerDistance: Infinity,
      relAngle: 0,
      lastSeenTime: 0,
    });
    world.addComponent(entityId, HIT_SPHERE_COMPONENT, { radius: 0.86 * scale });
    world.addComponent(entityId, STEERING_INTENT_COMPONENT, {
      desiredVelocity: new Vector3(),
    });
    world.addComponent(entityId, TRANSFORM_COMPONENT, {
      position: position.clone(),
      rotation: new Euler(0, yawSeed, 0, 'YXZ'),
    });
    world.addComponent(entityId, VELOCITY_COMPONENT, {
      linear: new Vector3(),
    });
    world.addComponent(entityId, RENDERABLE_COMPONENT, { mesh: enemyRoot });

    this.scene.add(enemyRoot);
    return entityId;
  }

  despawn(world: World, entityId: number): void {
    const renderable = world.getComponent(entityId, RENDERABLE_COMPONENT);
    if (renderable) {
      this.scene.remove(renderable.mesh);
    }
    world.destroyEntity(entityId);
  }
}
