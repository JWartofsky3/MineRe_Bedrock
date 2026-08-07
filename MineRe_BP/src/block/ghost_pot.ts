import {
  world,
  system,
  BlockCustomComponent,
  BlockComponentPlayerBreakEvent,
  GameMode,
  ItemStack,
  Dimension,
  Vector3,
} from "@minecraft/server";
import { canPickupPot, getEnchantmentLevel } from "items/components/item_utils";
import { addVector3, randomVector3 } from "util/vector3Functions";

const XP = 6;
const GHOST_CHANCE = 0.75;
const GHOST_COUNT = 2;
const GHOST_SPREAD = 4;
const GHOST_DELAY_MAX = 50;
const GHOST_DISTANCE = 8;

export const ghostPot: BlockCustomComponent = {
  onPlayerBreak(arg: BlockComponentPlayerBreakEvent) {
    const location = arg.block.location;
    const dimension = arg.dimension;
    const player = arg.player;
    if (
      getEnchantmentLevel(player, "silk_touch") > 0 ||
      player.getGameMode() === GameMode.Creative
    ) {
      return;
    }

    if (canPickupPot(player)) {
      dimension.spawnItem(new ItemStack("minere:ghost_pot"), location);
      return;
    }

    if (
      (world.getTimeOfDay() < 13000 || world.getTimeOfDay() > 23000) &&
      dimension.id === "minecraft:overworld" &&
      location.y >
        dimension.getTopmostBlock({ x: location.x, z: location.z }).location.y -
          4
    ) {
      dimension.spawnEntity("minecraft:lightning_bolt", location);
    } else {
      for (let i = 0; i < XP; i++) {
        dimension.spawnEntity("minecraft:xp_orb", location);
      }
    }

    dimension.runCommand(
      `loot spawn ${location.x} ${location.y} ${location.z} loot "blocks/ghost_pot"`,
    );

    // X +
    for (let i = 0; i < GHOST_COUNT; i++) {
      if (Math.random() <= GHOST_CHANCE) {
        system.runTimeout(() => {
          try {
            spawnGhost(
              dimension,
              addVector3(addVector3(location, randomVector3(GHOST_SPREAD)), {
                x: GHOST_DISTANCE,
                y: 0,
                z: 0,
              }),
            );
          } catch {}
        }, Math.random() * GHOST_DELAY_MAX);
      }
    }

    // X -
    for (let i = 0; i < GHOST_COUNT; i++) {
      if (Math.random() <= GHOST_CHANCE) {
        system.runTimeout(() => {
          try {
            spawnGhost(
              dimension,
              addVector3(addVector3(location, randomVector3(GHOST_SPREAD)), {
                x: -GHOST_DISTANCE,
                y: 0,
                z: 0,
              }),
            );
          } catch {}
        }, Math.random() * GHOST_DELAY_MAX);
      }
    }

    // Z +
    for (let i = 0; i < GHOST_COUNT; i++) {
      if (Math.random() <= GHOST_CHANCE) {
        system.runTimeout(() => {
          try {
            spawnGhost(
              dimension,
              addVector3(addVector3(location, randomVector3(GHOST_SPREAD)), {
                x: 0,
                y: 0,
                z: GHOST_DISTANCE,
              }),
            );
          } catch {}
        }, Math.random() * GHOST_DELAY_MAX);
      }
    }

    // Z -
    for (let i = 0; i < GHOST_COUNT; i++) {
      if (Math.random() <= GHOST_CHANCE) {
        system.runTimeout(() => {
          try {
            spawnGhost(
              dimension,
              addVector3(addVector3(location, randomVector3(GHOST_SPREAD)), {
                x: 0,
                y: 0,
                z: -GHOST_DISTANCE,
              }),
            );
          } catch {}
        }, Math.random() * GHOST_DELAY_MAX);
      }
    }
  },
};

function spawnGhost(dimension: Dimension, location: Vector3) {
  dimension.playSound("mob.ghast.scream", location, { volume: 2.0 });
  dimension.spawnEntity<string>("minere:ghost", location);
}
