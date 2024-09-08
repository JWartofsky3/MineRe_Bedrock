import { Block, ItemStack, Player } from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";


export function onHoeUse(player: Player, item: ItemStack, block: Block) {
    if (item?.typeId === "minere:enderon_hoe") {
        reduceDurability(player, item, 1);
        player.playSound("dig.gravel", {
            location: block?.location ?? player.location
        });
    }
}