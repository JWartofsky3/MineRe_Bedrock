import {
  Player,
  world,
  ItemComponentTypes,
  ItemDurabilityComponent,
  EntityInventoryComponent,
  EntityComponentTypes,
  ItemStack,
  EntityEquippableComponent,
  EquipmentSlot,
} from "@minecraft/server";
import { getEnchantmentLevel } from "./item_utils";

export function reduceDurability(
  source: Player,
  item: ItemStack,
  amount: number,
  equipmentSlot: EquipmentSlot = EquipmentSlot.Mainhand,
) {
  if (source === null || source.getGameMode() === "creative") {
    return;
  }

  const durability = item.getComponent(
    ItemComponentTypes.Durability,
  ) as ItemDurabilityComponent;
  const equippable = source.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  const inventory = source.getComponent(
    EntityComponentTypes.Inventory,
  ) as EntityInventoryComponent;
  if (!durability || !inventory || !equippable) {
    return;
  }

  const unbreakingLevel = getEnchantmentLevel(
    source,
    "unbreaking",
    equipmentSlot,
  );
  if (amount > 10) {
    durability.damage = Math.min(
      durability.maxDurability,
      durability.damage + amount / (1 + unbreakingLevel),
    );
    if (durability.damage == durability.maxDurability) {
      world.playSound("random.break", source.location);
      equippable.setEquipment(equipmentSlot, null);
    } else {
      equippable.setEquipment(equipmentSlot, item);
    }
    return;
  }

  for (let i = 0; i < amount; i++) {
    if (Math.random() > 1 / (1.0 + unbreakingLevel)) {
      continue;
    }
    if (durability.damage == durability.maxDurability) {
      world.playSound("random.break", source.location);
      equippable.setEquipment(equipmentSlot, null);
    } else {
      durability.damage++;
      equippable.setEquipment(equipmentSlot, item);
    }
  }
}
