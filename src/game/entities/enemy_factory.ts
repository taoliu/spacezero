import {
  Color,
  Euler,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  Scene,
  Vector3,
} from 'three';
import type { World } from '../../engine/ecs/world';
import { RENDERABLE_COMPONENT } from '../components/basic';
import { AI_STATE_COMPONENT } from '../components/ai_state';
import { HEALTH_COMPONENT } from '../components/health';
import { SHIELD_COMPONENT } from '../components/shield';
import { ENEMY_TAG_COMPONENT } from '../components/tags';
import { TRANSFORM_COMPONENT } from '../components/transform';
import type { EnemyArchetypeDef } from '../data/schemas';

export class EnemyFactory {
  private readonly scene: Scene;
  private readonly geometry = new IcosahedronGeometry(0.6, 0);
  private readonly materials: MeshStandardMaterial[];
  private materialIndex = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    const colors = [0xff9b6a, 0xffc26a, 0xff7b7b, 0xf3a0ff];
    this.materials = colors.map(
      (color) =>
        new MeshStandardMaterial({
          color: new Color(color),
          roughness: 0.7,
          metalness: 0.1,
          emissive: new Color(0x220e05),
        }),
    );
  }

  spawn(world: World, archetype: EnemyArchetypeDef, position: Vector3): number {
    const entityId = world.createEntity();
    const material = this.materials[this.materialIndex % this.materials.length];
    this.materialIndex += 1;

    const mesh = new Mesh(this.geometry, material);
    mesh.position.copy(position);

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
    world.addComponent(entityId, AI_STATE_COMPONENT, { behavior: archetype.ai.behavior });
    world.addComponent(entityId, TRANSFORM_COMPONENT, {
      position: position.clone(),
      rotation: new Euler(0, 0, 0, 'YXZ'),
    });
    world.addComponent(entityId, RENDERABLE_COMPONENT, { mesh });

    this.scene.add(mesh);
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
