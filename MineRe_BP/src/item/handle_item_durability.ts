import { Player, Block, ItemStack, GameMode } from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";

export function handleItemDurability(
  player: Player,
  block: Block,
  itemBefore: ItemStack,
  itemAfter: ItemStack,
) {
  if (player.getGameMode() === GameMode.creative) {
    return;
  }
  if (!itemAfter?.typeId) {
    return;
  }
  if (itemAfter.typeId.includes("enderon")) {
    reduceDurability(player, itemAfter, 1);
  }
}
