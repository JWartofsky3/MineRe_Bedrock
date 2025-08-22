import { ItemCustomComponent, Player, world } from "@minecraft/server";

export const Helper1: ItemCustomComponent = {
  onUse(arg) {
    arg.source.sendMessage("Hello world!");
  },
};
