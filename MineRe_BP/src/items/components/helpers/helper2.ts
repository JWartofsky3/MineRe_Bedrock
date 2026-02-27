import { ItemCustomComponent, Player, world } from "@minecraft/server";

export const Helper2: ItemCustomComponent = {
  onUse(arg) {
    arg.source.sendMessage("Hello world!");
  },
};
