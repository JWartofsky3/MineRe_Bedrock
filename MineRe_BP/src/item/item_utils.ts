import {
  Container,
  Dimension,
  ItemStack,
  Vector3,
  Entity,
  EntityComponentTypes,
  EntityItemComponent,
  Player,
  ItemComponentTypes,
  ItemCooldownComponent,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemEnchantableComponent,
} from "@minecraft/server";
import { isAlive } from "mob/mob_utils";

export function findAnyPlanks(container: Container): number {
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId.includes("planks")) {
      return i;
    }
  }
  return -1;
}

export function findItemInContainer(
  container: Container,
  typeId: string,
): number {
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId == typeId) {
      return i;
    }
  }
  return -1;
}

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

export const hasSilkTouchOrShears = (player: Player): boolean => {
  if (player == null) {
    return false;
  }
  const equipment = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equipment) {
    return false;
  }
  const item = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
  if (!item) {
    return false;
  }
  if (item.typeId.includes("shears")) {
    return true;
  }

  const enchantable = item.getComponent(
    ItemComponentTypes.Enchantable,
  ) as ItemEnchantableComponent;
  if (enchantable && enchantable.hasEnchantment("silk_touch")) {
    return true;
  }

  return false;
};

export const getEnchantmentLevel = (
  player: Player,
  enchantmentId: string,
  equipmentSlot: EquipmentSlot = EquipmentSlot.Mainhand,
): number => {
  if (player == null) {
    return 0;
  }
  const equipment = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equipment) {
    return 0;
  }
  const item = equipment.getEquipmentSlot(equipmentSlot)?.getItem();
  if (!item) {
    return 0;
  }

  const enchantable = item.getComponent(
    ItemComponentTypes.Enchantable,
  ) as ItemEnchantableComponent;
  if (enchantable && enchantable.hasEnchantment(enchantmentId)) {
    return enchantable.getEnchantment(enchantmentId).level;
  }

  return 0;
};

export const hasPickaxe = (player: Player): boolean => {
  if (player == null) {
    return false;
  }
  const equipment = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equipment) {
    return false;
  }
  const item = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
  if (!item) {
    return false;
  }

  return item.typeId.includes("pickaxe");
};
