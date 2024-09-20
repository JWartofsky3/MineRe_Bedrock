import {
  world,
  ItemComponentTypes,
  EntityComponentTypes,
} from "@minecraft/server";
export function reduceDurability(source, item, amount) {
  if (source === null || source.getGameMode() === "creative") {
    return;
  }
  const durability = item.getComponent(ItemComponentTypes.Durability);
  const inventory = source.getComponent(EntityComponentTypes.Inventory);
  if (!durability || !inventory) {
    return;
  }
  for (let i = 0; i < amount; i++) {
    if (durability.damage == durability.maxDurability) {
      world.playSound("random.break", source.location);
      inventory.container.setItem(source.selectedSlotIndex, null);
    } else {
      const enchantments = item.getComponent(ItemComponentTypes.Enchantable);
      if (enchantments) {
        const unbreaking = enchantments.getEnchantment("unbreaking");
        if (unbreaking) {
          const rand = Math.floor(Math.random() * (unbreaking.level + 1));
          if (rand !== 0) {
            return;
          }
        }
      }
      durability.damage++;
      inventory.container.setItem(source.selectedSlotIndex, item);
    }
  }
}
