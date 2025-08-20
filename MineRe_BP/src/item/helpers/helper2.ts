import { ItemCustomComponent, Player, world } from "@minecraft/server";

export const Helper2: ItemCustomComponent = {
  onUse(arg) {
    world.sendMessage("Hello world!");
  },
};
