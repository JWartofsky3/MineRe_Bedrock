import {
  Player,
  EntityComponentTypes,
  EntityHealthComponent,
  ItemCompleteUseAfterEvent,
} from "@minecraft/server";

const healingItems = {
  "minecraft:honey_bottle": 2.0,
  "minecraft:potion": 2.0,
  "minecraft:milk_bucket": 4.0,
  "minecraft:mushroom_stew": 4.0,
  "minecraft:beetroot_soup": 4.0,
  "minecraft:suspicious_stew": 4.0,
  "minecraft:rabbit_stew": 6.0,
};

export const healFromItem = (data: ItemCompleteUseAfterEvent) => {
  if (data.source.typeId !== "minecraft:player") {
    return;
  }
  const player: Player = data.source as Player;
  const health: EntityHealthComponent = player.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  const itemId = data.itemStack.typeId;
  if (!!health && !!healingItems[itemId]) {
    const healingAmount = healingItems[itemId];
    health.setCurrentValue(health.currentValue + healingAmount);
  }
};
