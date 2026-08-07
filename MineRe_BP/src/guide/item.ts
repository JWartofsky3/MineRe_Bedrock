import { ItemCustomComponent, Player } from "@minecraft/server";
import { showGuide } from "guide/index";

export const Guide: ItemCustomComponent = {
  onUse(arg) {
    showGuide(arg.source as Player);
  },
};
