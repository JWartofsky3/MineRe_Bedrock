import {
  Dimension,
  ItemStack,
  Vector3,
  Entity,
  EntityComponentTypes,
  EntityItemComponent,
  Player,
  ItemComponentTypes,
  ItemCooldownComponent,
} from "@minecraft/server";
import { isAlive } from "mob/mob_utils";

export function getItem(
  dimension: Dimension,
  location: Vector3,
  typeId: string,
): Entity | undefined {
  const allItems = dimension.getEntities({
    type: "minecraft:item",
    closest: 1,
    location: location,
    maxDistance: 2,
  }) as Entity[];
  const items = allItems.filter((entity: Entity) => {
    const item = entity.getComponent(
      EntityComponentTypes.Item,
    ) as EntityItemComponent;
    if (!item) {
      return false;
    }
    if (item.itemStack.typeId === typeId) {
      return true;
    }
  });
  if (items.length < 1) {
    return;
  }
  return items[0];
}

export function checkCooldown(item: ItemStack, entity: Entity): boolean {
  if (!(entity instanceof Player)) {
    return false;
  }
  if (!isAlive(entity)) {
    return false;
  }
  const player = entity as Player;
  const cooldownComponent = item?.getComponent(
    ItemComponentTypes.Cooldown,
  ) as ItemCooldownComponent;
  if (
    !cooldownComponent ||
    cooldownComponent.getCooldownTicksRemaining(player) > 0
  ) {
    return false;
  }
  cooldownComponent.startCooldown(player);
  return true;
}
