import { ItemCustomComponent } from "@minecraft/server";

const XP_AMOUNT = 1000;

export const ElixirOfExperience: ItemCustomComponent = {
  onCompleteUse(arg) {
    if (!arg.source) {
      return;
    }
    arg.source.addExperience(XP_AMOUNT);
  },
};
