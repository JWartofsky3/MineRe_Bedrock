import {
  Player,
  EntityAttributeComponent,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemStack,
  ItemComponentTypes,
  ItemEnchantableComponent,
} from "@minecraft/server";
import { ARMOR_WEIGHT } from "settings";
import { world } from "@minecraft/server";

const BASE_MOVEMENT = 0.1;
const HEAVY_ARMOR_MULT = 0.95;
const LIGHT_ARMOR_MULT = 1.05;
const SPRINT_MULT = 1.3;
const SNEAK_MULT = 0.3;

const lightArmorKeyWords: string[] = [
  "leather",
  "chain",
  "enderon",
  "aetherial",
  "elytra",
  "cap",
  "fur",
  "wolf",
  "hat",
  "hide",
  "fur",
  "light",
  "straw",
  "paper",
  "wood",
  "wooden",
  "crunching",
  "creaking",
  "membrane",
  "cloak",
  "crown",
  "robe",
  "robes",
  "cape",
  "cloth",
];

const lightArmorSet: Set<string> = new Set();
const heavyArmorSet: Set<string> = new Set();
const armorItemKeyWords: string[] = [
  "helmet",
  "chestplate",
  "leggings",
  "boots",
  "crown",
  "cap",
  "hat",
  "robe",
  "robes",
  "cloak",
  "cape",
  "elytra",
];
const excludedArmorKeyWords: string[] = ["horse"];
export type ArmorWeightKind = "light" | "heavy";

export function armorWeight(player: Player) {
  if (!player) {
    return;
  }
  let diff = (LIGHT_ARMOR_MULT - HEAVY_ARMOR_MULT) / 4;
  const equippable = player?.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  const movementCopmonent = player?.getComponent(
    "movement",
  ) as EntityAttributeComponent;
  if (!equippable || !movementCopmonent) {
    return;
  }

  // JUMP BOOTS
  if (
    equippable.isValid &&
    equippable.getEquipment(EquipmentSlot.Feet)?.typeId === "minere:jump_boots"
  ) {
    player.addEffect("jump_boost", 20, { showParticles: false, amplifier: 2 });
  }

  const heavyCount =
    getItemWeight(equippable.getEquipment(EquipmentSlot.Head)) +
    getItemWeight(equippable.getEquipment(EquipmentSlot.Chest)) +
    getItemWeight(equippable.getEquipment(EquipmentSlot.Legs)) +
    getItemWeight(equippable.getEquipment(EquipmentSlot.Feet));
  let baseMoveSpeed = LIGHT_ARMOR_MULT - heavyCount * diff;
  if (player.isSprinting) {
    baseMoveSpeed *= SPRINT_MULT;
  }
  const finalSpeedValue =
    BASE_MOVEMENT *
    baseMoveSpeed *
    getPotionModifier(player) *
    getSoulSpeedMultiplier(player);
  movementCopmonent.setCurrentValue(finalSpeedValue);
}

export function isArmorWeightEnabled(): boolean {
  return !!world.getDynamicProperty(ARMOR_WEIGHT)?.valueOf();
}

export function getArmorWeightKind(item: ItemStack | undefined): ArmorWeightKind | null {
  if (!isArmorWeightAffectedItem(item)) {
    return null;
  }
  if (!item?.typeId) {
    return null;
  }
  if (lightArmorSet.has(item.typeId)) {
    return "light";
  }
  if (heavyArmorSet.has(item.typeId)) {
    return "heavy";
  }

  const idWords = getIdWords(item.typeId);
  for (let i = 0; i < lightArmorKeyWords.length; i++) {
    if (idWords.has(lightArmorKeyWords[i])) {
      lightArmorSet.add(item.typeId);
      return "light";
    }
  }

  heavyArmorSet.add(item.typeId);
  return "heavy";
}

export function isArmorWeightAffectedItem(item: ItemStack | undefined): boolean {
  if (!item?.typeId) {
    return false;
  }
  if (!item.getComponent(ItemComponentTypes.Durability)) {
    return false;
  }
  if (!item.getComponent(ItemComponentTypes.Enchantable)) {
    return false;
  }

  const idWords = getIdWords(item.typeId);
  for (let i = 0; i < excludedArmorKeyWords.length; i++) {
    if (idWords.has(excludedArmorKeyWords[i])) {
      return false;
    }
  }
  for (let i = 0; i < armorItemKeyWords.length; i++) {
    if (idWords.has(armorItemKeyWords[i])) {
      return true;
    }
  }

  return false;
}

function getItemWeight(item: ItemStack): number {
  return getArmorWeightKind(item) === "heavy" ? 1 : 0;
}

function getIdWords(typeId: string): Set<string> {
  const parts = typeId.split(":");
  const itemId = parts.length > 1 ? parts[1] : parts[0];
  const words = itemId.split("_");

  return new Set(words);
}

function getSoulSpeedMultiplier(player: Player) {
  if (!player) {
    return 1.0;
  }
  if (!player?.isOnGround) {
    return 1.0;
  }
  if (player.location.y - 0.75 < player.dimension.heightRange.min) {
    return 1.0;
  }
  const block = player.dimension.getBlock({
    x: player.location.x,
    y: player.location.y - 0.75,
    z: player.location.z,
  });
  if (!block) {
    return 1.0;
  }
  if (!block?.typeId.includes("soul")) {
    return 1.0;
  }
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return 1.0;
  }
  const feet = equippable.getEquipment(EquipmentSlot.Feet);
  if (!feet) {
    return 1.0;
  }
  const enchantable = feet.getComponent(
    ItemComponentTypes.Enchantable,
  ) as ItemEnchantableComponent;
  if (!enchantable) {
    return 1.0;
  }
  if (enchantable.hasEnchantment("soul_speed")) {
    const level = enchantable.getEnchantment("soul_speed").level;
    if (level === 1) {
      return 1.405;
    }
    if (level === 2) {
      return 1.51;
    }
    if (level === 3) {
      return 1.615;
    }
  }
  return 1.0;
}

function getSneakMultiplier(player: Player) {
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return SNEAK_MULT;
  }
  const leggings = equippable.getEquipment(EquipmentSlot.Legs);
  if (!leggings) {
    return SNEAK_MULT;
  }
  const enchantable = leggings.getComponent(
    ItemComponentTypes.Enchantable,
  ) as ItemEnchantableComponent;
  if (!enchantable) {
    return SNEAK_MULT;
  }
  if (enchantable.hasEnchantment("swift_sneak")) {
    return Math.min(
      1.0,
      SNEAK_MULT + 0.15 * enchantable.getEnchantment("swift_sneak").level,
    );
  }
  return SNEAK_MULT;
}

function getPotionModifier(player: Player) {
  let speedMod = 0;
  const speedEffect = player.getEffect("speed");
  if (speedEffect) {
    speedMod = 0.2 + 0.2 * speedEffect.amplifier;
  }

  let slownessMod = 0;
  const slownessEffect = player.getEffect("slowness");
  if (slownessEffect) {
    slownessMod = -1 * (0.2 + 0.2 * slownessEffect.amplifier);
  }

  return 1.0 + speedMod + slownessMod;
}
