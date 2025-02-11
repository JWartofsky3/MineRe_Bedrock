import {
  world,
  EntityComponentTypes,
  EquipmentSlot,
  system,
  BlockVolume,
  ItemComponentTypes,
} from "@minecraft/server";
import { Queue } from "util/queue";
import { isValid, vector3ToString } from "util/vector3Functions";
import { reduceDurability } from "./reduce_durability";
const LEAF_HORIZONTAL_DISTANCE = 5;
const LOG_HORIZONTAL_DISTANCE = 4;
const MAX_VERTICAL_DISTANCE = 64;
const HORIZONTAL_CHECK_DISTANCE = 8;
const VERTICAL_CHECK_DISTANCE = 0;
const ALTITUDE_BONUS_START = 12;
const ALTITUDE_BONUS = 3;
const REMAINING_DURABILITY_MULTIPLIER = 1.5;
const logSet = new Set();
// logs
logSet.add("minecraft:log");
logSet.add("minecraft:stripped_log");
logSet.add("minecraft:oak_log");
logSet.add("minecraft:stripped_oak_log");
logSet.add("minecraft:dark_oak_log");
logSet.add("minecraft:stripped_dark_oak_log");
logSet.add("minecraft:pale_oak_log");
logSet.add("minecraft:stripped_pale_oak_log");
logSet.add("minecraft:birch_log");
logSet.add("minecraft:stripped_birch_log");
logSet.add("minecraft:spruce_log");
logSet.add("minecraft:stripped_spruce_log");
logSet.add("minecraft:jungle_log");
logSet.add("minecraft:stripped_jungle_log");
logSet.add("minecraft:acacia_log");
logSet.add("minecraft:stripped_acacia_log");
logSet.add("minecraft:cherry_log");
logSet.add("minecraft:stripped_cherry_log");
logSet.add("minecraft:mangrove_log");
logSet.add("minecraft:stripped_mangrove_log");
// stems
logSet.add("minecraft:brown_mushroom_stem");
logSet.add("minecraft:red_mushroom_stem");
logSet.add("minecraft:crimson_stem");
logSet.add("minecraft:stripped_crimson_stem");
logSet.add("minecraft:warped_stem");
logSet.add("minecraft:stripped_warped_stem");
// leaves
const leavesSet = new Set();
leavesSet.add("minecraft:leaves");
leavesSet.add("minecraft:oak_leaves");
leavesSet.add("minecraft:dark_oak_leaves");
leavesSet.add("minecraft:pale_oak_leaves");
leavesSet.add("minecraft:birch_leaves");
leavesSet.add("minecraft:spruce_leaves");
leavesSet.add("minecraft:jungle_leaves");
leavesSet.add("minecraft:acacia_leaves");
leavesSet.add("minecraft:azalea_leaves");
leavesSet.add("minecraft:azalea_leaves_flowered");
leavesSet.add("minecraft:cherry_leaves");
leavesSet.add("minecraft:mangrove_leaves");
// mushroom_blocks
const mushroomSet = new Set();
mushroomSet.add("minecraft:red_mushroom_block");
mushroomSet.add("minecraft:brown_mushroom_block");
mushroomSet.add("minecraft:nether_wart_block");
mushroomSet.add("minecraft:crimson_wart_block");
mushroomSet.add("minecraft:warped_wart_block");
mushroomSet.add("shroomlight");
mushroomSet.add("minecraft:shroomlight");
mushroomSet.add("minecraft:shroom_light");
const leavesAndMushrooms = new Set(...leavesSet, ...mushroomSet);
function checkWidthWithOffset(dimension, origin, yOffset) {
  let max_distance = 0;
  // check X+
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x + i,
        y: origin.y + yOffset,
        z: origin.z,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log || log.permutation?.getState("pillar_axis") !== "y") {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  // check X-
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x - i,
        y: origin.y + yOffset,
        z: origin.z,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log || log.permutation?.getState("pillar_axis") !== "y") {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  // check Z+
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x,
        y: origin.y + yOffset,
        z: origin.z + i,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log || log.permutation?.getState("pillar_axis") !== "y") {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  // check Z-
  for (let i = 0; i <= HORIZONTAL_CHECK_DISTANCE; i++) {
    const log = checkIsType(
      dimension,
      {
        x: origin.x,
        y: origin.y + yOffset,
        z: origin.z - i,
      },
      logSet,
      ["log", "stem"],
    );
    if (!log || log.permutation?.getState("pillar_axis") !== "y") {
      break;
    }
    if (i > max_distance) {
      max_distance = i;
    }
    if (i > max_distance) {
      max_distance = i;
    }
  }
  return max_distance + 1;
}
function checkWidth(dimension, origin) {
  let max = 0;
  for (
    let i = -1 * VERTICAL_CHECK_DISTANCE;
    i <= VERTICAL_CHECK_DISTANCE;
    i++
  ) {
    const size = checkWidthWithOffset(dimension, origin, i);
    if (size > max) {
      max = size;
    }
  }
  return max;
}
function checkIsType(dimension, location, typeSet, typeNames) {
  if (!isValid(dimension, location)) {
    return;
  }
  const block = dimension.getBlock(location);
  if (!block?.typeId) {
    return;
  }
  if (typeSet.has(block.typeId)) {
    return block;
  }
  for (let i = 0; i < typeNames.length; i++) {
    if (block.typeId.includes(typeNames[i])) {
      return block;
    }
  }
  return;
}
function getNeighbors(dimension, location, from, to) {
  const neighbors = [];
  const blockVolume = new BlockVolume(
    {
      x: location.x + from.x,
      y: Math.max(dimension.heightRange.min, location.y + from.y),
      z: location.z + from.z,
    },
    {
      x: location.x + to.x,
      y: Math.min(dimension.heightRange.max, location.y + to.y),
      z: location.z + to.z,
    },
  );
  const listBlockVolume = dimension.getBlocks(blockVolume, {
    excludeTypes: ["minecraft:air"],
  });
  const iterator = listBlockVolume.getBlockLocationIterator();
  let next = iterator.next();
  while (!next.done) {
    if (next.value !== location) {
      neighbors.push(next.value);
    }
    next = iterator.next();
  }
  return neighbors;
}
function checkRange(origin, location, horizontalDistance, verticalDistance) {
  if (Math.abs(origin.x - location.x) > horizontalDistance) {
    return false;
  }
  if (Math.abs(origin.y - location.y) > verticalDistance) {
    return false;
  }
  if (Math.abs(origin.z - location.z) > horizontalDistance) {
    return false;
  }
  return true;
}
function treecapitate(origin, width, durability) {
  let highest = 0;
  const visited = new Set();
  const queue = new Queue();
  const dimension = origin.dimension;
  const logs = new Set();
  const leaves = new Set();
  queue.enqueue(origin.location);
  while (!queue.isEmpty()) {
    const next = queue.dequeue();
    if (next.y - origin.location.y > highest) {
      highest = next.y - origin.location.y;
    }
    visited.add(vector3ToString(next));
    const neighbors = getNeighbors(
      dimension,
      next,
      {
        x: -1,
        y: 0,
        z: -1,
      },
      {
        x: 1,
        y: 1,
        z: 1,
      },
    );
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const neighborString = vector3ToString(neighbors[i]);
      if (visited.has(neighborString)) {
        continue;
      }
      visited.add(neighborString);
      const altitude = neighbor.y - origin.location.y;
      if (
        checkRange(
          origin.location,
          neighbor,
          LOG_HORIZONTAL_DISTANCE +
            (altitude > ALTITUDE_BONUS_START ? ALTITUDE_BONUS : 0),
          MAX_VERTICAL_DISTANCE,
        ) &&
        checkIsType(dimension, neighbor, logSet, ["log", "stem"])
      ) {
        logs.add(neighbor);
        queue.enqueue(neighbor);
      } else if (
        checkRange(
          origin.location,
          neighbor,
          LEAF_HORIZONTAL_DISTANCE +
            (altitude > ALTITUDE_BONUS_START ? ALTITUDE_BONUS : 0),
          MAX_VERTICAL_DISTANCE,
        ) &&
        checkIsType(dimension, neighbor, leavesAndMushrooms, [
          "leaves",
          "shroom_block",
          "wart_block",
          "shroomlight",
        ])
      ) {
        leaves.add(neighbor);
      }
    }
  }
  if (width > highest) {
    return;
  }
  if (logs.size > REMAINING_DURABILITY_MULTIPLIER * durability) {
    world.playSound("item.amethyst_staff.error", origin.location);
    return;
  }
  const logLevelToBreak = new Array(highest + 1);
  logs.forEach((logLocation) => {
    let i = logLocation.y - origin.location.y;
    if (!logLevelToBreak[i]) {
      logLevelToBreak[i] = new Array(0);
    }
    logLevelToBreak[i].push(logLocation);
  });
  for (let i = 0; i < logLevelToBreak.length; i++) {
    system.runTimeout(() => {
      for (let j = 0; j < logLevelToBreak[i]?.length; j++) {
        const logPos = logLevelToBreak[i][j];
        if (isValid(dimension, logPos)) {
          dimension.runCommand(
            `setBlock ${logPos.x} ${logPos.y} ${logPos.z} air destroy`,
          );
        }
      }
    }, i * 2);
  }
  // break leaves
  leaves.forEach((leaf) => {
    queue.enqueue(leaf);
  });
  let i = 0;
  while (!queue.isEmpty()) {
    const next = queue.dequeue();
    visited.add(vector3ToString(next));
    const neighbors = getNeighbors(
      dimension,
      next,
      {
        x: -1,
        y: -1,
        z: -1,
      },
      {
        x: 1,
        y: 1,
        z: 1,
      },
    );
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const neighborString = vector3ToString(neighbors[i]);
      if (visited.has(neighborString)) {
        continue;
      }
      visited.add(neighborString);
      if (
        checkRange(
          origin.location,
          neighbor,
          LEAF_HORIZONTAL_DISTANCE,
          MAX_VERTICAL_DISTANCE,
        ) &&
        checkIsType(dimension, neighbor, leavesAndMushrooms, [
          "leaves",
          "shroom_block",
          "wart_block",
        ])
      ) {
        const block = dimension.getBlock(neighbor);
        if (!block.permutation.getState("persistent_bit")) {
          leaves.add(neighbor);
          queue.enqueue(neighbor);
        }
      }
    }
    system.runTimeout(
      () => {
        dimension.runCommand(
          `setBlock ${next.x} ${next.y} ${next.z} air destroy`,
        );
      },
      Math.floor(i / 5) + 2,
    );
    i++;
  }
  return logs.size;
}
export function treecapitator(player, blockBefore) {
  if (!player || !blockBefore) {
    return;
  }
  const dimension = player.dimension;
  const location = blockBefore.location;
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const mainHand = equippable.getEquipment(EquipmentSlot.Mainhand);
  const offHand = equippable.getEquipment(EquipmentSlot.Offhand);
  const treeCapitatorSlot = mainHand?.typeId.includes("treecapitator")
    ? EquipmentSlot.Mainhand
    : offHand?.typeId.includes("treecapitator")
      ? EquipmentSlot.Offhand
      : undefined;
  const treeCapitator = mainHand?.typeId.includes("treecapitator")
    ? mainHand
    : offHand?.typeId.includes("treecapitator")
      ? offHand
      : undefined;
  if (!treeCapitator) {
    return;
  }
  const durability = treeCapitator.getComponent(ItemComponentTypes.Durability);
  const width = checkWidth(dimension, blockBefore.location);
  if (width > 1) {
    return;
  }
  const log = checkIsType(dimension, location, logSet, ["log", "stem"]);
  if (!log) {
    return;
  }
  system.runTimeout(() => {
    const logsBroken = treecapitate(
      blockBefore,
      width,
      durability?.maxDurability - durability?.damage,
    );
    reduceDurability(player, treeCapitator, logsBroken, treeCapitatorSlot);
  });
}
