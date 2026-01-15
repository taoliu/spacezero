import type { ComponentId, EntityId, QueryableWorld } from './types';
import { queryEntities } from './query';

export class World implements QueryableWorld {
  private nextEntityId: EntityId = 1;
  private readonly freeIds: EntityId[] = [];
  private readonly alive = new Set<EntityId>();
  private readonly components = new Map<ComponentId<unknown>, Map<EntityId, unknown>>();

  createEntity(): EntityId {
    const id = this.freeIds.pop() ?? this.nextEntityId++;
    this.alive.add(id);
    return id;
  }

  destroyEntity(id: EntityId): void {
    if (!this.alive.has(id)) {
      return;
    }

    this.alive.delete(id);
    this.freeIds.push(id);

    for (const store of this.components.values()) {
      store.delete(id);
    }
  }

  isAlive(id: EntityId): boolean {
    return this.alive.has(id);
  }

  registerComponent<T>(componentId: ComponentId<T>): void {
    this.getOrCreateComponentStore(componentId);
  }

  addComponent<T>(id: EntityId, componentId: ComponentId<T>, data: T): void {
    if (!this.alive.has(id)) {
      throw new Error(`Cannot add component to missing entity ${id}`);
    }

    const store = this.getOrCreateComponentStore(componentId);
    store.set(id, data);
  }

  removeComponent<T>(id: EntityId, componentId: ComponentId<T>): void {
    if (!this.alive.has(id)) {
      throw new Error(`Cannot remove component from missing entity ${id}`);
    }

    const store = this.getComponentStore(componentId);
    store?.delete(id);
  }

  getComponent<T>(id: EntityId, componentId: ComponentId<T>): T | undefined {
    if (!this.alive.has(id)) {
      return undefined;
    }

    const store = this.getComponentStore(componentId);
    return store?.get(id);
  }

  hasComponent<T>(id: EntityId, componentId: ComponentId<T>): boolean {
    if (!this.alive.has(id)) {
      return false;
    }

    const store = this.getComponentStore(componentId);
    return store?.has(id) ?? false;
  }

  query(componentIds: ComponentId<unknown>[], out: EntityId[] = []): EntityId[] {
    return queryEntities(this, componentIds, out);
  }

  getAliveEntities(out: EntityId[] = []): EntityId[] {
    out.length = 0;

    for (const id of this.alive) {
      out.push(id);
    }

    out.sort((a, b) => a - b);
    return out;
  }

  getComponentStore<T>(componentId: ComponentId<T>): Map<EntityId, T> | undefined {
    return this.components.get(componentId) as Map<EntityId, T> | undefined;
  }

  private getOrCreateComponentStore<T>(componentId: ComponentId<T>): Map<EntityId, T> {
    let store = this.getComponentStore(componentId);

    if (!store) {
      store = new Map<EntityId, T>();
      this.components.set(componentId, store as Map<EntityId, unknown>);
    }

    return store;
  }
}
