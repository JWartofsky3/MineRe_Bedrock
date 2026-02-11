import { StartupEvent } from "@minecraft/server";
import { fireflyLamp } from "block/firefly_lamp";
import { customOre } from "block/custom_ore";
import { teleporter } from "block/teleporter";
import { ghostPot } from "block/ghost_pot";
import { despawnBlock } from "block/despawnBlock";

export function registerBlocks(data: StartupEvent) {
  data.blockComponentRegistry.registerCustomComponent(
    "minere:firefly_lamp",
    fireflyLamp,
  );
  data.blockComponentRegistry.registerCustomComponent(
    "minere:despawn_block",
    despawnBlock,
  );
  data.blockComponentRegistry.registerCustomComponent(
    "minere:custom_ore",
    customOre,
  );
  data.blockComponentRegistry.registerCustomComponent(
    "minere:teleporter",
    teleporter,
  );
  data.blockComponentRegistry.registerCustomComponent(
    "minere:ghost_pot",
    ghostPot,
  );
}
