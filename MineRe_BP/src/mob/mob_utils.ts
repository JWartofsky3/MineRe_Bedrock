import {
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
  EntityTypeFamilyComponent,
} from "@minecraft/server";

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
