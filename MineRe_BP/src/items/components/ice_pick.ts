import {
  ItemComponentMineBlockEvent,
  ItemCustomComponent,
} from "@minecraft/server";
import { rollFreeze } from "entities/functions/freeze";
import { isAlive } from "mob/mob_utils";

const REPLACEMENTS = new Map<string, string>([
  ["minecraft:lava", "minecraft:obsidian"],
  ["minecraft:flowing_lava", "minecraft:obsidian"],
  ["minecraft:water", "minecraft:ice"],
  ["minecraft:flowing_water", "minecraft:ice"],
]);
const WATER_BLOCKS = new Set<string>([
  "minecraft:water",
  "minecraft:flowing_water",
]);

export const IcePick: ItemCustomComponent = {
  onHitEntity(arg) {
    const target = arg.hitEntity;
    if (!isAlive(target)) {
      return;
    }

    rollFreeze(target, 0.075);
  },
  onMineBlock(event: ItemComponentMineBlockEvent) {
    const dimension = event.source.dimension;
    const center = event.block.location;

    for (let x = center.x - 1; x <= center.x + 1; x++) {
      for (let y = center.y - 1; y <= center.y + 1; y++) {
        for (let z = center.z - 1; z <= center.z + 1; z++) {
          const block = dimension.getBlock({
            x,
            y,
            z,
          });

          if (!block) {
            continue;
          }

          const replacement = REPLACEMENTS.get(block.typeId);

          if (!replacement) {
            continue;
          }

          const shouldPlayFreezeSound = WATER_BLOCKS.has(block.typeId);
          block.setType(replacement);
          if (shouldPlayFreezeSound) {
            dimension.playSound("mob.freeze.freeze", block.location, {
              volume: 0.25,
            });
          } else {
            dimension.playSound("random.fizz", block.location);
          }
          dimension.spawnParticle(
            "minere:ice_charge_particles_short",
            block.location,
          );
        }
      }
    }
  },
};
