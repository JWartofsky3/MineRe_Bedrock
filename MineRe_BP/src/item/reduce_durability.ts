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
  if (
    source === null ||
    source.getGameMode() === "creative" ||
    !item ||
    !amount
  ) {
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
  let damage = 0;

  if (amount > 10) {
    damage = Math.ceil(amount / (1.0 + unbreakingLevel));
  } else {
    for (let i = 0; i < amount; i++) {
      if (Math.random() > 1.0 / (1.0 + unbreakingLevel)) {
        continue;
      }
      damage += 1;
    }
  }

  durability.damage = Math.min(
    durability.maxDurability,
    durability.damage + damage,
  );
  if (durability.damage >= durability.maxDurability) {
    world.playSound("random.break", source.location);
    equippable.setEquipment(equipmentSlot, null);
    return;
  }

  if (equipmentSlot === EquipmentSlot.Mainhand || !equipmentSlot) {
    inventory.container.setItem(source.selectedSlotIndex, item);
  } else {
    equippable.setEquipment(equipmentSlot, item);
  }
}
