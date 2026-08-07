import { ItemCustomComponent } from "@minecraft/server";

export const Helper2: ItemCustomComponent = {
  onUse(arg) {
    arg.source.dimension.spawnEntity<string>(
      "minere:goblin_cavalry_placeholder",
      arg.source.location,
    );
  },
};
