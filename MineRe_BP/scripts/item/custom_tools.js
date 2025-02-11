import { reduceDurability } from "./reduce_durability";
// these don't work :(
export const CustomAxe = {
  onUseOn(event) {
    const player = event.source;
    reduceDurability(player, event.itemStack, 1);
    player.playSound("dig.wood", {
      location: player.location ?? player.location,
    });
  },
};
export const CustomHoe = {
  onUseOn(event) {
    const player = event.source;
    reduceDurability(player, event.itemStack, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  },
};
export const CustomShovel = {
  onUseOn(event) {
    const player = event.source;
    reduceDurability(player, event.itemStack, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  },
};
export function onHoeUse(player, item, block) {
  if (item.typeId === "minere:enderon_hoe") {
    reduceDurability(player, item, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  }
}
export function onShovelUse(player, item, block) {
  if (item.typeId === "minere:enderon_shovel") {
    reduceDurability(player, item, 1);
    player.playSound("dig.gravel", {
      location: player.location ?? player.location,
    });
  }
}
export function onAxeUse(player, item, block) {
  if (item.typeId === "minere:enderon_axe") {
    reduceDurability(player, item, 1);
    player.playSound("dig.wood", {
      location: player.location ?? player.location,
    });
  }
}
