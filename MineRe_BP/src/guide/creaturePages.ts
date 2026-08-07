import { GameMode, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  DiscoveryCategory,
  GUIDE_DISCOVERY_TOTALS,
  GuideCreature,
  getDiscoveredCount,
  getDiscoveryLevel,
  getGuideCreatures,
} from "guide/discovery";
import { EntityPage } from "guide/entityPage";

const HUNGER_GLYPH = `${String.fromCharCode(167)}6${String.fromCodePoint(0xe100)}${String.fromCharCode(167)}r`;

const moosePage = new EntityPage({
  name: { translate: "entity.minere:moose.name" },
  imagePath: "textures/guide/animals/moose",
  maxHealth: [40, 80],
  attack: 5,
  description: { translate: "guide.minere.entity.moose.description" },
  itemGroups: [
    {
      title: { translate: "guide.minere.entity.tame" },
      items: [
        { text: "guide.minere.item.apple", iconPath: "textures/items/apple" },
        {
          text: "guide.minere.item.golden_apple",
          iconPath: "textures/items/apple_golden",
        },
        {
          text: "guide.minere.item.dried_kelp_block",
          iconPath: "textures/blocks/dried_kelp_top",
        },
        {
          text: "guide.minere.item.hay_block",
          iconPath: "textures/blocks/hay_block_side",
        },
        {
          text: "guide.minere.item.melon_slice",
          iconPath: "textures/items/melon",
        },
        {
          text: "guide.minere.item.glistering_melon_slice",
          iconPath: "textures/items/melon_speckled",
        },
      ],
    },
    {
      title: { translate: "guide.minere.entity.breed" },
      items: [
        {
          text: "guide.minere.item.golden_apple",
          iconPath: "textures/items/apple_golden",
        },
        {
          text: "guide.minere.item.glistering_melon_slice",
          iconPath: "textures/items/melon_speckled",
        },
      ],
    },
  ],
  equipment: [
    {
      items: [
        { text: "guide.minere.item.saddle", iconPath: "textures/items/saddle" },
        { text: "guide.minere.item.chest", iconPath: "textures/items/chest" },
      ],
    },
  ],
  experience: [3, 10],
  drops: [
    {
      text: "guide.minere.entity.drop.leather_2_4",
      iconPath: "textures/items/leather",
    },
    {
      text: "guide.minere.entity.drop.venison_3_7",
      iconPath: "textures/items/minere/venison",
    },
    {
      text: "guide.minere.entity.drop.bone_0_2",
      iconPath: "textures/items/bone",
    },
  ],
});

const deerPage = new EntityPage({
  name: { translate: "entity.minere:deer.name" },
  imagePath: "textures/guide/animals/deer",
  maxHealth: 14,
  description: { translate: "guide.minere.entity.deer.description" },
  itemGroups: [
    {
      title: { translate: "guide.minere.entity.tame_breed" },
      items: [
        { text: "guide.minere.item.apple", iconPath: "textures/items/apple" },
      ],
    },
  ],
  experience: [1, 5],
  drops: [
    {
      text: "guide.minere.entity.drop.leather_0_2",
      iconPath: "textures/items/leather",
    },
    {
      text: "guide.minere.entity.drop.venison_1_2",
      iconPath: "textures/items/minere/venison",
    },
  ],
});

const vampirePage = new EntityPage({
  name: { translate: "entity.minere:vampire.name" },
  imagePath: "textures/guide/monsters/vampire",
  maxHealth: 40,
  attack: [6, 7],
  effects: [
    { glyph: HUNGER_GLYPH, effectKey: "hunger_i", durationSeconds: 10 },
  ],
  description: { translate: "guide.minere.entity.vampire.description" },
  experience: 10,
  drops: [
    {
      text: "guide.minere.entity.drop.redstone_0_2",
      iconPath: "textures/items/redstone_dust",
    },
    {
      text: "guide.minere.entity.drop.bone_0_2",
      iconPath: "textures/items/bone",
    },
  ],
});

const grizzlyBearPage = new EntityPage({
  name: { translate: "entity.minere:grizzly_bear.name" },
  imagePath: "textures/guide/animals/grizzly_bear",
  maxHealth: [60, 120],
  attack: [7, 16],
  description: { translate: "guide.minere.entity.grizzly_bear.description" },
  itemGroups: [
    {
      title: { translate: "guide.minere.entity.tame" },
      items: [
        {
          text: "guide.minere.item.salmon",
          iconPath: "textures/items/fish/salmon_raw",
        },
        { text: "guide.minere.item.cod", iconPath: "textures/items/fish/cod" },
        {
          text: "guide.minere.item.honeycomb",
          iconPath: "textures/items/honeycomb",
        },
        {
          text: "guide.minere.item.honey_block",
          iconPath: "textures/blocks/honey_top",
        },
        {
          text: "guide.minere.item.honey_bottle",
          iconPath: "textures/items/honey_bottle",
        },
      ],
    },
    {
      title: { translate: "guide.minere.entity.breed" },
      items: [
        {
          text: "guide.minere.item.honey_block",
          iconPath: "textures/blocks/honey_top",
        },
      ],
    },
  ],
  equipment: [
    {
      items: [
        {
          text: "guide.minere.entity.bear_armor",
          iconPath: "textures/items/minere/copper_bear_armor",
        },
        {
          text: "guide.minere.entity.bear_armor.remove",
          iconPath: "textures/items/shears",
        },
      ],
    },
  ],
  experience: 7,
  drops: [
    {
      text: "guide.minere.entity.drop.leather_3_5",
      iconPath: "textures/items/leather",
    },
    {
      text: "guide.minere.entity.drop.salmon_0_2",
      iconPath: "textures/items/fish/salmon_raw",
    },
    {
      text: "guide.minere.entity.drop.sweet_berries_0_2",
      iconPath: "textures/items/sweet_berries",
    },
    {
      text: "guide.minere.entity.drop.honeycomb_0_2",
      iconPath: "textures/items/honeycomb",
    },
    {
      text: "guide.minere.entity.drop.bone_0_2",
      iconPath: "textures/items/bone",
    },
  ],
});

const entityPages = new Map<string, EntityPage>([
  ["minere:moose", moosePage],
  ["minere:deer", deerPage],
  ["minere:vampire", vampirePage],
  ["minere:grizzly_bear", grizzlyBearPage],
]);

const categoryFallbackIcons: Record<DiscoveryCategory, string> = {
  animals: "textures/guide/animals/deer",
  monsters: "textures/guide/monsters/ogre",
  bosses: "textures/guide/bosses/inferno",
};

const guideImagePaths: Partial<Record<string, string>> = {
  "minere:bird": "textures/guide/animals/bird",
  "minere:black_bear": "textures/guide/animals/black_bear",
  "minere:butterfly": "textures/guide/animals/butterfly",
  "minere:deer": "textures/guide/animals/deer",
  "minere:eagle": "textures/guide/animals/eagle",
  "minere:elephant": "textures/guide/animals/elephant",
  "minere:firefly": "textures/guide/animals/firefly",
  "minere:grizzly_bear": "textures/guide/animals/grizzly_bear",
  "minere:monkey": "textures/guide/animals/monkey",
  "minere:moose": "textures/guide/animals/moose",
  "minere:owl": "textures/guide/animals/owl",
  "minere:queen_bee": "textures/guide/monsters/queen_bee",
  "minere:rat": "textures/guide/animals/rat",
  "minere:squirrel": "textures/guide/animals/squirrel",
  "minere:whale": "textures/guide/animals/whale",
  "minere:biter": "textures/guide/monsters/biter",
  "minere:cosmic_jelly": "textures/guide/monsters/cosmic_jelly",
  "minere:demon": "textures/guide/monsters/demon",
  "minere:demon_skull": "textures/guide/monsters/demon_skull",
  "minere:dire_wolf": "textures/guide/monsters/dire_wolf",
  "minere:ender_phantom": "textures/guide/monsters/ender_phantom",
  "minere:freeze": "textures/guide/monsters/freeze",
  "minere:ghost": "textures/guide/monsters/ghost",
  "minere:goblin": "textures/guide/monsters/goblin",
  "minere:gremlin": "textures/guide/monsters/gremlin",
  "minere:lizord": "textures/guide/monsters/lizord",
  "minere:monster_bat": "textures/guide/monsters/monster_bat",
  "minere:necromancer": "textures/guide/monsters/necromancer",
  "minere:netherzord": "textures/guide/monsters/netherzord",
  "minere:ogre": "textures/guide/monsters/ogre",
  "minere:scorpion": "textures/guide/monsters/scorpion",
  "minere:stomp": "textures/guide/monsters/stomp",
  "minere:vampire": "textures/guide/monsters/vampire",
  "minere:walker": "textures/guide/monsters/walker",
  "minere:web_spider": "textures/guide/monsters/web_spider",
  "minere:yeti": "textures/guide/monsters/yeti",
  "minere:inferno": "textures/guide/bosses/inferno",
  "minere:glacier": "textures/guide/bosses/glacier",
};

function getEntityIcon(creature: GuideCreature): string {
  return (
    guideImagePaths[creature.typeId] ?? categoryFallbackIcons[creature.category]
  );
}

export function showCreatureSection(
  player: Player,
  section: DiscoveryCategory,
  onBack: () => void,
): void {
  const creatures = getGuideCreatures(section).filter(
    (creature) =>
      player.getGameMode() === GameMode.Creative ||
      getDiscoveryLevel(player, creature.typeId) > 0,
  );
  const form = new ActionFormData().title({
    translate: `guide.minere.section.${section}`,
  });

  if (section === "animals" || section === "monsters" || section === "bosses") {
    form.label({
      translate: "guide.minere.section.discovered_total",
      with: [
        getDiscoveredCount(player, section).toString(),
        GUIDE_DISCOVERY_TOTALS[section].toString(),
      ],
    });
  }

  if (creatures.length === 0) {
    form.label({ translate: "guide.minere.entity.none_discovered" });
  }
  for (const creature of creatures) {
    form.button(
      { translate: `entity.${creature.typeId}.name` },
      getEntityIcon(creature),
    );
  }
  form.button({ translate: "guide.minere.back" });
  form
    .show(player)
    .then((response) => {
      if (response.canceled || response.selection === undefined) {
        return;
      }
      if (response.selection === creatures.length) {
        onBack();
        return;
      }
      const creature = creatures[response.selection];
      if (
        creature.category !== "animals" &&
        getDiscoveryLevel(player, creature.typeId) === 1
      ) {
        showLimitedEntityPage(player, creature, () =>
          showCreatureSection(player, section, onBack),
        );
        return;
      }
      const page = entityPages.get(creature.typeId);
      if (page) {
        page.show(player, () => showCreatureSection(player, section, onBack));
        return;
      }
      showUnavailableEntityPage(player, creature, () =>
        showCreatureSection(player, section, onBack),
      );
    })
    .catch((error) =>
      console.error("Failed to show creature section: " + error),
    );
}

function showLimitedEntityPage(
  player: Player,
  creature: GuideCreature,
  onBack: () => void,
): void {
  new ActionFormData()
    .title({ translate: `entity.${creature.typeId}.name` })
    .body({ translate: "guide.minere.entity.not_defeated" })
    .button({ translate: "guide.minere.back" })
    .show(player)
    .then((response) => {
      if (!response.canceled) {
        onBack();
      }
    })
    .catch((error) =>
      console.error("Failed to show limited entity page: " + error),
    );
}

function showUnavailableEntityPage(
  player: Player,
  creature: GuideCreature,
  onBack: () => void,
): void {
  new ActionFormData()
    .title({ translate: `entity.${creature.typeId}.name` })
    .body({ translate: "guide.minere.entity.page_coming_soon" })
    .button({ translate: "guide.minere.back" })
    .show(player)
    .then((response) => {
      if (!response.canceled) {
        onBack();
      }
    })
    .catch((error) => console.error("Failed to show entity page: " + error));
}
