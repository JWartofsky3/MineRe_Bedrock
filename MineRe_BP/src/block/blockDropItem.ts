import { ItemStack, PlayerBreakBlockAfterEvent } from "@minecraft/server";
import { getEnchantmentLevel, hasSilkTouchOrShears } from "item/item_utils";

type BlockDropDefinition = {
  drop: string;
  chance: number;
  fortuneBonus: number;
};

const itemsToDrop = new Map<string, BlockDropDefinition>();

// itemsToDrop.set("minecraft:oak_leaves", {
//   drop: "minere:acorn",
//   chance: 0.04,
//   fortuneBonus: 0.04,
// });
// itemsToDrop.set(
//   "minecraft:dark_oak_leaves",
//   itemsToDrop.get("minecraft:oak_leaves"),
// );

export function blockDropItem(data: PlayerBreakBlockAfterEvent) {
  if (!itemsToDrop.has(data?.brokenBlockPermutation?.getItemStack()?.typeId)) {
    return;
  }
  const entry: BlockDropDefinition = itemsToDrop.get(
    data?.brokenBlockPermutation?.getItemStack()?.typeId,
  );
  const fortuneLevel = getEnchantmentLevel(data.player, "fortune");
  if (entry.chance < 1.0) {
    if (
      Math.random() <
      1 - (entry.chance + entry.fortuneBonus * fortuneLevel)
    ) {
      return;
    }
  }
  if (hasSilkTouchOrShears(data.player)) {
    return;
  }
  const dimension = data.player.dimension;
  dimension.spawnItem(new ItemStack("minere:acorn"), data.block.location);
}
