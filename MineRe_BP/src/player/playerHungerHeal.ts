import {
  EntityHealthChangedAfterEvent,
  EntityHealthComponent,
  EntityComponentTypes,
} from "@minecraft/server";

// makes the player heal half as much from hunger. It is disabled while player has Regeneration effect.
export const playerHungerHeal = (data: EntityHealthChangedAfterEvent) => {
  if (data.entity.typeId !== "minecraft:player") {
    return;
  }

  if (
    data.entity.getEffect("regeneration") ||
    data.entity.getEffect("absorption")
  ) {
    return;
  }
  const diff = data.newValue - data.oldValue;
  if (diff > 0.5 && diff <= 1.0) {
    const health: EntityHealthComponent = data.entity.getComponent(
      EntityComponentTypes.Health,
    ) as EntityHealthComponent;
    if (!!health) {
      health.setCurrentValue(data.newValue - 0.5);
    }
  }
};
