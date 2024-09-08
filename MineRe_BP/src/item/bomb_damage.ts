import {
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
} from "@minecraft/server";

export function bombDamage(entity: Entity, damage: number) {
  const health = entity?.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health) {
    return;
  }
  if (entity.typeId === "minecraft:player") {
    health.setCurrentValue(health.currentValue - damage * 0.5);
  } else {
    health.setCurrentValue(health.currentValue - damage * 1.0);
  }
}
