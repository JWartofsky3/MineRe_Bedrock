import { ItemComponentTypes } from "@minecraft/server";
import { consumeXp } from "player/consumeXp";
const XP_COST = 2;
export const fireInfintyBowAfter = (data) => {
  const dimension = data.source.dimension;
  if (data.itemStack.typeId !== "minecraft:bow" || dimension == null) {
    return;
  }
  const enchantments = data.itemStack.getComponent(
    ItemComponentTypes.Enchantable,
  );
  if (!enchantments || !enchantments.getEnchantment("infinity")) {
    return;
  }
  if (consumeXp(data.source, XP_COST)) {
    return;
  } else {
    data.source.runCommand("clear @s[m=!c] arrow 0 1");
  }
};
