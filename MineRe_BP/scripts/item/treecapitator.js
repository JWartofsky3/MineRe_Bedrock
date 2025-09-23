import {
  EntityComponentTypes,
  EquipmentSlot,
  system,
  BlockVolume,
  ItemComponentTypes,
} from "@minecraft/server";
import { Queue } from "util/queue";
import { isValid, vector3ToString } from "util/vector3Functions";
import { reduceDurability } from "./reduce_durability";
import { customToolHandleDurability } from "./custom_tools";
// --- Constants (ADJUSTED FOR NON-SPREADING BEHAVIOR) ---
// These control the overall bounding box of the tree from the origin block
const LEAF_HORIZONTAL_DISTANCE = 12; // Maximum horizontal distance for leaves from the origin
const MAX_VERTICAL_DISTANCE = 35; // Maximum vertical distance (height) from the origin
// NEW CONSTANT: This is crucial for preventing spread to adjacent trees.
// It defines the horizontal search radius for finding *connected* logs in the BFS.
// Make this smaller if trees are very close together. A value of 3-5 is usually good for preventing spread.
const LOG_BFS_HORIZONTAL_LIMIT = 5; // Limiting horizontal spread of log detection from the origin
const ALTITUDE_BONUS_START = 12;
const ALTITUDE_BONUS = 3;
const REMAINING_DURABILITY_MULTIPLIER = 1.5;
const MINIMUM_BREAK_AMOUNT = 5;
const TREE_BREAK_DELAY = 2; // In ticks
const LEAF_BREAK_RADIUS = 3; // Leaves will break if within this many blocks of a broken log
export const logSet = new Set();
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
mushroomSet.add("minecraft:shroomlight"); // Corrected to standard Minecraft ID
const leavesAndMushrooms = new Set([...leavesSet, ...mushroomSet]);
export function checkIsType(dimension, location, typeSet, typeNames) {
  if (!isValid(dimension, location)) {
    return undefined;
  }
  const block = dimension.getBlock(location);
  if (!block?.typeId) {
    return undefined;
  }
  if (typeSet.has(block.typeId)) {
    return block;
  }
  for (let i = 0; i < typeNames.length; i++) {
    if (block.typeId.includes(typeNames[i])) {
      return block;
    }
  }
  return undefined;
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
    // Ensure we don't add the origin block itself as a neighbor
    if (
      next.value.x !== location.x ||
      next.value.y !== location.y ||
      next.value.z !== location.z
    ) {
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
function distance(loc1, loc2) {
  const dx = loc1.x - loc2.x;
  const dy = loc1.y - loc2.y;
  const dz = loc1.z - loc2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function treecapitate(dimension, origin, durability) {
  let highest = 0;
  const visited = new Set();
  const queue = new Queue();
  const logs = new Set();
  const initialLeaves = new Set();
  const brokenLogs = new Set();
  queue.enqueue(origin);
  visited.add(vector3ToString(origin)); // Add origin to visited immediately
  while (!queue.isEmpty()) {
    const next = queue.dequeue();
    if (next.y - origin.y > highest) {
      highest = next.y - origin.y;
    }
    // Refined search volume for logs - relatively small local search,
    // the global limit is enforced by checkRange with LOG_BFS_HORIZONTAL_LIMIT
    const neighbors = getNeighbors(
      dimension,
      next,
      {
        x: -1, // Look one block in each direction from the current log
        y: -1, // Look one block below for branching logs
        z: -1,
      },
      {
        x: 1, // Look one block in each direction from the current log
        y: 1, // Look one block above for branching logs
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
      const altitude = neighbor.y - origin.y;
      // Crucial change: Apply a *stricter* horizontal check for logs here
      // using LOG_BFS_HORIZONTAL_LIMIT, relative to the ORIGIN.
      if (
        checkRange(
          origin,
          neighbor,
          LOG_BFS_HORIZONTAL_LIMIT + // Use the stricter limit here
            (altitude > ALTITUDE_BONUS_START ? ALTITUDE_BONUS : 0),
          MAX_VERTICAL_DISTANCE,
        ) &&
        checkIsType(dimension, neighbor, logSet, ["log", "stem"])
      ) {
        logs.add(neighbor);
        queue.enqueue(neighbor);
      } else if (
        // Leaves still use the broader LEAF_HORIZONTAL_DISTANCE for their initial collection
        checkRange(
          origin,
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
        initialLeaves.add(neighbor);
      }
    }
  }
  if (
    logs.size >
    REMAINING_DURABILITY_MULTIPLIER * durability + MINIMUM_BREAK_AMOUNT
  ) {
    dimension.playSound("item.amethyst_staff.error", origin);
    return 0;
  }
  const logLevelToBreak = new Array(highest + 1);
  logs.forEach((logLocation) => {
    let i = logLocation.y - origin.y;
    if (!logLevelToBreak[i]) {
      logLevelToBreak[i] = new Array(0);
    }
    logLevelToBreak[i].push(logLocation);
  });
  // Schedule log breaking sequentially
  for (let i = 0; i < logLevelToBreak.length; i++) {
    system.runTimeout(() => {
      for (let j = 0; j < logLevelToBreak[i]?.length; j++) {
        const logPos = logLevelToBreak[i][j];
        if (isValid(dimension, logPos)) {
          dimension.runCommand(
            `setBlock ${logPos.x} ${logPos.y} ${logPos.z} air destroy`,
          );
          brokenLogs.add(logPos); // Add to brokenLogs after being destroyed
        }
      }
    }, i * TREE_BREAK_DELAY);
  }
  // Schedule leaf breaking AFTER logs have had time to break and populate brokenLogs
  system.runTimeout(
    () => {
      const finalLeavesToBreak = new Set();
      initialLeaves.forEach((leaf) => {
        let shouldBreak = false;
        for (const brokenLog of brokenLogs) {
          if (distance(leaf, brokenLog) <= LEAF_BREAK_RADIUS) {
            shouldBreak = true;
            break;
          }
        }
        if (shouldBreak) {
          finalLeavesToBreak.add(leaf);
        }
      });
      // Break leaves with a BFS traversal from the filtered set
      const leafQueue = new Queue();
      const visitedLeaves = new Set(); // Separate visited set for leaf BFS
      finalLeavesToBreak.forEach((leaf) => {
        leafQueue.enqueue(leaf);
        visitedLeaves.add(vector3ToString(leaf)); // Add to visited for leaves
      });
      while (!leafQueue.isEmpty()) {
        const nextLeaf = leafQueue.dequeue();
        const block = dimension.getBlock(nextLeaf);
        if (
          checkIsType(dimension, nextLeaf, leavesAndMushrooms, [
            "leaves",
            "shroom_block",
            "wart_block",
            "shroomlight",
          ]) &&
          block &&
          !block.permutation.getState("persistent_bit")
        ) {
          dimension.runCommand(
            `setBlock ${nextLeaf.x} ${nextLeaf.y} ${nextLeaf.z} air destroy`,
          );
        }
        // Check neighbors of the current leaf to find more connected leaves
        const leafNeighbors = getNeighbors(
          dimension,
          nextLeaf,
          { x: -1, y: -1, z: -1 },
          { x: 1, y: 1, z: 1 },
        );
        for (const neighbor of leafNeighbors) {
          const neighborString = vector3ToString(neighbor);
          if (visitedLeaves.has(neighborString)) {
            continue;
          }
          visitedLeaves.add(neighborString);
          // Check if the potential leaf neighbor is close to any of the broken logs
          let isCloseToBrokenLog = false;
          for (const brokenLog of brokenLogs) {
            if (distance(neighbor, brokenLog) <= LEAF_BREAK_RADIUS) {
              isCloseToBrokenLog = true;
              break;
            }
          }
          if (
            isCloseToBrokenLog &&
            checkIsType(dimension, neighbor, leavesAndMushrooms, [
              "leaves",
              "shroom_block",
              "wart_block",
              "shroomlight",
            ])
          ) {
            const neighborBlock = dimension.getBlock(neighbor);
            if (
              neighborBlock &&
              !neighborBlock.permutation.getState("persistent_bit")
            ) {
              leafQueue.enqueue(neighbor);
            }
          }
        }
      }
    },
    highest * TREE_BREAK_DELAY + 3,
  );
  return logs.size;
}
export function runTreecapitate(
  player,
  location,
  blockPermutation,
  treeCapitator,
) {
  if (!player) {
    return 0;
  }
  const dimension = player.dimension;
  const durability = treeCapitator.getComponent(ItemComponentTypes.Durability);
  // must start on a log
  const logTypeId = blockPermutation?.getItemStack()?.typeId;
  if (
    !(
      (logSet.has(logTypeId) ||
        logTypeId.includes("log") ||
        logTypeId.includes("stem")) &&
      blockPermutation.getState("pillar_axis") === "y"
    )
  ) {
    return 0;
  }
  // the log must be isolated - this check is crucial for preventing spread to adjacent trees
  // if they are extremely close. It assumes a 1x1 base.
  const neighbors = getNeighbors(
    dimension,
    location,
    {
      x: -1,
      y: 0,
      z: -1,
    },
    {
      x: 1,
      y: 0,
      z: 1,
    },
  );
  for (let i = 0; i < neighbors.length; i++) {
    if (!!checkIsType(dimension, neighbors[i], logSet, ["log", "stem"])) {
      return 0; // If any immediate horizontal neighbor is a log, it's not isolated.
    }
  }
  const logsBroken = treecapitate(
    player.dimension,
    location,
    durability?.maxDurability - durability?.damage,
  );
  return logsBroken;
}
export function offHandTreecapitate(data) {
  const equippable = data.player.getComponent(EntityComponentTypes.Equippable);
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
    return false;
  }
  if (treeCapitatorSlot !== EquipmentSlot.Offhand) {
    return false;
  }
  const logsBroken = runTreecapitate(
    data.player,
    data.block.location,
    data.brokenBlockPermutation,
    treeCapitator,
  );
  reduceDurability(data.player, treeCapitator, logsBroken, treeCapitatorSlot);
  return logsBroken > 0;
}
export const Treecapitator = {
  onMineBlock(event) {
    system.runTimeout(() => {
      const logsBroken = runTreecapitate(
        event.source,
        event.block.location,
        event.minedBlockPermutation,
        event.itemStack,
      );
      if (logsBroken > 0) {
        reduceDurability(
          event.source,
          event.itemStack,
          logsBroken + 1, // +1 for the initial block broken
          EquipmentSlot.Mainhand,
        );
      } else {
        customToolHandleDurability(event);
      }
    });
  },
};
