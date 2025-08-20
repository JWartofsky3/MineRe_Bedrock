import { world } from "@minecraft/server";
export const Helper2 = {
  onUse(arg) {
    world.sendMessage("Hello world!");
  },
};
