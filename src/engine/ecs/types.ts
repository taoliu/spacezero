export type EntityId = number;

export type ComponentId<T> = string & { readonly __type?: T };

export interface QueryableWorld {
  getComponentStore<T>(componentId: ComponentId<T>): Map<EntityId, T> | undefined;
  getAliveEntities(out?: EntityId[]): EntityId[];
}
