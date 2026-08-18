import {
  EntityComponentTypes,
  EquipmentSlot,
  GameMode,
  Player,
  world,
} from "@minecraft/server";
import {
  getGuideDiscoveryCategory,
  setGuideDiscoveryCategory,
} from "guide/discoveryStorage";
import { sendGuideDiscoveryMessage } from "guide/discoveryMessage";

type EquipmentDiscoveryData = Record<string, true>;

export const DISCOVERABLE_EQUIPMENT = {
  magicStaves: [
    "minere:amethyst_staff",
    "minere:blaster_staff",
    "minere:echo_staff",
    "minere:emerald_staff",
    "minere:fire_staff",
    "minere:ice_staff",
    "minere:shadow_staff",
  ],
  magicSwords: [
    "minere:darkheart",
    "minere:firebrand",
    "minere:ghostwalker",
    "minere:ice_dagger",
    "minere:illumina",
    "minere:venom_shank",
    "minere:windforce",
  ],
  magicTools: [
    "minere:fire_axe",
    "minere:ice_pick",
    "minere:shadow_scythe",
    "minere:wind_shovel",
  ],
  magicArmor: ["minere:inferno_crown", "minere:ice_crown"],
} as const;

export const GUIDE_EQUIPMENT_DISCOVERY_TOTAL =
  DISCOVERABLE_EQUIPMENT.magicStaves.length +
  DISCOVERABLE_EQUIPMENT.magicSwords.length +
  DISCOVERABLE_EQUIPMENT.magicTools.length +
  DISCOVERABLE_EQUIPMENT.magicArmor.length;

const discoverableEquipmentIds = new Set<string>(
  Object.values(DISCOVERABLE_EQUIPMENT).flat(),
);

function getEquipmentDiscoveryData(player: Player): EquipmentDiscoveryData {
  const entries = getGuideDiscoveryCategory(player, "equipment");
  const discoveries: EquipmentDiscoveryData = {};
  for (const [typeId, discovered] of Object.entries(entries)) {
    if (typeId.startsWith("minere:") && discovered === true) {
      discoveries[typeId] = true;
    }
  }
  return discoveries;
}

export function hasDiscoveredEquipment(
  player: Player,
  itemId: string,
): boolean {
  return getEquipmentDiscoveryData(player)[itemId] === true;
}

export function getDiscoveredEquipmentCount(
  player: Player,
  itemIds: readonly string[],
): number {
  const discoveries = getEquipmentDiscoveryData(player);
  return itemIds.filter((itemId) => discoveries[itemId]).length;
}

export function getDiscoveredEquipmentTotal(player: Player): number {
  return Object.values(DISCOVERABLE_EQUIPMENT).reduce(
    (total, itemIds) => total + getDiscoveredEquipmentCount(player, itemIds),
    0,
  );
}

export function discoverEquipment(player: Player, itemId: string): void {
  if (player.getGameMode() === GameMode.Creative) {
    return;
  }

  if (!discoverableEquipmentIds.has(itemId)) {
    return;
  }

  const discoveries = getEquipmentDiscoveryData(player);
  if (discoveries[itemId]) {
    return;
  }

  discoveries[itemId] = true;
  setGuideDiscoveryCategory(player, "equipment", discoveries);
  sendGuideDiscoveryMessage(player, { translate: `item.${itemId}` });
}

function discoverEquippedEquipment(player: Player): void {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (!equippable) {
    return;
  }

  for (const slot of [
    EquipmentSlot.Head,
    EquipmentSlot.Chest,
    EquipmentSlot.Legs,
    EquipmentSlot.Feet,
    EquipmentSlot.Mainhand,
    EquipmentSlot.Offhand,
  ]) {
    const item = equippable.getEquipment(slot);
    if (item) {
      discoverEquipment(player, item.typeId);
    }
  }
}

export function initializeGuideEquipmentDiscovery(): void {
  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    if (event.itemStack) {
      discoverEquipment(event.player, event.itemStack.typeId);
    }
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    discoverEquippedEquipment(event.player);
  });
}
