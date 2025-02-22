import { isValid } from "util/vector3Functions";
export const unbreakableBlocks = new Set();
// unbreakable blocks
unbreakableBlocks.add("minecraft:bedrock");
unbreakableBlocks.add("minecraft:end_portal_frame");
unbreakableBlocks.add("minecraft:reinforced_deepslate");
unbreakableBlocks.add("minecraft:water");
unbreakableBlocks.add("minecraft:flowing_water");
unbreakableBlocks.add("minecraft:lava");
unbreakableBlocks.add("minecraft:flowing_lava");
unbreakableBlocks.add("minecraft:air");
unbreakableBlocks.add("minecraft:fire");
unbreakableBlocks.add("minecraft:structure_void");
unbreakableBlocks.add("minecraft:barrier");
unbreakableBlocks.add("minecraft:command_block");
unbreakableBlocks.add("minecraft:chain_command_block");
unbreakableBlocks.add("minecraft:repeating_command_block");
export function getBlock(dimension, location) {
  if (!isValid(dimension, location)) {
    return null;
  }
  return dimension.getBlock(location);
}
