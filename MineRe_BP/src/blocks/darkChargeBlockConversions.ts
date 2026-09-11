import { getIdentifierKeywords } from "util/identifierKeywords";

export type BlockConversion = {
  /** Exact block identifiers that this conversion applies to. */
  from?: string[];
  /** All of these words must be present in the identifier path. */
  keywords?: string[];
  /** Any group of keywords can match; every word in a group is required. */
  keywordGroups?: string[][];
  /** Words that prevent a keyword match. */
  excludedKeywords?: string[];
  chance: number;
  to: string[];
};

const BLOCK_CONVERSION_CHANCE = 0.5;

/**
 * Splits a block identifier into searchable words. For example,
 * `minecraft:golden_horse_armor` becomes `golden`, `horse`, and `armor`.
 */
export function matchesBlockConversion(
  typeId: string,
  conversion: BlockConversion,
): boolean {
  if (conversion.from?.includes(typeId)) {
    return true;
  }

  const keywordGroups = [
    ...(conversion.keywords ? [conversion.keywords] : []),
    ...(conversion.keywordGroups ?? []),
  ];
  if (!keywordGroups.length) {
    return false;
  }

  const keywords = getIdentifierKeywords(typeId);
  return (
    keywordGroups.some((group) =>
      group.every((keyword) => keywords.has(keyword)),
    ) && !conversion.excludedKeywords?.some((keyword) => keywords.has(keyword))
  );
}

/** The projectile's lighter, plant-clearing conversions. */
export const SOFT_BLOCK_CONVERSIONS: BlockConversion[] = [
  {
    from: ["minecraft:grass", "minecraft:grass_block"],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:dirt"],
  },
  {
    from: ["minecraft:crimson_nylium", "minecraft:warped_nylium"],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:netherrack"],
  },
  {
    from: ["minecraft:farmland"],
    chance: 1,
    to: ["minecraft:coarse_dirt"],
  },
  {
    from: ["minecraft:mossy_cobblestone"],
    chance: 1,
    to: ["minecraft:cobblestone"],
  },
  {
    from: ["minecraft:mossy_cobblestone_wall"],
    chance: 1,
    to: ["minecraft:cobblestone_wall"],
  },
  {
    from: ["minecraft:mossy_stone_bricks"],
    chance: 1,
    to: ["minecraft:stone_bricks"],
  },
  {
    from: ["minecraft:mossy_stone_brick_slab"],
    chance: 1,
    to: ["minecraft:stone_brick_slab"],
  },
  {
    from: ["minecraft:mossy_stone_brick_stairs"],
    chance: 1,
    to: ["minecraft:stone_brick_stairs"],
  },
  {
    from: ["minecraft:mossy_stone_brick_wall"],
    chance: 1,
    to: ["minecraft:stone_brick_wall"],
  },
  {
    from: [
      "minecraft:glow_berries",
      "minecraft:glow_berry_bush",
      "minecraft:cave_vines",
      "minecraft:cave_vines_body_with_berries",
      "minecraft:cave_vines_head_with_berries",
      "minecraft:wheat",
      "minecraft:carrots",
      "minecraft:potatoes",
      "minecraft:beetroot",
      "minecraft:cocoa",
      "minecraft:melon_stem",
      "minecraft:attached_melon_stem",
      "minecraft:pumpkin_stem",
      "minecraft:attached_pumpkin_stem",
      "minecraft:torchflower_crop",
      "minecraft:pitcher_plant",
      "minecraft:melon_block",
      "minecraft:pumpkin",
      "minecraft:cactus",
      "minecraft:cactus_flower",
      "minecraft:bamboo",
      "minecraft:bamboo_sapling",
      "minecraft:chorus_flower",
      "minecraft:chorus_plant",
      "minecraft:nether_sprouts",
      "minecraft:small_dripleaf_block",
      "minecraft:big_dripleaf",
      "minecraft:big_dripleaf_stem",
      "minecraft:spore_blossom",
      "minecraft:azalea",
      "minecraft:flowering_azalea",
      "minecraft:vine",
      "minecraft:weeping_vines",
      "minecraft:twisting_vines",
      "minecraft:kelp",
      "minecraft:kelp_plant",
      "minecraft:seagrass",
      "minecraft:tall_seagrass",
      "minecraft:sea_pickle",
      "minecraft:moss_carpet",
      "minecraft:grass",
      "minecraft:short_grass",
      "minecraft:tallgrass",
      "minecraft:tall_grass",
      "minecraft:fern",
      "minecraft:large_fern",
      "minecraft:nether_wart",
      "minecraft:warped_wart_block",
      "minecraft:nether_wart_block",
      "minecraft:dandelion",
      "minecraft:poppy",
      "minecraft:blue_orchid",
      "minecraft:allium",
      "minecraft:azure_bluet",
      "minecraft:red_tulip",
      "minecraft:orange_tulip",
      "minecraft:white_tulip",
      "minecraft:pink_tulip",
      "minecraft:oxeye_daisy",
      "minecraft:cornflower",
      "minecraft:lily_of_the_valley",
      "minecraft:wither_rose",
      "minecraft:sunflower",
      "minecraft:lilac",
      "minecraft:rose_bush",
      "minecraft:peony",
      "minecraft:torchflower",
      "minecraft:pitcher_crop",
      "minecraft:reeds",
      "minecraft:sugar_cane",
      "minecraft:pink_petals",
      "minecraft:wildflowers",
      "minecraft:open_eyeblossom",
      "minecraft:closed_eyeblossom",
      "minecraft:leaf_litter",
    ],
    keywordGroups: [
      ["leaves"],
      ["roots"],
      ["fungus"],
      ["mushroom"],
      ["sapling"],
      ["propagule"],
      ["vine"],
      ["vines"],
    ],
    chance: 1,
    to: ["minecraft:air"],
  },
  {
    keywords: ["bush"],
    chance: 1,
    to: ["minecraft:deadbush"],
  },
];

/** The item-only, terrain-changing conversions. */
export const HARD_BLOCK_CONVERSIONS: BlockConversion[] = [
  {
    from: ["minecraft:sand", "minecraft:red_sand", "minere:end_sand"],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:soul_sand", "minecraft:soul_soil"],
  },
  {
    from: [
      "minecraft:stone",
      "minecraft:granite",
      "minecraft:diorite",
      "minecraft:andesite",
      "minecraft:deepslate",
      "minecraft:tuff",
      "minecraft:calcite",
      "minecraft:dripstone_block",
      "minecraft:cobblestone",
      "minecraft:mossy_cobblestone",
      "minecraft:moss",
      "minecraft:end_stone",
    ],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:blackstone", "minecraft:basalt", "minecraft:netherrack"],
  },
  {
    from: ["minecraft:dirt", "minecraft:grass_block"],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:netherrack", "minecraft:soul_soil"],
  },
  {
    keywords: ["log"],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:basalt"],
  },
  {
    keywords: ["wood"],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:basalt"],
  },
  {
    keywords: ["stem"],
    excludedKeywords: ["mushroom"],
    chance: BLOCK_CONVERSION_CHANCE,
    to: ["minecraft:basalt"],
  },
];

/**
 * Conversion maps keyed by Dark Charge hardness. Index 0 is intentionally
 * empty, index 1 is soft, and index 2 is hard.
 */
export const DARK_CHARGE_BLOCK_CONVERSIONS: BlockConversion[][] = [
  [],
  SOFT_BLOCK_CONVERSIONS,
  HARD_BLOCK_CONVERSIONS,
];
