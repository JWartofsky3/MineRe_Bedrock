import {
  Player,
  ItemCustomComponent,
  ItemComponentUseOnEvent,
  ItemStack,
  Block,
} from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";

// these don't work :(
export const CustomAxe: ItemCustomComponent = {
  onUseOn(event: ItemComponentUseOnEvent) {
    const player = event.source as Player;
    reduceDurability(player, event.itemStack, 1);
    player.playSound("dig.wood", {
      location: player.location ?? player.location,
    });
  },
};

export const CustomHoe: ItemCustomComponent = {
  onUseOn(event: ItemComponentUseOnEvent) {
    const player = event.source as Player;
    reduceDurability(player, event.itemStack, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  },
};

export const CustomShovel: ItemCustomComponent = {
  onUseOn(event: ItemComponentUseOnEvent) {
    const player = event.source as Player;
    reduceDurability(player, event.itemStack, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  },
};

export function onHoeUse(player: Player, item: ItemStack, block: Block) {
  if (item.typeId === "minere:enderon_hoe") {
    reduceDurability(player, item, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  }
}

export function onShovelUse(player: Player, item: ItemStack, block: Block) {
  if (item.typeId === "minere:enderon_shovel") {
    reduceDurability(player, item, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  }
}

export function onAxeUse(player: Player, item: ItemStack, block: Block) {
  if (item.typeId === "minere:enderon_axe") {
    reduceDurability(player, item, 1);
    player.playSound("dig.wood", {
      location: player.location ?? player.location,
    });
  }
}
