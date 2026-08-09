import { GameMode, Player } from "@minecraft/server";
import {
  craftingIngredient,
  GuidePageText,
  quantityRange,
  resolveGuidePageText,
} from "guide/crafting";
import { ItemPage } from "guide/equipmentPages";
import {
  getDiscoveredOreCount,
  getDiscoveredOres,
  GUIDE_ORE_BLOCKS,
  hasDiscoveredBlock,
} from "guide/blockDiscovery";

interface GuideBlockPageDefinition {
  name: string;
  iconPath: string;
  crafting: GuidePageText[];
  description?: GuidePageText[];
  found?: GuidePageText[];
  crafts?: GuidePageText[];
  smelts?: GuidePageText[];
  drops?: GuidePageText[];
  entries?: GuidePageText[];
  discoverable?: boolean;
}

interface GuideBlockCategory {
  name: string;
  iconPath: string;
  blockIds: string[];
  discoverableOreIds?: readonly string[];
}

function createBlockPage(definition: GuideBlockPageDefinition): ItemPage {
  return new ItemPage({
    title: { translate: definition.name },
    entries: definition.entries?.map(resolveGuidePageText),
    sections: [
      ...(definition.description
        ? [
            {
              title: { translate: "guide.minere.blocks.description" },
              entries: definition.description.map(resolveGuidePageText),
            },
          ]
        : []),
      ...(definition.found
        ? [
            {
              title: { translate: "guide.minere.blocks.found" },
              entries: definition.found.map(resolveGuidePageText),
            },
          ]
        : []),
      ...(definition.crafts
        ? [
            {
              title: { translate: "guide.minere.items.crafts" },
              entries: definition.crafts.map(resolveGuidePageText),
            },
          ]
        : []),
      ...(definition.smelts
        ? [
            {
              title: { translate: "guide.minere.blocks.smelts_into" },
              entries: definition.smelts.map(resolveGuidePageText),
            },
          ]
        : []),
      ...(definition.drops
        ? [
            {
              title: { translate: "guide.minere.blocks.drops" },
              entries: definition.drops.map(resolveGuidePageText),
            },
          ]
        : []),
      ...(definition.crafting.length > 0
        ? [
            {
              title: { translate: "guide.minere.crafting" },
              entries: definition.crafting.map(resolveGuidePageText),
            },
          ]
        : []),
    ],
  });
}

const blockDefinitions: Record<string, GuideBlockPageDefinition> = {
  altars: {
    name: "guide.minere.blocks.altars",
    iconPath: "textures/guide/blocks/altar",
    description: ["guide.minere.blocks.altars.description"],
    crafting: [
      craftingIngredient("item.amethyst_shard.name", 2),
      craftingIngredient("tile.carpet.red.name", 2),
      craftingIngredient("tile.gold_block.name"),
      craftingIngredient("tile.chiseled_tuff.name", 3),
    ],
  },
  teleporter: {
    name: "tile.minere:teleporter.name",
    iconPath: "textures/guide/blocks/teleporter",
    description: [
      "guide.minere.blocks.teleporter.description",
      "guide.minere.blocks.teleporter.distance",
    ],
    crafting: [
      craftingIngredient("item.minere:enderon_gemstone", 6),
      craftingIngredient("item.phased_ender_pearl.name"),
      craftingIngredient("item.comparator.name"),
      craftingIngredient("tile.calibrated_sculk_sensor.name"),
    ],
  },
  enderon_block: {
    name: "tile.minere:enderon_block.name",
    iconPath: "textures/guide/blocks/enderon_block",
    description: ["guide.minere.blocks.enderon_block.description"],
    crafting: [craftingIngredient("item.minere:enderon_gemstone", 9)],
  },
  indigon_block: {
    name: "tile.minere:indigon_block.name",
    iconPath: "textures/guide/blocks/indigon_block",
    crafting: [craftingIngredient("item.minere:indigon_ingot", 9)],
  },
  raw_indigon_block: {
    name: "tile.minere:raw_indigon_block.name",
    iconPath: "textures/guide/blocks/raw_indigon_block",
    crafting: [craftingIngredient("item.minere:raw_indigon", 9)],
    crafts: [craftingIngredient("item.minere:raw_indigon", 9)],
  },
  nether_coal_block: {
    name: "tile.minere:nether_coal_block.name",
    iconPath: "textures/guide/blocks/nether_coal_block",
    crafting: [craftingIngredient("item.nether_coal.name", 9)],
  },
  plasma_ball: {
    name: "tile.minere:plasma_ball.name",
    iconPath: "textures/guide/blocks/plasma_ball",
    crafting: [
      craftingIngredient("tile.glass_pane.name", 8),
      craftingIngredient("item.ender_plasma.name"),
    ],
  },
  pulsar: {
    name: "tile.minere:pulsar.name",
    iconPath: "textures/guide/blocks/pulsar",
    crafting: [craftingIngredient("item.ender_plasma.name", 9)],
  },
  firefly_lamps: {
    name: "guide.minere.blocks.firefly_lamps",
    iconPath: "textures/guide/blocks/firefly_lantern",
    entries: ["guide.minere.blocks.firefly_lamps.description"],
    crafting: [],
  },
  andesite_bricks: {
    name: "tile.minere:andesite_bricks.name",
    iconPath: "textures/guide/blocks/andesite_bricks",
    crafting: [craftingIngredient("tile.stone.andesiteSmooth.name", 4)],
  },
  granite_bricks: {
    name: "tile.minere:granite_bricks.name",
    iconPath: "textures/guide/blocks/granite_bricks",
    crafting: [craftingIngredient("tile.stone.graniteSmooth.name", 4)],
  },
  diorite_bricks: {
    name: "tile.minere:diorite_bricks.name",
    iconPath: "textures/guide/blocks/diorite_bricks",
    crafting: [craftingIngredient("tile.stone.dioriteSmooth.name", 4)],
  },
  lapis_bricks: {
    name: "tile.minere:lapis_bricks.name",
    iconPath: "textures/guide/blocks/lapis_bricks",
    crafting: [
      craftingIngredient("item.brick.name", 2),
      craftingIngredient("item.dye.blue.name", 2),
    ],
  },
  runic_blackstone: {
    name: "tile.minere:runic_blackstone.name",
    iconPath: "textures/guide/blocks/runic_blackstone",
    crafting: [
      craftingIngredient("tile.polished_blackstone.name", 2),
      craftingIngredient("item.minere:diamond_shard", 2),
    ],
  },
  runic_blackstone_bricks: {
    name: "tile.minere:runic_blackstone_bricks.name",
    iconPath: "textures/guide/blocks/runic_blackstone_bricks",
    crafting: [craftingIngredient("tile.minere:runic_blackstone.name", 4)],
  },
  amethyst_ore: {
    name: "tile.minere:amethyst_ore.name",
    iconPath: "textures/guide/blocks/amethyst_ore",
    crafting: [],
    found: ["guide.minere.blocks.amethyst_ore.found"],
    smelts: ["guide.minere.blocks.amethyst_ore.smelts"],
    drops: [
      quantityRange("item.amethyst_shard.name", 1, 2),
      { translate: "guide.minere.blocks.drop.xp", with: ["1-3"] },
    ],
  },
  deepslate_amethyst_ore: {
    name: "tile.minere:deepslate_amethyst_ore.name",
    iconPath: "textures/guide/blocks/deepslate_amethyst_ore",
    crafting: [],
    found: ["guide.minere.blocks.deepslate_amethyst_ore.found"],
    smelts: ["guide.minere.blocks.deepslate_amethyst_ore.smelts"],
    drops: [
      quantityRange("item.amethyst_shard.name", 1, 2),
      { translate: "guide.minere.blocks.drop.xp", with: ["1-3"] },
    ],
  },
  sulfur_ore: {
    name: "tile.minere:sulfur_ore.name",
    iconPath: "textures/guide/blocks/sulfur_ore",
    crafting: [],
    found: ["guide.minere.blocks.sulfur_ore.found"],
    smelts: ["guide.minere.blocks.sulfur_ore.smelts"],
    drops: [
      quantityRange("item.gunpowder.name", 1, 2),
      { translate: "guide.minere.blocks.drop.xp", with: ["0-2"] },
    ],
  },
  deepslate_sulfur_ore: {
    name: "tile.minere:deepslate_sulfur_ore.name",
    iconPath: "textures/guide/blocks/deepslate_sulfur_ore",
    crafting: [],
    found: ["guide.minere.blocks.deepslate_sulfur_ore.found"],
    smelts: ["guide.minere.blocks.deepslate_sulfur_ore.smelts"],
    drops: [
      quantityRange("item.gunpowder.name", 1, 2),
      { translate: "guide.minere.blocks.drop.xp", with: ["0-2"] },
    ],
  },
  basalt_iron_ore: {
    name: "tile.minere:basalt_iron_ore.name",
    iconPath: "textures/guide/blocks/basalt_iron_ore",
    crafting: [],
    found: ["guide.minere.blocks.basalt_iron_ore.found"],
    smelts: ["guide.minere.blocks.basalt_iron_ore.smelts"],
    drops: [
      quantityRange("item.iron_nugget.name", 2, 6),
      { translate: "guide.minere.blocks.drop.xp", with: ["0-1"] },
    ],
  },
  blackstone_iron_ore: {
    name: "tile.minere:blackstone_iron_ore.name",
    iconPath: "textures/guide/blocks/blackstone_iron_ore",
    crafting: [],
    found: ["guide.minere.blocks.blackstone_iron_ore.found"],
    smelts: ["guide.minere.blocks.blackstone_iron_ore.smelts"],
    drops: [
      quantityRange("item.iron_nugget.name", 2, 6),
      { translate: "guide.minere.blocks.drop.xp", with: ["0-1"] },
    ],
  },
  indigon_ore: {
    name: "tile.minere:indigon_ore.name",
    iconPath: "textures/guide/blocks/indigon_ore",
    crafting: [],
    found: [
      "guide.minere.blocks.indigon_ore.found",
      "guide.minere.blocks.indigon_ore.noise_map",
    ],
    smelts: ["guide.minere.blocks.indigon_ore.smelts"],
    drops: [
      craftingIngredient("item.minere:raw_indigon"),
      { translate: "guide.minere.blocks.drop.xp", with: ["1-4"] },
    ],
  },
  basalt_indigon_ore: {
    name: "tile.minere:basalt_indigon_ore.name",
    iconPath: "textures/guide/blocks/basalt_indigon_ore",
    crafting: [],
    found: [
      "guide.minere.blocks.basalt_indigon_ore.found",
      "guide.minere.blocks.indigon_ore.noise_map",
    ],
    smelts: ["guide.minere.blocks.basalt_indigon_ore.smelts"],
    drops: [
      craftingIngredient("item.minere:raw_indigon"),
      { translate: "guide.minere.blocks.drop.xp", with: ["1-4"] },
    ],
  },
  nether_coal_ore: {
    name: "tile.minere:nether_coal_ore.name",
    iconPath: "textures/guide/blocks/nether_coal_ore",
    crafting: [],
    found: [
      "guide.minere.blocks.nether_coal_ore.found",
      "guide.minere.blocks.nether_coal_ore.noise_map",
    ],
    smelts: ["guide.minere.blocks.nether_coal_ore.smelts"],
    drops: [
      craftingIngredient("item.nether_coal.name"),
      { translate: "guide.minere.blocks.drop.xp", with: ["0-2"] },
    ],
  },
  basalt_nether_coal_ore: {
    name: "tile.minere:basalt_nether_coal_ore.name",
    iconPath: "textures/guide/blocks/basalt_nether_coal_ore",
    crafting: [],
    found: [
      "guide.minere.blocks.basalt_nether_coal_ore.found",
      "guide.minere.blocks.nether_coal_ore.noise_map",
    ],
    smelts: ["guide.minere.blocks.basalt_nether_coal_ore.smelts"],
    drops: [
      craftingIngredient("item.nether_coal.name"),
      { translate: "guide.minere.blocks.drop.xp", with: ["0-2"] },
    ],
  },
  enderon_ore: {
    name: "tile.minere:enderon_ore.name",
    iconPath: "textures/guide/blocks/enderon_ore",
    crafting: [],
    found: ["guide.minere.blocks.enderon_ore.found"],
    smelts: ["guide.minere.blocks.enderon_ore.smelts"],
    drops: [
      craftingIngredient("item.minere:enderon_gemstone"),
      { translate: "guide.minere.blocks.drop.xp", with: ["2-6"] },
    ],
  },
  ender_plasma_ore: {
    name: "tile.minere:ender_plasma_ore.name",
    iconPath: "textures/guide/blocks/ender_plasma_ore",
    crafting: [],
    found: ["guide.minere.blocks.ender_plasma_ore.found"],
    smelts: ["guide.minere.blocks.ender_plasma_ore.smelts"],
    drops: [
      quantityRange("item.ender_plasma.name", 1, 2),
      { translate: "guide.minere.blocks.drop.xp", with: ["0-3"] },
    ],
  },
  end_crystalline: {
    name: "tile.minere:end_crystalline.name",
    iconPath: "textures/guide/blocks/end_crystalline",
    crafting: [],
    crafts: [
      "guide.minere.blocks.end_crystalline.crafts.amethyst_shard",
      "item.minere:end_path",
      "guide.minere.blocks.end_crystalline.crafts.tinted_glass",
    ],
  },
  end_sand: {
    name: "tile.minere:end_sand.name",
    iconPath: "textures/guide/blocks/end_sand",
    crafting: [],
    crafts: ["guide.minere.blocks.end_sand.crafts.end_stone"],
    smelts: ["tile.glass.name"],
  },
  ghost_pot: {
    name: "guide.minere.blocks.ghost_pot",
    iconPath: "textures/guide/blocks/ghost_pot",
    crafting: [],
    entries: [{ text: "???" }],
    discoverable: true,
  },
};

const blockCategories: GuideBlockCategory[] = [
  {
    name: "guide.minere.blocks.ores",
    iconPath: "textures/guide/blocks/enderon_ore",
    blockIds: [
      "amethyst_ore",
      "deepslate_amethyst_ore",
      "sulfur_ore",
      "deepslate_sulfur_ore",
      "basalt_iron_ore",
      "blackstone_iron_ore",
      "indigon_ore",
      "basalt_indigon_ore",
      "nether_coal_ore",
      "basalt_nether_coal_ore",
      "enderon_ore",
      "ender_plasma_ore",
    ],
    discoverableOreIds: GUIDE_ORE_BLOCKS,
  },
  {
    name: "guide.minere.blocks.lights",
    iconPath: "textures/guide/blocks/firefly_lantern",
    blockIds: ["firefly_lamps", "plasma_ball", "pulsar"],
  },
  {
    name: "guide.minere.blocks.building_materials",
    iconPath: "textures/guide/blocks/runic_blackstone_bricks",
    blockIds: [
      "andesite_bricks",
      "granite_bricks",
      "diorite_bricks",
      "lapis_bricks",
      "runic_blackstone",
      "runic_blackstone_bricks",
      "end_crystalline",
      "end_sand",
    ],
  },
  {
    name: "guide.minere.blocks.utility",
    iconPath: "textures/guide/blocks/teleporter",
    blockIds: ["altars", "teleporter", "ghost_pot"],
  },
  {
    name: "guide.minere.blocks.storage",
    iconPath: "textures/guide/blocks/indigon_block",
    blockIds: [
      "enderon_block",
      "indigon_block",
      "raw_indigon_block",
      "nether_coal_block",
    ],
  },
];

const blockPages = new Map(
  Object.entries(blockDefinitions).map(([id, definition]) => [
    id,
    createBlockPage(definition),
  ]),
);

const blocksPage = new ItemPage({
  title: { translate: "guide.minere.section.blocks" },
  buttons: blockCategories.map((category) => ({
    text: { translate: category.name },
    getText: category.discoverableOreIds
      ? (player) =>
          player.getGameMode() === GameMode.Creative
            ? { translate: category.name }
            : {
                translate: "guide.minere.blocks.ores.progress",
                with: [
                  getDiscoveredOreCount(player).toString(),
                  category.discoverableOreIds!.length.toString(),
                ],
              }
      : undefined,
    iconPath: category.iconPath,
    show: (player, onBack) => {
      const isCreative = player.getGameMode() === GameMode.Creative;
      const discoveredOres = new Set<string>(getDiscoveredOres(player));
      const visibleBlockIds = category.discoverableOreIds
        ? isCreative
          ? category.blockIds
          : category.blockIds.filter((blockId) => discoveredOres.has(blockId))
        : category.blockIds;
      const availableBlockIds = visibleBlockIds.filter((blockId) => {
        const definition = blockDefinitions[blockId];
        return (
          isCreative ||
          !definition.discoverable ||
          hasDiscoveredBlock(player, blockId)
        );
      });
      new ItemPage({
        title: { translate: category.name },
        entries:
          category.discoverableOreIds && !isCreative
            ? [
                {
                  translate: "guide.minere.section.discovered_total",
                  with: [
                    getDiscoveredOreCount(player).toString(),
                    category.discoverableOreIds.length.toString(),
                  ],
                },
              ]
            : undefined,
        emptyMessage: category.discoverableOreIds
          ? { translate: "guide.minere.blocks.ores.none_discovered" }
          : undefined,
        buttons: availableBlockIds.map((id) => {
          const definition = blockDefinitions[id];
          return {
            text: { translate: definition.name },
            iconPath: definition.iconPath,
            show: (pagePlayer, pageBack) => {
              blockPages.get(id)?.show(pagePlayer, pageBack);
            },
          };
        }),
      }).show(player, onBack);
    },
  })),
});

export function showBlocksPage(player: Player, onBack: () => void): void {
  blocksPage.show(player, onBack);
}
