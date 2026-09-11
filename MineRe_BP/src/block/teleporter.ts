import {
  Vector3,
  BlockComponentTickEvent,
  BlockCustomComponent,
  EntityComponentTypes,
  EntityRidingComponent,
  BlockPermutation,
  Block,
  EntityEquippableComponent,
  EquipmentSlot,
  BlockComponentOnPlaceEvent,
  BlockComponentBlockBreakEvent,
  Player,
} from "@minecraft/server";
import { enderTeleport } from "entities/functions/enderTeleport";
import { spawnParticleCloud } from "particles/particleCloud";
import { particleWave } from "particles/particleWave";
import { addVector3, distVector3 } from "util/vector3Functions";
import { getTeleporterMaxDistance } from "settings";
import { showHint } from "items/staves/staffHints";

const TELEPORT_FIELD_RADIUS = 2.5;
const PARTICLE_DISTANCE = 2.5;
const PARTICLE_COUNT = 50;
const TELEPORT_PER_POWER = 8;
const MAX_CONNECTED_ENDERON_DEPTH = 16;
const TELEPORT_PARTICLE = "minere:indigon_magic_short";
const ENDERON_BLOCK = "minere:enderon_block";
const ACTIVATED_ENDERON_BLOCK = "minere:activated_enderon_block";
const TELEPORTER_HINT_COOLDOWN_TICKS = 20 * 60 * 2;
const TELEPORTER_PLACEMENT_HINT = "hint.minere:teleporter.placement";

const forbiddenEntities = new Set<string>();
forbiddenEntities.add("minecraft:ender_dragon");
forbiddenEntities.add("minecraft:wither");

export const teleporter: BlockCustomComponent = {
  onPlace(arg: BlockComponentOnPlaceEvent) {
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
  onBreak(arg: BlockComponentBlockBreakEvent) {
    deactivateConnectedEnderonBlocks(arg.block);
  },
  onTick(arg: BlockComponentTickEvent) {
    let redstonePower = arg.block?.getRedstonePower();

    const location = arg.block.location;
    const dimension = arg.dimension;
    const direction = arg.block.permutation.getState(
      "minecraft:facing_direction",
    );

    const connectedEnderonBlocks = getConnectedEnderonBlocks(arg.block);
    const activatedBlocks = [arg.block, ...connectedEnderonBlocks];
    const blockMultiplier = activatedBlocks.length;
    const blocks: Block[] = [];
    blocks.push(arg.block.below(1));
    blocks.push(arg.block.above(1));
    blocks.push(arg.block.east(1));
    blocks.push(arg.block.west(1));
    blocks.push(arg.block.north(1));
    blocks.push(arg.block.south(1));

    blocks.forEach((block: Block) => {
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
      }
    });

    arg.block.setPermutation(
      BlockPermutation.resolve(arg.block.typeId, {
        ...arg.block.permutation.getAllStates(),
        "minere:powered": redstonePower > 0 ? true : false,
      }),
    );

    if (redstonePower) {
      activateEnderonBlocks(connectedEnderonBlocks);
      for (const block of activatedBlocks) {
        spawnParticleCloud(
          "minecraft:end_chest",
          block.location,
          PARTICLE_DISTANCE,
          PARTICLE_COUNT,
          dimension,
        );
      }
      dimension.playSound("machine.teleporter.teleport", location);
      for (const block of activatedBlocks.slice(1)) {
        dimension.playSound("machine.teleporter.teleport", block.location);
      }

      const teleportDistance = Math.min(
        TELEPORT_PER_POWER * redstonePower * blockMultiplier,
        getTeleporterMaxDistance(),
      );
      let targetOffset: Vector3 = {
        x: 0,
        y: 0,
        z: 0,
      };
      if (direction === "up") {
        targetOffset = {
          x: 0,
          y: teleportDistance,
          z: 0,
        };
      }
      if (direction === "down") {
        targetOffset = {
          x: 0,
          y: -teleportDistance,
          z: 0,
        };
      }
      if (direction === "east") {
        targetOffset = {
          x: teleportDistance,
          y: 0,
          z: 0,
        };
      }
      if (direction === "west") {
        targetOffset = {
          x: -teleportDistance,
          y: 0,
          z: 0,
        };
      }
      if (direction === "south") {
        targetOffset = {
          x: 0,
          y: 0,
          z: teleportDistance,
        };
      }
      if (direction === "north") {
        targetOffset = {
          x: 0,
          y: 0,
          z: -teleportDistance,
        };
      }

      const entities = dimension.getEntities({
        location: location,
        maxDistance: MAX_CONNECTED_ENDERON_DEPTH + TELEPORT_FIELD_RADIUS,
      });
      let spawnedTeleportWave = false;

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (
          !activatedBlocks.some(
            (block) =>
              distVector3(entity.location, block.location) <=
              TELEPORT_FIELD_RADIUS,
          )
        ) {
          continue;
        }
        // don't teleport entities that are riding others
        const ridingComponent = entity?.getComponent(
          EntityComponentTypes.Riding,
        ) as EntityRidingComponent;
        if (ridingComponent && ridingComponent.entityRidingOn) {
          continue;
        }
        // don't teleport entities wearing pumpkins
        const equippable = entity?.getComponent(
          EntityComponentTypes.Equippable,
        ) as EntityEquippableComponent;
        if (
          equippable &&
          equippable.getEquipment(EquipmentSlot.Head)?.typeId ===
            "minecraft:carved_pumpkin"
        ) {
          continue;
        }
        if (forbiddenEntities.has(entity?.typeId)) {
          continue;
        }
        const targetPos = addVector3(entity.location, targetOffset);
        targetPos.y = Math.max(dimension.heightRange.min + 1, targetPos.y);
        targetPos.y = Math.min(dimension.heightRange.max - 1, targetPos.y);

        if (!spawnedTeleportWave) {
          const targetLocation = addVector3(location, targetOffset);
          targetLocation.y = Math.max(
            dimension.heightRange.min + 1,
            targetLocation.y,
          );
          targetLocation.y = Math.min(
            dimension.heightRange.max - 1,
            targetLocation.y,
          );
          particleWave({
            dimension,
            particle: TELEPORT_PARTICLE,
            startLocation: location,
            endLocation: targetLocation,
            ticksPerStep: 0,
          });
          spawnedTeleportWave = true;
        }
        enderTeleport(entity, targetPos);
      }
    } else {
      deactivateConnectedEnderonBlocks(arg.block);
    }
  },
};

export function sendTeleporterPlacementHint(player: Player): void {
  showHint(player, TELEPORTER_PLACEMENT_HINT, TELEPORTER_HINT_COOLDOWN_TICKS);
}

function getConnectedEnderonBlocks(teleporter: Block): Block[] {
  const enderonBlocks: Block[] = [];
  const visited = new Set([getBlockKey(teleporter)]);
  const queue: Array<{ block: Block; depth: number }> = [
    { block: teleporter, depth: 0 },
  ];

  for (let index = 0; index < queue.length; index++) {
    const { block, depth } = queue[index];
    if (depth >= MAX_CONNECTED_ENDERON_DEPTH) {
      continue;
    }

    for (const neighbor of getAdjacentBlocks(block)) {
      if (!neighbor.isValid || !isEnderonBlock(neighbor)) {
        continue;
      }
      const key = getBlockKey(neighbor);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      enderonBlocks.push(neighbor);
      queue.push({ block: neighbor, depth: depth + 1 });
    }
  }

  return enderonBlocks;
}

function activateEnderonBlocks(blocks: Block[]): void {
  for (const block of blocks) {
    if (block.typeId === ENDERON_BLOCK) {
      block.setPermutation(BlockPermutation.resolve(ACTIVATED_ENDERON_BLOCK));
    }
  }
}

function deactivateConnectedEnderonBlocks(teleporter: Block): void {
  const visited = new Set([getBlockKey(teleporter)]);
  const queue: Block[] = [teleporter];
  const activatedBlocks: Block[] = [];

  for (let index = 0; index < queue.length; index++) {
    for (const neighbor of getAdjacentBlocks(queue[index])) {
      if (!neighbor.isValid || neighbor.typeId !== ACTIVATED_ENDERON_BLOCK) {
        continue;
      }
      const key = getBlockKey(neighbor);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      activatedBlocks.push(neighbor);
      queue.push(neighbor);
    }
  }

  for (const block of activatedBlocks) {
    block.setPermutation(BlockPermutation.resolve(ENDERON_BLOCK));
  }
}

function isEnderonBlock(block: Block): boolean {
  return (
    block.typeId === ENDERON_BLOCK || block.typeId === ACTIVATED_ENDERON_BLOCK
  );
}

function getAdjacentBlocks(block: Block): Block[] {
  return [
    block.below(1),
    block.above(1),
    block.east(1),
    block.west(1),
    block.north(1),
    block.south(1),
  ];
}

function getBlockKey(block: Block): string {
  const { x, y, z } = block.location;
  return `${x},${y},${z}`;
}
