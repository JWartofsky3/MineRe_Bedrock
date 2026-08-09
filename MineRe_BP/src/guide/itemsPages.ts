import { Player } from "@minecraft/server";
import {
  craftingIngredient,
  GuidePageText,
  resolveGuidePageText,
} from "guide/crafting";
import { ItemPage } from "guide/equipmentPages";

interface GuideItemSection {
  title: string;
  entries: GuidePageText[];
}

interface GuideItemPageDefinition {
  itemId: string;
  name: string;
  iconPath: string;
  sections: GuideItemSection[];
}

function createItemPage(definition: GuideItemPageDefinition): ItemPage {
  return new ItemPage({
    title: { translate: definition.name },
    sections: definition.sections.map((section) => ({
      title: { translate: section.title },
      entries: section.entries.map(resolveGuidePageText),
    })),
  });
}

const bombDefinitions: GuideItemPageDefinition[] = [
  {
    itemId: "minere:bomb",
    name: "item.minere:bomb",
    iconPath: "textures/items/minere/bomb",
    sections: [
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.bomb.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.leather.name", 3),
          craftingIngredient("item.gunpowder.name", 4),
          craftingIngredient("item.string.name"),
        ],
      },
      {
        title: "guide.minere.items.dropped_by",
        entries: ["guide.minere.items.bomb.dropped_by"],
      },
    ],
  },
  {
    itemId: "minere:firebomb",
    name: "item.minere:firebomb",
    iconPath: "textures/items/minere/firebomb",
    sections: [
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.firebomb.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.minere:bomb"),
          craftingIngredient("item.fireball.name"),
        ],
      },
    ],
  },
  {
    itemId: "minere:poison_bomb",
    name: "item.minere:poison_bomb",
    iconPath: "textures/items/minere/poison_bomb",
    sections: [
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.poison_bomb.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.minere:bomb"),
          craftingIngredient("item.spider_eye.name"),
          craftingIngredient("item.slime_ball.name"),
        ],
      },
    ],
  },
  {
    itemId: "minere:wind_bomb",
    name: "item.minere:wind_bomb",
    iconPath: "textures/items/minere/wind_bomb",
    sections: [
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.wind_bomb.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.minere:bomb"),
          craftingIngredient("item.wind_charge.name"),
        ],
      },
    ],
  },
  {
    itemId: "minere:ice_bomb",
    name: "item.minere:ice_bomb",
    iconPath: "textures/items/minere/ice_bomb",
    sections: [
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.ice_bomb.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.minere:bomb"),
          craftingIngredient("item.ice_charge.name"),
        ],
      },
    ],
  },
];

const itemDefinitions: GuideItemPageDefinition[] = [
  {
    itemId: "minere:phased_ender_pearl",
    name: "item.phased_ender_pearl.name",
    iconPath: "textures/items/minere/phased_ender_pearl",
    sections: [
      {
        title: "guide.minere.items.description",
        entries: ["guide.minere.items.phased_ender_pearl.description"],
      },
      {
        title: "guide.minere.items.phased_ender_pearl.teleportation_formula",
        entries: ["guide.minere.items.phased_ender_pearl.formula"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.ender_pearl.name"),
          craftingIngredient("item.ender_plasma.name"),
        ],
      },
      {
        title: "guide.minere.items.crafts",
        entries: ["item.minere:blaster_staff", "tile.minere:teleporter.name"],
      },
      {
        title: "guide.minere.items.dropped_by",
        entries: ["guide.minere.items.phased_ender_pearl.dropped_by"],
      },
    ],
  },
  {
    itemId: "minere:ice_charge",
    name: "item.ice_charge.name",
    iconPath: "textures/items/minere/ice_charge",
    sections: [
      {
        title: "guide.minere.equipment.ammunition",
        entries: ["guide.minere.items.ice_charge.ammunition"],
      },
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.ice_charge.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("tile.blue_ice.name", 8),
          craftingIngredient("item.fireball.name"),
          "guide.minere.crafting.alternative",
          craftingIngredient("tile.blue_ice.name"),
          craftingIngredient("item.wind_charge.name"),
        ],
      },
      {
        title: "guide.minere.items.dropped_by",
        entries: ["guide.minere.items.ice_charge.dropped_by"],
      },
    ],
  },
  {
    itemId: "minere:end_path",
    name: "item.minere:end_path",
    iconPath: "textures/items/minere/end_path",
    sections: [
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.crystalline_platform.abilities"],
      },
      {
        title: "guide.minere.crafting",
        entries: [craftingIngredient("tile.minere:end_crystalline.name", 9)],
      },
    ],
  },
  {
    itemId: "minere:enderon_gemstone",
    name: "item.minere:enderon_gemstone",
    iconPath: "textures/items/minere/enderon_gemstone",
    sections: [
      {
        title: "guide.minere.items.abilities",
        entries: ["guide.minere.items.enderon_gemstone.smelt"],
      },
      {
        title: "guide.minere.crafting",
        entries: [craftingIngredient("tile.minere:enderon_block.name")],
      },
      {
        title: "guide.minere.items.crafts",
        entries: [
          "guide.minere.equipment.enderon_armor",
          "guide.minere.equipment.enderon_tools",
          "item.minere:enderon_treecapitator",
          "item.minere:blaster_staff",
          "item.minere:enderon_bear_armor",
          "item.minere:enderon_elephant_armor",
          "tile.minere:teleporter.name",
          "tile.minere:enderon_block.name",
        ],
      },
      {
        title: "guide.minere.items.ore",
        entries: ["guide.minere.items.enderon_gemstone.ore"],
      },
      {
        title: "guide.minere.items.dropped_by",
        entries: ["guide.minere.items.enderon_gemstone.dropped_by"],
      },
    ],
  },
  {
    itemId: "minere:ender_plasma",
    name: "item.ender_plasma.name",
    iconPath: "textures/items/minere/ender_plasma",
    sections: [
      {
        title: "guide.minere.equipment.ammunition",
        entries: ["guide.minere.items.ender_plasma.ammunition"],
      },
      {
        title: "guide.minere.items.fuel",
        entries: ["guide.minere.items.ender_plasma.fuel_items"],
      },
      {
        title: "guide.minere.crafting",
        entries: [craftingIngredient("tile.minere:pulsar.name")],
      },
      {
        title: "guide.minere.items.crafts",
        entries: [
          "item.phased_ender_pearl.name",
          "tile.minere:plasma_ball.name",
          "tile.minere:pulsar.name",
          "tile.end_rod.name",
        ],
      },
      {
        title: "guide.minere.items.ore",
        entries: ["guide.minere.items.ender_plasma.ore"],
      },
      {
        title: "guide.minere.items.dropped_by",
        entries: ["guide.minere.items.ender_plasma.dropped_by"],
      },
    ],
  },
  {
    itemId: "minere:raw_indigon",
    name: "item.minere:raw_indigon",
    iconPath: "textures/items/minere/raw_indigon",
    sections: [
      {
        title: "guide.minere.items.ore",
        entries: ["guide.minere.items.raw_indigon.ore"],
      },
      {
        title: "guide.minere.blocks.smelts_into",
        entries: ["item.minere:indigon_ingot"],
      },
      {
        title: "guide.minere.items.crafts",
        entries: ["tile.minere:raw_indigon_block.name"],
      },
    ],
  },
  {
    itemId: "minere:indigon_ingot",
    name: "item.minere:indigon_ingot",
    iconPath: "textures/items/minere/indigon_ingot",
    sections: [
      {
        title: "guide.minere.crafting",
        entries: [craftingIngredient("tile.minere:indigon_block.name")],
      },
      {
        title: "guide.minere.items.crafts",
        entries: [
          "guide.minere.equipment.indigon_armor",
          "guide.minere.equipment.indigon_tools",
          "item.minere:indigon_treecapitator",
          "item.minere:shadow_staff",
          "item.minere:indigon_apple",
          "item.minere:enchanted_indigon_apple",
          "tile.minere:indigon_block.name",
          "item.minere:indigon_bear_armor",
          "item.minere:indigon_elephant_armor",
        ],
      },
      {
        title: "guide.minere.items.ore",
        entries: ["guide.minere.items.indigon_ingot.ore"],
      },
    ],
  },
  {
    itemId: "minere:nether_coal",
    name: "item.nether_coal.name",
    iconPath: "textures/items/minere/nether_coal",
    sections: [
      {
        title: "guide.minere.items.fuel",
        entries: ["guide.minere.items.nether_coal.fuel_items"],
      },
      {
        title: "guide.minere.crafting",
        entries: [craftingIngredient("tile.minere:nether_coal_block.name")],
      },
      {
        title: "guide.minere.items.crafts",
        entries: ["guide.minere.items.nether_coal.crafts"],
      },
      {
        title: "guide.minere.items.ore",
        entries: ["guide.minere.items.nether_coal.ore"],
      },
      {
        title: "guide.minere.items.dropped_by",
        entries: ["guide.minere.items.nether_coal.dropped_by"],
      },
    ],
  },
];

const totemDefinitions: GuideItemPageDefinition[] = [
  {
    itemId: "minere:inferno_totem",
    name: "item.minere:inferno_totem",
    iconPath: "textures/items/minere/inferno_totem",
    sections: [
      {
        title: "guide.minere.items.description",
        entries: ["guide.minere.items.inferno_totem.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.netherite_scrap.name"),
          craftingIngredient("item.gold_ingot.name"),
          craftingIngredient("item.blaze_rod.name", 3),
        ],
      },
    ],
  },
  {
    itemId: "minere:glacier_totem",
    name: "item.minere:glacier_totem",
    iconPath: "textures/items/minere/glacier_totem",
    sections: [
      {
        title: "guide.minere.items.description",
        entries: ["guide.minere.items.glacier_totem.description"],
      },
      {
        title: "guide.minere.crafting",
        entries: [
          craftingIngredient("item.ice_charge.name", 6),
          craftingIngredient("item.diamond.name"),
          craftingIngredient("item.gold_ingot.name"),
          craftingIngredient("item.amethyst_shard.name"),
        ],
      },
    ],
  },
];

const pages = new Map(
  [...bombDefinitions, ...itemDefinitions, ...totemDefinitions].map(
    (definition) => [definition.itemId, createItemPage(definition)],
  ),
);

function createItemButton(definition: GuideItemPageDefinition) {
  return {
    text: { translate: definition.name },
    iconPath: definition.iconPath,
    show: (player: Player, onBack: () => void) => {
      const page = pages.get(definition.itemId);
      if (page) {
        page.show(player, onBack);
      }
    },
  };
}

const bombsPage = new ItemPage({
  title: { translate: "guide.minere.items.bombs" },
  buttons: bombDefinitions.map(createItemButton),
});

const totemsPage = new ItemPage({
  title: { translate: "guide.minere.items.totems" },
  buttons: totemDefinitions.map(createItemButton),
});

const itemsPage = new ItemPage({
  title: { translate: "guide.minere.section.items" },
  buttons: [
    {
      text: { translate: "guide.minere.items.bombs" },
      iconPath: "textures/items/minere/bomb",
      show: (player: Player, onBack: () => void) =>
        bombsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.items.totems" },
      iconPath: "textures/items/minere/inferno_totem",
      show: (player: Player, onBack: () => void) =>
        totemsPage.show(player, onBack),
    },
    ...itemDefinitions.map(createItemButton),
  ],
});

export function showItemsPage(player: Player, onBack: () => void): void {
  itemsPage.show(player, onBack);
}
