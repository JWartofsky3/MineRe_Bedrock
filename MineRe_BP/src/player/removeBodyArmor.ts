import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EquipmentSlot,
  world,
} from "@minecraft/server";

const ANIMAL_ARMOR_IDS = new Set<string>([
  "minere:copper_bear_armor",
  "minere:gold_bear_armor",
  "minere:iron_bear_armor",
  "minere:diamond_bear_armor",
  "minere:netherite_bear_armor",
  "minere:enderon_bear_armor",
  "minere:indigon_bear_armor",
  "minere:copper_elephant_armor",
  "minere:gold_elephant_armor",
  "minere:iron_elephant_armor",
  "minere:diamond_elephant_armor",
  "minere:netherite_elephant_armor",
  "minere:enderon_elephant_armor",
  "minere:indigon_elephant_armor",
  "minere:enderon_horse_armor",
  "minere:indigon_horse_armor",
]);

/** Moves equipped MineRe animal armor into inventory, or drops it when full. */
export function removePlayerBodyArmor(): void {
  for (const player of world.getAllPlayers()) {
    const equippable = player.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent | undefined;
    const bodyItem = equippable?.getEquipment(EquipmentSlot.Body);
    if (!bodyItem || !ANIMAL_ARMOR_IDS.has(bodyItem.typeId)) continue;

    equippable.setEquipment(EquipmentSlot.Body, undefined);

    const inventory = player.getComponent(
      EntityComponentTypes.Inventory,
    ) as EntityInventoryComponent | undefined;
    const remaining = inventory?.container.addItem(bodyItem) ?? bodyItem;
    if (remaining) player.dimension.spawnItem(remaining, player.location);
  }
}
