import { EntityComponentTypes } from "@minecraft/server";
export function isAlive(entity) {
  if (!entity) {
    return false;
  }
  const health = entity?.getComponent(EntityComponentTypes.Health);
  if (!health) {
    return false;
  }
  return health.currentValue > 0;
}
export function isFamily(entity, families) {
  if (!entity) {
    return false;
  }
  const family = entity.getComponent(EntityComponentTypes.TypeFamily);
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
