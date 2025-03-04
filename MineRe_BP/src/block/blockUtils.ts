import { Block, Dimension, Vector3 } from "@minecraft/server";
import { isValid } from "util/vector3Functions";

export const unbreakableBlocks = new Set<string>();
export const replaceableBlocks = new Set<string>();

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

// replaceable blocks
replaceableBlocks.add("minecraft:air");
replaceableBlocks.add("minecraft:fire");
replaceableBlocks.add("minecraft:soul_fire");
replaceableBlocks.add("minecraft:short_grass");
replaceableBlocks.add("minecraft:tall_grass");
//replaceableBlocks.add("minecraft:leaf_litter");
replaceableBlocks.add("minecraft:snow_layer");
replaceableBlocks.add("minecraft:fern");
replaceableBlocks.add("minecraft:crimson_roots");
replaceableBlocks.add("minecraft:warped_roots");

export function getBlock(dimension: Dimension, location: Vector3): Block {
  if (!isValid(dimension, location)) {
    return null;
  }
  return dimension.getBlock(location);
}
