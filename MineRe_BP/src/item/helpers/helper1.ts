import { ItemCustomComponent, Player, world } from "@minecraft/server";

export const Helper1: ItemCustomComponent = {
  onUse(arg) {
    world.sendMessage("Hello world!");
  },
};
