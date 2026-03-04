import { world, EntityComponentTypes } from "@minecraft/server";
import { REDUCED_HEALTH_REGEN } from "settings";
// makes the player heal half as much from hunger. It is disabled while player has Regeneration effect.
export const playerHungerHeal = (data) => {
  if (data.entity.typeId !== "minecraft:player") {
    return;
  }
  if (!world?.getDynamicProperty(REDUCED_HEALTH_REGEN)?.valueOf()) {
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
    const health = data.entity.getComponent(EntityComponentTypes.Health);
    if (!!health) {
      health.setCurrentValue(data.newValue - 0.5);
    }
  }
};
