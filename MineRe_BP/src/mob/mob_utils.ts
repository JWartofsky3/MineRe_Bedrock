import {
  Dimension,
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
  EntityTypeFamilyComponent,
} from "@minecraft/server";
import { isValid } from "util/vector3Functions";

export function isAlive(entity: Entity): boolean {
  if (!entity) {
    return false;
  }
  const health = entity?.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health) {
    return false;
  }
  return health.currentValue > 0;
}

export function isFamily(entity: Entity, families: Set<string>): boolean {
  if (!entity) {
    return false;
  }
  const family = entity.getComponent(
    EntityComponentTypes.TypeFamily,
  ) as EntityTypeFamilyComponent;
  if (!family || family === null) {
    return false;
  }
  for (let i = 0; i < family.getTypeFamilies().length; i++) {
    if (families.has(family.getTypeFamilies()[i])) {
      return true;
    }
  }
  return false;
}

export function isLoaded(entity: Entity): boolean {
  if (!entity.isValid() || !entity?.dimension) {
    return false;
  }
  const entities: Entity[] = entity.dimension.getEntities({
    maxDistance: 1.0,
    location: entity.location,
    families: (
      entity?.getComponent(
        EntityComponentTypes.TypeFamily,
      ) as EntityTypeFamilyComponent
    )?.getTypeFamilies(),
  });
  for (let i = 0; i < entities.length; i++) {
    if (entities[i].id === entity.id) {
      return true;
    }
  }
  return false;
}
