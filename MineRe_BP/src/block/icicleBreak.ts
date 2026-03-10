import {
  system,
  Block,
  BlockComponentBlockBreakEvent,
  BlockCustomComponent,
} from "@minecraft/server";
import { isSolid } from "block/blockUtils";

const icicleBlocks = new Set<string>([
  "minere:thick_icicle",
  "minere:thin_icicle",
]);

function isIcicle(block: Block): boolean {
  if (!block?.isValid) {
    return false;
  }

  return icicleBlocks.has(block.typeId);
}

function hasSupportAbove(block: Block): boolean {
  if (!block?.isValid) {
    return false;
  }

  let currentBlock = block;
  while (isIcicle(currentBlock.above())) {
    currentBlock = currentBlock.above();
  }

  const supportBlock = currentBlock.above();
  return !!supportBlock?.isValid && isSolid(supportBlock);
}

function hasSupportBelow(block: Block): boolean {
  if (!block?.isValid) {
    return false;
  }

  let currentBlock = block;
  while (isIcicle(currentBlock.below())) {
    currentBlock = currentBlock.below();
  }

  const supportBlock = currentBlock.below();
  return !!supportBlock?.isValid && isSolid(supportBlock);
}

function breakUnsupportedIcicle(
  block: Block,
  delay: number,
  isSupported: (block: Block) => boolean,
): void {
  if (!isIcicle(block)) {
    return;
  }
  if (isSupported(block)) {
    return;
  }

  system.runTimeout(() => {
    if (!isIcicle(block) || isSupported(block)) {
      return;
    }
    block.dimension.runCommand(
      `setblock ${block.location.x} ${block.location.y} ${block.location.z} air destroy`,
    );
  }, delay);
}

function getOffsetBlock(
  arg: BlockComponentBlockBreakEvent,
  yOffset: number,
): Block {
  const location = arg.block.location;

  return arg.dimension.getBlock({
    x: location.x,
    y: location.y + yOffset,
    z: location.z,
  });
}

export const icicleBreak: BlockCustomComponent = {
  onBreak(arg: BlockComponentBlockBreakEvent) {
    breakUnsupportedIcicle(getOffsetBlock(arg, 1), 0, hasSupportAbove);
    breakUnsupportedIcicle(getOffsetBlock(arg, -1), 1, hasSupportBelow);
  },
};
