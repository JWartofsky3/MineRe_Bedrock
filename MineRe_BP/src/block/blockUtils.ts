import { Block, Dimension, LiquidType, Vector3 } from "@minecraft/server";
import { isValid } from "util/vector3Functions";

// Unbreakable blocks
export const unbreakableBlocks = new Set<string>([
  "minecraft:bedrock",
  "minecraft:end_portal_frame",
  "minecraft:reinforced_deepslate",
  "minecraft:barrier",
  "minecraft:command_block",
  "minecraft:chain_command_block",
  "minecraft:repeating_command_block",
  "minecraft:structure_block",
  "minecraft:jigsaw",
  "minecraft:structure_void",
  "minecraft:light", // invisible light block
  "minecraft:end_portal",
  "minecraft:nether_portal",
  "minecraft:air",
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:fire",
  "minecraft:trial_spawner",
  "minecraft:mob_spawner",
]);

// Replaceable blocks
export const replaceableBlocks = new Set<string>([
  "minecraft:air",
  "minecraft:fire",
  "minecraft:soul_fire",
  "minecraft:short_grass", // Bedrock-only naming (Java: "grass")
  "minecraft:tall_grass",
  "minecraft:snow_layer",
  "minecraft:fern",
  "minecraft:large_fern",
  "minecraft:crimson_roots",
  "minecraft:warped_roots",
  "minecraft:nether_sprouts",
  "minecraft:seagrass",
  "minecraft:kelp",
  "minecraft:vine",
  "minecraft:weeping_vines",
  "minecraft:twisting_vines",
  "minecraft:moss_carpet",
  "minecraft:big_dripleaf",
]);

export const oceanRuinBlocks = new Set<string>([
  "minecraft:bricks",
  "minecraft:chiseled_sandstone",
  "minecraft:chiseled_stone_bricks",
  "minecraft:cobblestone",
  "minecraft:cracked_stone_bricks",
  "minecraft:cut_sandstone",
  "minecraft:dark_oak_planks",
  "minecraft:light_blue_terracotta",
  "minecraft:magma_block",
  "minecraft:mossy_cobblestone",
  "minecraft:mossy_stone_bricks",
  "minecraft:obsidian",
  "minecraft:polished_diorite",
  "minecraft:polished_granite",
  "minecraft:prismarine",
  "minecraft:purple_glazed_terracotta",
  "minecraft:sandstone_stairs",
  "minecraft:sea_lantern",
  "minecraft:spruce_planks",
  "minecraft:stone_bricks",
  "minecraft:stone_brick_stairs",
  "minecraft:suspicious_gravel",
  "minecraft:suspicious_sand",
]);

export const shipwreckBlocks = new Set<string>([
  "minecraft:oak_planks",
  "minecraft:oak_slab",
  "minecraft:oak_stairs",
  "minecraft:oak_fence",
  "minecraft:oak_trapdoor",
  "minecraft:oak_door",
  "minecraft:oak_log",
  "minecraft:birch_planks",
  "minecraft:birch_slab",
  "minecraft:birch_stairs",
  "minecraft:birch_fence",
  "minecraft:birch_trapdoor",
  "minecraft:spruce_planks",
  "minecraft:spruce_slab",
  "minecraft:spruce_stairs",
  "minecraft:spruce_fence",
  "minecraft:spruce_trapdoor",
  "minecraft:spruce_door",
  "minecraft:spruce_log",
  "minecraft:jungle_planks",
  "minecraft:jungle_slab",
  "minecraft:jungle_stairs",
  "minecraft:jungle_fence",
  "minecraft:jungle_trapdoor",
  "minecraft:jungle_door",
  "minecraft:jungle_log",
  "minecraft:dark_oak_planks",
  "minecraft:dark_oak_slab",
  "minecraft:dark_oak_stairs",
  "minecraft:dark_oak_fence",
  "minecraft:dark_oak_trapdoor",
  "minecraft:dark_oak_door",
  "minecraft:dark_oak_log",
  "minecraft:stripped_oak_log",
  "minecraft:stripped_spruce_log",
  "minecraft:stripped_jungle_log",
  "minecraft:stripped_dark_oak_log",
  "minecraft:chest",
]);

export const oceanMonumentBlocks = new Set<string>([
  "minecraft:prismarine",
  "minecraft:prismarine_bricks",
  "minecraft:dark_prismarine",
  "minecraft:sea_lantern",
  "minecraft:wet_sponge",
]);

export const ruinedPortalBlocks = new Set<string>([
  "minecraft:obsidian",
  "minecraft:crying_obsidian",
  "minecraft:netherrack",
  "minecraft:stone_bricks",
  "minecraft:chiseled_stone_bricks",
  "minecraft:cracked_stone_bricks",
  "minecraft:polished_blackstone",
  "minecraft:polished_blackstone_bricks",
  "minecraft:polished_blackstone_brick_slab",
  "minecraft:polished_blackstone_brick_stairs",
  "minecraft:gold_block",
  "minecraft:iron_bars",
  "minecraft:chest",
]);

export const oceanBlocks = new Set<string>([
  "minecraft:air",
  "minecraft:water",
  "minecraft:flowing_water",
  "minecraft:seagrass",
  "minecraft:kelp",
  "minecraft:snow_layer",
]);

export const oceanFloorBlocks = new Set<string>([
  "minecraft:stone",
  "minecraft:granite",
  "minecraft:diorite",
  "minecraft:andesite",
  "minecraft:deepslate",
  "minecraft:sand",
  "minecraft:gravel",
  "minecraft:clay",
  "minecraft:seagrass",
  "minecraft:kelp",
]);

export function getBlock(dimension: Dimension, location: Vector3): Block {
  if (!isValid(dimension, location)) {
    return null;
  }
  return dimension.getBlock(location);
}

export function isSolid(block: Block) {
  return (
    block?.isValid &&
    !block.isAir &&
    !block.isLiquid &&
    !block.canBeDestroyedByLiquidSpread(LiquidType.Water) &&
    block.isLiquidBlocking(LiquidType.Water) &&
    !block.isWaterlogged
  );
}
