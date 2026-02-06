import { EntityComponentTypes, world } from "@minecraft/server";
import { HEALING_FROM_SOUP } from "settings";
const healingItems = {
  "minecraft:honey_bottle": 2.0,
  "minecraft:potion": 2.0,
  "minecraft:milk_bucket": 4.0,
  "minecraft:mushroom_stew": 4.0,
  "minecraft:beetroot_soup": 4.0,
  "minecraft:suspicious_stew": 4.0,
  "minecraft:rabbit_stew": 7.0,
  "minecraft:golden_apple": 3.0,
  "minecraft:enchanted_golden_apple": 9.0,
};
export const healFromItem = (data) => {
  if (data.source.typeId !== "minecraft:player") {
    return;
  }
  if (!world?.getDynamicProperty(HEALING_FROM_SOUP)?.valueOf()) {
    return;
  }
  const player = data.source;
  const health = player.getComponent(EntityComponentTypes.Health);
  const itemId = data.itemStack.typeId;
  if (!!health && !!healingItems[itemId]) {
    const healingAmount = healingItems[itemId];
    health.setCurrentValue(
      Math.min(health.effectiveMax, health.currentValue + healingAmount),
    );
  }
};
