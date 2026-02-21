import {
  EntityComponentTypes,
  BlockPermutation,
  EquipmentSlot,
} from "@minecraft/server";
import { enderTeleport } from "entities/functions/enderTeleport";
import { spawnParticleCloud } from "particles/particleCloud";
import { addVector3 } from "util/vector3Functions";
const TELEPORT_RANGE = 3.15;
const PARTICLE_DISTANCE = 2;
const PARTICLE_COUNT = 50;
const TELEPORT_PER_POWER = 8;
const BLOCK_COUNT_MAX = 4;
const forbiddenEntities = new Set();
forbiddenEntities.add("minecraft:ender_dragon");
forbiddenEntities.add("minecraft:wither");
export const teleporter = {
  onPlace(arg) {
    const direction = arg.block.permutation.getState(
      "minecraft:facing_direction",
    );
    if (direction === "down") {
      arg.block.setPermutation(
        BlockPermutation.resolve(arg.block.typeId, {
          ...arg.block.permutation.getAllStates(),
          "minecraft:facing_direction": "up",
        }),
      );
    }
    if (direction === "up") {
      arg.block.setPermutation(
        BlockPermutation.resolve(arg.block.typeId, {
          ...arg.block.permutation.getAllStates(),
          "minecraft:facing_direction": "down",
        }),
      );
    }
  },
  onTick(arg) {
    let redstonePower = arg.block?.getRedstonePower();
    const location = arg.block.location;
    const dimension = arg.dimension;
    const direction = arg.block.permutation.getState(
      "minecraft:facing_direction",
    );
    let blockMultiplier = 1;
    const blocks = [];
    blocks.push(arg.block.below(1));
    blocks.push(arg.block.above(1));
    blocks.push(arg.block.east(1));
    blocks.push(arg.block.west(1));
    blocks.push(arg.block.north(1));
    blocks.push(arg.block.south(1));
    blocks.forEach((block) => {
      if (block.isValid) {
        if (block.typeId === "minecraft:redstone_block") {
          redstonePower = 15;
        }
        if (block.location.y <= arg.block.location.y) {
          if (
            block.typeId === "minecraft:redstone_torch" &&
            block?.getRedstonePower() > 0
          ) {
            redstonePower = 15;
          }
        }
        if (block.typeId === "minere:enderon_block") {
          blockMultiplier += 1;
        }
      }
    });
    blockMultiplier = Math.min(blockMultiplier, BLOCK_COUNT_MAX);
    arg.block.setPermutation(
      BlockPermutation.resolve(arg.block.typeId, {
        ...arg.block.permutation.getAllStates(),
        "minere:powered": redstonePower > 0 ? true : false,
      }),
    );
    if (redstonePower) {
      spawnParticleCloud(
        "minecraft:end_chest",
        location,
        PARTICLE_DISTANCE,
        PARTICLE_COUNT,
        dimension,
      );
      dimension.playSound("machine.teleporter.teleport", location);
      let targetOffset = {
        x: 0,
        y: 0,
        z: 0,
      };
      if (direction === "up") {
        targetOffset = {
          x: 0,
          y: TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          z: 0,
        };
      }
      if (direction === "down") {
        targetOffset = {
          x: 0,
          y: -TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          z: 0,
        };
      }
      if (direction === "east") {
        targetOffset = {
          x: TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          y: 0,
          z: 0,
        };
      }
      if (direction === "west") {
        targetOffset = {
          x: -TELEPORT_PER_POWER * redstonePower * blockMultiplier,
          y: 0,
          z: 0,
        };
      }
      if (direction === "south") {
        targetOffset = {
          x: 0,
          y: 0,
          z: TELEPORT_PER_POWER * redstonePower * blockMultiplier,
        };
      }
      if (direction === "north") {
        targetOffset = {
          x: 0,
          y: 0,
          z: -TELEPORT_PER_POWER * redstonePower * blockMultiplier,
        };
      }
      const entities = dimension.getEntities({
        location: location,
        maxDistance: TELEPORT_RANGE,
      });
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        // don't teleport entities that are riding others
        const ridingComponent = entity?.getComponent(
          EntityComponentTypes.Riding,
        );
        if (ridingComponent && ridingComponent.entityRidingOn) {
          continue;
        }
        // don't teleport entities wearing pumpkins
        const equippable = entity?.getComponent(
          EntityComponentTypes.Equippable,
        );
        if (
          equippable &&
          equippable.getEquipment(EquipmentSlot.Head)?.typeId ===
            "minecraft:carved_pumpkin"
        ) {
          continue;
        }
        if (forbiddenEntities.has(entity?.typeId)) {
          return;
        }
        const targetPos = addVector3(entity.location, targetOffset);
        targetPos.y = Math.max(dimension.heightRange.min + 1, targetPos.y);
        targetPos.y = Math.min(dimension.heightRange.max - 1, targetPos.y);
        enderTeleport(entity, targetPos);
      }
    }
  },
};
