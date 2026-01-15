import type { ComponentId, EntityId, QueryableWorld } from './types';

export const queryEntities = (
  world: QueryableWorld,
  componentIds: ComponentId<unknown>[],
  out: EntityId[] = [],
): EntityId[] => {
  out.length = 0;

  if (componentIds.length === 0) {
    return world.getAliveEntities(out);
  }

  let smallestStore: Map<EntityId, unknown> | undefined;
  for (const componentId of componentIds) {
    const store = world.getComponentStore(componentId);
    if (!store) {
      return out;
    }
    if (!smallestStore || store.size < smallestStore.size) {
      smallestStore = store as Map<EntityId, unknown>;
    }
  }

  if (!smallestStore || smallestStore.size === 0) {
    return out;
  }

  const stores: Map<EntityId, unknown>[] = [];
  for (const componentId of componentIds) {
    const store = world.getComponentStore(componentId);
    if (store) {
      stores.push(store as Map<EntityId, unknown>);
    }
  }

  for (const entityId of smallestStore.keys()) {
    let matches = true;
    for (const store of stores) {
      if (!store.has(entityId)) {
        matches = false;
        break;
      }
    }
    if (matches) {
      out.push(entityId);
    }
  }

  out.sort((a, b) => a - b);
  return out;
};
