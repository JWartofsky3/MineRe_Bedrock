import {
  BlockComponentTickEvent,
  BlockCustomComponent,
} from "@minecraft/server";

export const despawnBlock: BlockCustomComponent = {
  onTick(arg: BlockComponentTickEvent) {
    arg.block.setType("minecraft:air");
  },
};
