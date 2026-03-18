import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  ItemStack,
  Player,
  RawMessage,
} from "@minecraft/server";

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
  const loreKeys = ITEM_LORE_KEYS[item.typeId];

  if (!loreKeys) {
    return false;
  }

  const lore = createLore(loreKeys);
  if (hasMatchingLore(item, lore)) {
    return false;
  }

  item.setLore(lore);
  return true;
}

function createLore(loreKeys: string[]): RawMessage[] {
  const lore: RawMessage[] = [];

  for (let i = 0; i < loreKeys.length; i++) {
    lore.push({
      translate: loreKeys[i],
    });
  }

  return lore;
}

function hasMatchingLore(item: ItemStack, lore: RawMessage[]): boolean {
  const currentLore = item.getRawLore();

  if (currentLore.length !== lore.length) {
    return false;
  }

  return JSON.stringify(currentLore) === JSON.stringify(lore);
}
