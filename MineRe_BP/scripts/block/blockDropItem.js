import { ItemStack } from "@minecraft/server";
import { getEnchantmentLevel, hasSilkTouchOrShears, } from "items/components/item_utils";
const itemsToDrop = new Map();
// itemsToDrop.set("minecraft:oak_leaves", {
//   drop: "minere:acorn",
//   chance: 0.04,
//   fortuneBonus: 0.04,
// });
// itemsToDrop.set(
//   "minecraft:dark_oak_leaves",
//   itemsToDrop.get("minecraft:oak_leaves"),
// );
export function blockDropItem(data) {
    if (!itemsToDrop.has(data?.brokenBlockPermutation?.getItemStack()?.typeId)) {
        return;
    }
    const entry = itemsToDrop.get(data?.brokenBlockPermutation?.getItemStack()?.typeId);
    const fortuneLevel = getEnchantmentLevel(data.player, "fortune");
    if (entry.chance < 1.0) {
        if (Math.random() <
            1 - (entry.chance + entry.fortuneBonus * fortuneLevel)) {
            return;
        }
    }
    if (hasSilkTouchOrShears(data.player)) {
        return;
    }
    const dimension = data.player.dimension;
    dimension.spawnItem(new ItemStack("minere:acorn"), data.block.location);
}
