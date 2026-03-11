import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityHurtAfterEvent,
  EquipmentSlot,
  Player,
  system,
} from "@minecraft/server";
import { getHealth } from "entities/utilities/common";

const INDIGON_HELMET_ITEM_ID = "minere:indigon_helmet";
const INDIGON_CHESTPLATE_ITEM_ID = "minere:indigon_chestplate";
const INDIGON_LEGGINGS_ITEM_ID = "minere:indigon_leggings";
const INDIGON_BOOTS_ITEM_ID = "minere:indigon_boots";
const INDIGON_ARMOR_MESSAGE = "info.minere:indigon_armor.activate";
const INDIGON_ARMOR_SOUND_ID = "item.armor.powerup";
const FULL_SET_PIECES = 4;
const INDIGON_ARMOR_COOLDOWN_PROPERTY = "minere:indigon_armor_cooldown";
const INDIGON_ARMOR_COOLDOWN_TICKS = 20 * 60;

const EFFECT_DURATIONS = {
  STRENGTH: 20 * 16,
  FIRE_RESISTANCE: 20 * 4,
  REGENERATION: 20 * 12,
  SPEED: 20 * 16,
  JUMP_BOOST: 20 * 16,
};

export function indigonArmorOnEntityHurt(data: EntityHurtAfterEvent) {
  const player = data.hurtEntity;
  if (!(player instanceof Player)) {
    return;
  }

  const health = getHealth(player);
  if (!health) {
    return;
  }
  if (health.currentValue > health.effectiveMax / 2) {
    return;
  }

  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  if (!equippable) {
    return;
  }

  const equippedIndigonPieces = getEquippedIndigonPieces(equippable);
  if (equippedIndigonPieces.length === 0) {
    return;
  }

  if (
    isPlayerOnCooldown(
      player,
      INDIGON_ARMOR_COOLDOWN_PROPERTY,
      INDIGON_ARMOR_COOLDOWN_TICKS,
    )
  ) {
    return;
  }
  player.setDynamicProperty(
    INDIGON_ARMOR_COOLDOWN_PROPERTY,
    system.currentTick,
  );

  const durationScale = equippedIndigonPieces.length / FULL_SET_PIECES;
  player.addEffect(
    "strength",
    scaleDuration(EFFECT_DURATIONS.STRENGTH, durationScale),
    {
      amplifier: 1,
    },
  );
  player.addEffect(
    "resistance",
    scaleDuration(EFFECT_DURATIONS.FIRE_RESISTANCE, durationScale),
  );
  player.addEffect(
    "regeneration",
    scaleDuration(EFFECT_DURATIONS.REGENERATION, durationScale),
    {
      amplifier: 1,
    },
  );
  player.addEffect(
    "speed",
    scaleDuration(EFFECT_DURATIONS.SPEED, durationScale),
    {
      amplifier: 1,
    },
  );
  player.addEffect(
    "jump_boost",
    scaleDuration(EFFECT_DURATIONS.JUMP_BOOST, durationScale),
    {
      amplifier: 1,
    },
  );
  player.dimension.playSound(INDIGON_ARMOR_SOUND_ID, player.location);
  player.sendMessage({
    translate: INDIGON_ARMOR_MESSAGE,
  });
}

function getEquippedIndigonPieces(
  equippable: EntityEquippableComponent,
): string[] {
  const slots = [
    equippable.getEquipment(EquipmentSlot.Head),
    equippable.getEquipment(EquipmentSlot.Chest),
    equippable.getEquipment(EquipmentSlot.Legs),
    equippable.getEquipment(EquipmentSlot.Feet),
  ];
  const equippedIndigonPieces: string[] = [];

  for (const item of slots) {
    if (!item) {
      continue;
    }
    if (!isIndigonArmorPiece(item.typeId)) {
      continue;
    }
    equippedIndigonPieces.push(item.typeId);
  }

  return equippedIndigonPieces;
}

function isIndigonArmorPiece(itemId: string): boolean {
  return (
    itemId === INDIGON_HELMET_ITEM_ID ||
    itemId === INDIGON_CHESTPLATE_ITEM_ID ||
    itemId === INDIGON_LEGGINGS_ITEM_ID ||
    itemId === INDIGON_BOOTS_ITEM_ID
  );
}

function scaleDuration(duration: number, scale: number): number {
  return Math.max(1, Math.floor(duration * scale));
}

function isPlayerOnCooldown(
  player: Player,
  propertyId: string,
  cooldownTicks: number,
): boolean {
  const cooldown = player.getDynamicProperty(propertyId);

  return (
    typeof cooldown === "number" &&
    system.currentTick - cooldown < cooldownTicks
  );
}
