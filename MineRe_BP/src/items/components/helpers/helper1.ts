import { ItemCustomComponent } from "@minecraft/server";
import { clearGuideDiscovery } from "guide/discoveryStorage";

export const Helper1: ItemCustomComponent = {
  onUse(arg) {
    clearGuideDiscovery(arg.source);
    arg.source.sendMessage("Guide discoveries cleared.");
  },
};
