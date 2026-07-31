import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  ItemStack,
  Player,
  RawMessage,
} from "@minecraft/server";
import {
  getArmorWeightKind,
  isArmorWeightAffectedItem,
  isArmorWeightEnabled,
} from "player/armorWeight";

const ITEM_LORE_SYNC_INTERVAL = 20;

const ITEM_LORE_KEYS: Record<string, string[]> = {
  "minere:enderon_helmet": ["lore.minere:enderon_armor"],
  "minere:enderon_chestplate": ["lore.minere:enderon_armor"],
  "minere:enderon_leggings": ["lore.minere:enderon_armor"],
  "minere:enderon_boots": ["lore.minere:enderon_armor"],
  "minere:aetherial_helmet": ["lore.minere:aetherial_armor"],
  "minere:aetherial_chestplate": ["lore.minere:aetherial_armor"],
  "minere:aetherial_leggings": ["lore.minere:aetherial_armor"],
  "minere:aetherial_boots": ["lore.minere:aetherial_armor"],
  "minere:indigon_helmet": ["lore.minere:indigon_armor"],
  "minere:indigon_chestplate": ["lore.minere:indigon_armor"],
  "minere:indigon_leggings": ["lore.minere:indigon_armor"],
  "minere:indigon_boots": ["lore.minere:indigon_armor"],
  "minere:inferno_crown": ["lore.minere:inferno_crown"],
  "minere:ice_crown": ["lore.minere:ice_crown"],
  "minere:ice_pick": ["lore.minere:ice_pick"],
  "minere:indigon_axe": ["lore.minere:indigon_tool"],
  "minere:indigon_hoe": ["lore.minere:indigon_tool"],
  "minere:indigon_pickaxe": ["lore.minere:indigon_tool"],
  "minere:indigon_shovel": ["lore.minere:indigon_tool"],
  "minere:indigon_spear": ["lore.minere:indigon_tool"],
  "minere:indigon_sword": ["lore.minere:indigon_tool"],
  "minere:darkheart": ["lore.minere:lifesteal_living"],
  "minere:shadow_scythe": ["lore.minere:lifesteal_living"],
};

const ARMOR_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
];
const ARMOR_WEIGHT_PREFIX = "§7Weight: ";
const LIGHT_ARMOR_TEXT = "§aLight";
const HEAVY_ARMOR_TEXT = "§cHeavy";

export function getItemLoreSyncInterval(): number {
  return ITEM_LORE_SYNC_INTERVAL;
}

export function syncItemLore(player: Player): void {
  syncInventoryLore(player);
  syncEquippedLore(player);
}

function syncInventoryLore(player: Player): void {
  const inventory = player.getComponent(
    EntityComponentTypes.Inventory,
  ) as EntityInventoryComponent;
  const container = inventory?.container;

  if (!container) {
    return;
  }

  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);

    if (!item || !applyLoreIfNeeded(item)) {
      continue;
    }

    container.setItem(i, item);
  }
}

function syncEquippedLore(player: Player): void {
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;

  if (!equippable) {
    return;
  }

  for (let i = 0; i < ARMOR_SLOTS.length; i++) {
    const slot = ARMOR_SLOTS[i];
    const item = equippable.getEquipment(slot);

    if (!item || !applyLoreIfNeeded(item)) {
      continue;
    }

    equippable.setEquipment(slot, item);
  }
}

function applyLoreIfNeeded(item: ItemStack): boolean {
  const nextLore = buildLore(item);
  const currentLore = item.getRawLore();

  if (hasMatchingLore(currentLore, nextLore)) {
    return false;
  }

  item.setLore(nextLore);
  return true;
}

function buildLore(item: ItemStack): RawMessage[] {
  const staticLore = createStaticLore(item.typeId);
  const currentLore = item.getRawLore();
  const preservedLore = getPreservedLore(item, currentLore, staticLore);
  const lore = [...staticLore, ...preservedLore];
  const armorWeightLore = createArmorWeightLore(item);

  if (armorWeightLore) {
    lore.push(armorWeightLore);
  }

  return lore;
}

function createStaticLore(typeId: string): RawMessage[] {
  const loreKeys = ITEM_LORE_KEYS[typeId];
  if (!loreKeys) {
    return [];
  }

  const lore: RawMessage[] = [];
  for (let i = 0; i < loreKeys.length; i++) {
    lore.push({
      translate: loreKeys[i],
    });
  }

  return lore;
}

function getPreservedLore(
  item: ItemStack,
  currentLore: RawMessage[],
  staticLore: RawMessage[],
): RawMessage[] {
  const preservedLore: RawMessage[] = [];

  for (let i = 0; i < currentLore.length; i++) {
    const line = currentLore[i];
    if (isArmorWeightLoreLine(line)) {
      continue;
    }
    if (isOwnedStaticLoreLine(item, line, staticLore)) {
      continue;
    }
    preservedLore.push(line);
  }

  return preservedLore;
}

function isOwnedStaticLoreLine(
  item: ItemStack,
  line: RawMessage,
  staticLore: RawMessage[],
): boolean {
  if (!ITEM_LORE_KEYS[item.typeId]) {
    return false;
  }

  for (let i = 0; i < staticLore.length; i++) {
    if (rawMessagesEqual(line, staticLore[i])) {
      return true;
    }
  }

  return false;
}

function createArmorWeightLore(item: ItemStack): RawMessage | null {
  if (!isArmorWeightEnabled() || !isArmorWeightAffectedItem(item)) {
    return null;
  }

  const weightKind = getArmorWeightKind(item);
  if (weightKind === "light") {
    return {
      rawtext: [{ text: ARMOR_WEIGHT_PREFIX }, { text: LIGHT_ARMOR_TEXT }],
    };
  }
  if (weightKind === "heavy") {
    return {
      rawtext: [{ text: ARMOR_WEIGHT_PREFIX }, { text: HEAVY_ARMOR_TEXT }],
    };
  }

  return null;
}

function isArmorWeightLoreLine(line: RawMessage): boolean {
  const rawtext = (line as { rawtext?: Array<{ text?: string }> }).rawtext;
  if (!rawtext || rawtext.length !== 2) {
    return false;
  }

  return (
    rawtext[0]?.text === ARMOR_WEIGHT_PREFIX &&
    (rawtext[1]?.text === LIGHT_ARMOR_TEXT || rawtext[1]?.text === HEAVY_ARMOR_TEXT)
  );
}

function hasMatchingLore(currentLore: RawMessage[], lore: RawMessage[]): boolean {
  if (currentLore.length !== lore.length) {
    return false;
  }

  return JSON.stringify(currentLore) === JSON.stringify(lore);
}

function rawMessagesEqual(left: RawMessage, right: RawMessage): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
  }
