import {
  Block,
  BlockComponentTickEvent,
  BlockCustomComponent,
  BlockPermutation,
} from "@minecraft/server";

const ACTIVATED_ENDERON_BLOCK = "minere:activated_enderon_block";
const ENDERON_BLOCK = "minere:enderon_block";
const TELEPORTER = "minere:teleporter";
const ENDER_SORTER = "minere:ender_sorter";
const MAX_TELEPORTER_SEARCH_DEPTH = 16;

export const activatedEnderonBlock: BlockCustomComponent = {
  onTick(arg: BlockComponentTickEvent) {
    if (!hasActiveTeleporter(arg.block)) {
      arg.block.setPermutation(BlockPermutation.resolve(ENDERON_BLOCK));
    }
  },
};

function hasActiveTeleporter(startBlock: Block): boolean {
  const visited = new Set([getBlockKey(startBlock)]);
  const queue: Array<{ block: Block; depth: number }> = [
    { block: startBlock, depth: 0 },
  ];

  for (let index = 0; index < queue.length; index++) {
    const { block, depth } = queue[index];
    if (depth >= MAX_TELEPORTER_SEARCH_DEPTH) {
      continue;
    }
    for (const neighbor of getAdjacentBlocks(block)) {
      if (!neighbor.isValid) {
        continue;
      }
      if (isActiveTeleporter(neighbor) || isActiveEnderSorter(neighbor)) {
        return true;
      }
      if (neighbor.typeId !== ACTIVATED_ENDERON_BLOCK) {
        continue;
      }
      const key = getBlockKey(neighbor);
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      queue.push({ block: neighbor, depth: depth + 1 });
    }
  }

  return false;
}

function isActiveTeleporter(block: Block): boolean {
  return (
    block.typeId === TELEPORTER &&
    block.permutation.getAllStates()["minere:powered"] === true
  );
}

function isActiveEnderSorter(block: Block): boolean {
  return block.typeId === ENDER_SORTER && !block.getRedstonePower();
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
