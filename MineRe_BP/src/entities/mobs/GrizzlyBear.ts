import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EntityInventoryComponent,
  EntityIsChestedComponent,
  EntityLoadAfterEvent,
  EntityMarkVariantComponent,
  EquipmentSlot,
  ItemStack,
  PlayerInteractWithEntityAfterEvent,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";

const GRIZZLY_BEAR_TYPE_ID = "minere:grizzly_bear";

const LEGACY_ARMOR_ID_BY_MARK_VARIANT = new Map<number, string>([
  [1, "minere:copper_bear_armor"],
  [2, "minere:iron_bear_armor"],
  [3, "minere:gold_bear_armor"],
  [4, "minere:diamond_bear_armor"],
  [5, "minere:netherite_bear_armor"],
  [6, "minere:enderon_bear_armor"],
  [7, "minere:indigon_bear_armor"],
]);

export class GrizzlyBear extends BaseCustomEntity {
  constructor() {
    super(GRIZZLY_BEAR_TYPE_ID);
  }

  onEntityLoad(data: EntityLoadAfterEvent): void {
    const bear = data.entity;
    const markVariant = bear.getComponent(
      EntityComponentTypes.MarkVariant,
    ) as EntityMarkVariantComponent;
    const legacyArmorId = LEGACY_ARMOR_ID_BY_MARK_VARIANT.get(
      markVariant?.value,
    );
    if (!legacyArmorId) {
      return;
    }

    // Armored bears used to replace the armorable component group. Restore it
    // before placing their armor in the new body slot.
    bear.triggerEvent("minere:clear_legacy_armor");

    const equipment = bear.getComponent(
      EntityComponentTypes.Equippable,
    ) as EntityEquippableComponent;
    if (!equipment.getEquipment(EquipmentSlot.Body)) {
      equipment.setEquipment(EquipmentSlot.Body, new ItemStack(legacyArmorId));
    }

    bear.triggerEvent("minere:refresh_bear_body_armor");
  }

  onPlayerInteractWithEntity(
    data: PlayerInteractWithEntityAfterEvent,
  ): void {
    if (data.itemStack?.typeId !== "minecraft:shears") {
      return;
    }

    const bear = data.target;
    const chestComponent = bear.getComponent(
      EntityComponentTypes.IsChested,
    ) as EntityIsChestedComponent;
    const inventory = bear.getComponent(
      EntityComponentTypes.Inventory,
    ) as EntityInventoryComponent;
    if (
      !chestComponent?.isValid ||
      !inventory?.isValid ||
      inventory.container.weight !== 0
    ) {
      return;
    }

    bear.dimension.spawnItem(new ItemStack("minecraft:chest"), bear.location);
    bear.dimension.playSound("mob.sheep.shear", bear.location);
    bear.triggerEvent("minere:on_remove_chest");
  }
}
