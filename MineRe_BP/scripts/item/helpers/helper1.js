import { world } from "@minecraft/server";
export const Helper1 = {
  onUse(arg) {
    world.sendMessage("Hello world!");
  },
};
