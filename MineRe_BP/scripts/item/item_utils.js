import {
  EntityComponentTypes,
  Player,
  ItemComponentTypes,
  EquipmentSlot,
} from "@minecraft/server";
import { isAlive } from "mob/mob_utils";
export function findAnyPlanks(container) {
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId.includes("planks")) {
      return i;
    }
  }
  return -1;
}
export function findItemInContainer(container, typeId) {
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId == typeId) {
      return i;
    }
  }
  return -1;
}
export function getItem(dimension, location, typeId) {
  const allItems = dimension.getEntities({
    type: "minecraft:item",
    closest: 1,
    location: location,
    maxDistance: 2,
  });
  const items = allItems.filter((entity) => {
    const item = entity.getComponent(EntityComponentTypes.Item);
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
export function checkCooldown(item, entity) {
  if (!(entity instanceof Player)) {
    return false;
  }
  if (!isAlive(entity)) {
    return false;
  }
  const player = entity;
  const cooldownComponent = item?.getComponent(ItemComponentTypes.Cooldown);
  if (
    !cooldownComponent ||
    cooldownComponent.getCooldownTicksRemaining(player) > 0
  ) {
    return false;
  }
  cooldownComponent.startCooldown(player);
  return true;
}
export const hasSilkTouchOrShears = (player) => {
  if (player == null) {
    return false;
  }
  const equipment = player.getComponent(EntityComponentTypes.Equippable);
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
  const enchantable = item.getComponent(ItemComponentTypes.Enchantable);
  if (enchantable && enchantable.hasEnchantment("silk_touch")) {
    return true;
  }
  return false;
};
export const getEnchantmentLevel = (
  player,
  enchantmentId,
  equipmentSlot = EquipmentSlot.Mainhand,
) => {
  if (player == null) {
    return 0;
  }
  const equipment = player.getComponent(EntityComponentTypes.Equippable);
  if (!equipment) {
    return 0;
  }
  const item = equipment.getEquipmentSlot(equipmentSlot)?.getItem();
  if (!item) {
    return 0;
  }
  const enchantable = item.getComponent(ItemComponentTypes.Enchantable);
  if (enchantable && enchantable.hasEnchantment(enchantmentId)) {
    return enchantable.getEnchantment(enchantmentId).level;
  }
  return 0;
};
export const hasPickaxe = (player) => {
  if (player == null) {
    return false;
  }
  const equipment = player.getComponent(EntityComponentTypes.Equippable);
  if (!equipment) {
    return false;
  }
  const item = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem();
  if (!item) {
    return false;
  }
  return item.typeId.includes("pickaxe");
};
