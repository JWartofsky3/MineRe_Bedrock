import { ItemCustomComponent } from "@minecraft/server";
import { GUIDE_DISCOVERY_PROPERTY } from "guide/discovery";

export const Helper1: ItemCustomComponent = {
  onUse(arg) {
    arg.source.setDynamicProperty(GUIDE_DISCOVERY_PROPERTY, undefined);
    arg.source.sendMessage("Guide discoveries cleared.");
  },
};
