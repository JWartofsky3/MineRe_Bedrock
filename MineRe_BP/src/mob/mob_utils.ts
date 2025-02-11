import {
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
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
