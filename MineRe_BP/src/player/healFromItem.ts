import {
  Player,
  EntityComponentTypes,
  EntityHealthComponent,
  ItemCompleteUseAfterEvent,
  world,
} from "@minecraft/server";
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

export const healFromItem = (data: ItemCompleteUseAfterEvent) => {
  if (data.source.typeId !== "minecraft:player") {
    return;
  }

  if (!world?.getDynamicProperty(HEALING_FROM_SOUP)?.valueOf()) {
    return;
  }

  const player: Player = data.source as Player;
  const health: EntityHealthComponent = player.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;

  const itemId = data.itemStack.typeId;
  if (!!health && !!healingItems[itemId]) {
    const healingAmount = healingItems[itemId];
    health.setCurrentValue(
      Math.min(health.effectiveMax, health.currentValue + healingAmount),
    );
  }
};
