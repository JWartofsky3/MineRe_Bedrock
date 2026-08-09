import { GameMode, Player, RawMessage } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  DiscoveryCategory,
  GUIDE_DISCOVERY_TOTALS,
  GuideCreature,
  getDiscoveredCount,
  getDiscoveryLevel,
  getGuideCreatures,
} from "guide/discovery";
import { EntityPage, EntityPageEffect } from "guide/entityPage";

const HUNGER_GLYPH = `${String.fromCharCode(167)}6${String.fromCodePoint(0xe100)}${String.fromCharCode(167)}r`;
const WEAKNESS_GLYPH = `${String.fromCharCode(167)}7${String.fromCodePoint(0xe10c)}${String.fromCharCode(167)}r`;

const moosePage = new EntityPage({
  name: { translate: "entity.minere:moose.name" },
  imagePath: "textures/guide/animals/moose",
  maxHealth: [40, 80],
  attack: 5,
  description: { translate: "guide.minere.entity.moose.description" },
  spawning: [
    { translate: "guide.minere.entity.moose.spawn.taiga" },
    { translate: "guide.minere.entity.moose.spawn.grove" },
    { translate: "guide.minere.entity.moose.spawn.snowy_plains" },
  ],
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
          iconPath: "textures/items/dried_kelp",
        },
        {
          text: "guide.minere.item.hay_block",
          iconPath: "textures/items/hay_block",
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
  spawning: [
    { translate: "guide.minere.entity.deer.spawn.animal_biomes" },
    { translate: "guide.minere.entity.deer.spawn.grass" },
  ],
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
  spawning: [
    { translate: "guide.minere.entity.vampire.spawn.dripstone_caves" },
    { translate: "guide.minere.entity.vampire.spawn.underground" },
  ],
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
  abilities: [
    "guide.minere.entity.vampire.abilities.0",
    "guide.minere.entity.vampire.abilities.1",
    "guide.minere.entity.vampire.abilities.2",
  ],
});

const grizzlyBearPage = new EntityPage({
  name: { translate: "entity.minere:grizzly_bear.name" },
  imagePath: "textures/guide/animals/grizzly_bear",
  maxHealth: [60, 120],
  healthVariants: [
    { value: 60, label: "guide.minere.entity.variant.wild" },
    { value: 120, label: "guide.minere.entity.variant.tamed" },
  ],
  attack: [7, 16],
  attackVariants: [
    { value: 7, label: "guide.minere.entity.variant.wild" },
    { value: 16, label: "guide.minere.entity.variant.tamed" },
  ],
  description: { translate: "guide.minere.entity.grizzly_bear.description" },
  spawning: [
    { translate: "guide.minere.entity.grizzly_bear.spawn.taiga" },
    { translate: "guide.minere.entity.grizzly_bear.spawn.forest" },
    { translate: "guide.minere.entity.grizzly_bear.spawn.grove" },
    { translate: "guide.minere.entity.grizzly_bear.spawn.mountains" },
  ],
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
          iconPath: "textures/items/honey_bottle",
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
          iconPath: "textures/items/honey_bottle",
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
          text: "guide.minere.item.shears",
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

type BasicGuidePage = {
  health: number | readonly [number, number];
  healthVariants?: readonly { value: number; label: string }[];
  attack?: number | readonly [number, number];
  attackVariants?: readonly {
    value: number | readonly [number, number];
    label: string;
  }[];
  effects?: EntityPageEffect[];
  spawning: number;
  variants?: number;
  tameItems?: number;
  breedItems?: number;
  abilities?: number;
  weaknesses?: number;
  extra?: number;
  equipment?: number;
  experience?: number | readonly [number, number];
  drops?: number;
};

const basicGuidePages: Readonly<Record<string, BasicGuidePage>> = {
  "minere:bird": {
    health: 6,
    spawning: 6,
    tameItems: 1,
    drops: 1,
  },
  "minere:black_bear": {
    health: 40,
    attack: 6,
    spawning: 3,
    drops: 2,
  },
  "minere:butterfly": {
    health: 6,
    spawning: 9,
    breedItems: 2,
  },
  "minere:eagle": {
    health: 20,
    attack: 6,
    spawning: 7,
    drops: 2,
  },
  "minere:elephant": {
    health: [150, 300],
    healthVariants: [
      { value: 150, label: "guide.minere.entity.variant.wild" },
      { value: 300, label: "guide.minere.entity.variant.tamed" },
    ],
    attack: [10, 32],
    attackVariants: [
      { value: [10, 20], label: "guide.minere.entity.variant.wild" },
      { value: [16, 32], label: "guide.minere.entity.variant.tamed" },
    ],
    spawning: 3,
    tameItems: 5,
    breedItems: 1,
    equipment: 4,
    abilities: 1,
    drops: 3,
  },
  "minere:firefly": {
    health: 6,
    spawning: 10,
    breedItems: 3,
    variants: 4,
    extra: 1,
  },
  "minere:monkey": {
    health: 12,
    attack: 2,
    spawning: 1,
    variants: 6,
    tameItems: 1,
    breedItems: 1,
    equipment: 2,
    abilities: 6,
    extra: 1,
  },
  "minere:owl": {
    health: 10,
    spawning: 2,
    tameItems: 1,
    drops: 2,
  },
  "minere:queen_bee": {
    health: 30,
    attack: 4,
    spawning: 2,
    drops: 1,
  },
  "minere:rat": {
    health: 6,
    attack: 2,
    spawning: 10,
    tameItems: 7,
  },
  "minere:squirrel": {
    health: 3,
    spawning: 6,
    breedItems: 1,
    drops: 1,
  },
  "minere:whale": {
    health: 100,
    spawning: 1,
    drops: 1,
  },
  "minere:biter": {
    health: 20,
    attack: 5,
    spawning: 2,
    drops: 2,
  },
  "minere:cosmic_jelly": {
    health: 20,
    attack: 4,
    spawning: 1,
    drops: 3,
  },
  "minere:demon": {
    health: 100,
    attack: [8, 12],
    spawning: 3,
    drops: 4,
    abilities: 3,
  },
  "minere:demon_skull": {
    health: 6,
    attack: 3,
    spawning: 2,
  },
  "minere:dire_wolf": {
    health: 40,
    attack: 6,
    spawning: 4,
    drops: 3,
  },
  "minere:ender_phantom": {
    health: 28,
    attack: 8,
    spawning: 2,
    abilities: 2,
    drops: 2,
  },
  "minere:freeze": {
    health: 30,
    attack: 4,
    spawning: 3,
    drops: 2,
    abilities: 1,
    weaknesses: 1,
  },
  "minere:ghost": {
    health: 14,
    attack: 6,
    spawning: 2,
    weaknesses: 1,
  },
  "minere:goblin": {
    health: 14,
    attack: 2,
    spawning: 8,
    abilities: 3,
    variants: 5,
    drops: 1,
  },
  "minere:gremlin": {
    health: 16,
    attack: 4,
    spawning: 3,
    drops: 1,
    weaknesses: 2,
  },
  "minere:lizord": {
    health: 70,
    attack: [7, 9],
    spawning: 2,
    drops: 2,
  },
  "minere:monster_bat": {
    health: 10,
    attack: [2, 3],
    spawning: 5,
    weaknesses: 1,
  },
  "minere:necromancer": {
    health: 28,
    abilities: 6,
    spawning: 2,
    drops: 3,
  },
  "minere:netherzord": {
    health: 120,
    attack: [9, 12],
    spawning: 2,
    drops: 3,
  },
  "minere:ogre": {
    health: 120,
    attack: [4, 7],
    spawning: 6,
    drops: 5,
    abilities: 2,
  },
  "minere:scorpion": {
    health: 30,
    attack: 5,
    spawning: 3,
    drops: 3,
  },
  "minere:stomp": {
    health: 40,
    attack: 6,
    spawning: 3,
    drops: 3,
  },
  "minere:walker": {
    health: 150,
    attack: [7, 10],
    tameItems: 1,
    spawning: 2,
    drops: 3,
    abilities: 2,
  },
  "minere:web_spider": {
    health: 40,
    attack: [6, 7],
    effects: [
      { glyph: WEAKNESS_GLYPH, effectKey: "weakness_i", durationSeconds: 6 },
    ],
    spawning: 1,
    drops: 2,
  },
  "minere:yeti": {
    health: 100,
    attack: [6, 9],
    spawning: 4,
    tameItems: 1,
    drops: 4,
    abilities: 4,
    weaknesses: 1,
  },
  "minere:inferno": {
    health: 300,
    attack: 9,
    spawning: 2,
    drops: 4,
    abilities: 5,
    weaknesses: 1,
  },
  "minere:glacier": {
    health: 600,
    attack: 7,
    spawning: 2,
    drops: 6,
    abilities: 7,
    weaknesses: 3,
  },
};

function guideEntityContentKey(
  typeId: string,
  section: string,
  index?: number,
): string {
  const entityId = typeId.replace("minere:", "");
  return `guide.minere.entity.${entityId}.${section}${
    index === undefined ? "" : `.${index}`
  }`;
}

function guideEntityContentEntries(
  typeId: string,
  section: string,
  count: number | undefined,
): string[] | undefined {
  if (count === undefined) {
    return undefined;
  }
  return Array.from({ length: count }, (_, index) =>
    guideEntityContentKey(typeId, section, index),
  );
}

for (const [typeId, page] of Object.entries(basicGuidePages)) {
  entityPages.set(
    typeId,
    new EntityPage({
      name: { translate: `entity.${typeId}.name` },
      imagePath: guideImagePaths[typeId]!,
      maxHealth: page.health,
      healthVariants: page.healthVariants,
      attack: page.attack,
      attackVariants: page.attackVariants,
      effects: page.effects,
      description: guideEntityContentKey(typeId, "description"),
      variants: guideEntityContentEntries(typeId, "variants", page.variants),
      spawning:
        guideEntityContentEntries(typeId, "spawning", page.spawning) ?? [],
      itemGroups:
        page.tameItems || page.breedItems
          ? [
              ...(page.tameItems
                ? [
                    {
                      title: "guide.minere.entity.tame",
                      items: guideEntityContentEntries(
                        typeId,
                        "tame",
                        page.tameItems,
                      )!.map((text) => ({
                        text,
                        iconPath: "",
                      })),
                    },
                  ]
                : []),
              ...(page.breedItems
                ? [
                    {
                      title: "guide.minere.entity.breed",
                      items: guideEntityContentEntries(
                        typeId,
                        "breed",
                        page.breedItems,
                      )!.map((text) => ({
                        text,
                        iconPath: "",
                      })),
                    },
                  ]
                : []),
            ]
          : undefined,
      equipment: page.equipment
        ? [
            {
              items: guideEntityContentEntries(
                typeId,
                "equipment",
                page.equipment,
              )!.map((text) => ({
                text,
                iconPath: "",
              })),
            },
          ]
        : undefined,
      abilities: guideEntityContentEntries(typeId, "abilities", page.abilities),
      weaknesses: guideEntityContentEntries(
        typeId,
        "weaknesses",
        page.weaknesses,
      ),
      experience: page.experience,
      drops: page.drops
        ? guideEntityContentEntries(typeId, "drops", page.drops)!.map(
            (text) => ({
              text,
              iconPath: "",
            }),
          )
        : undefined,
      extra:
        typeId === "minere:firefly"
          ? [
              {
                translate: guideEntityContentKey(typeId, "extra", 0),
                with: [
                  `${String.fromCharCode(167)}aFirefly Lamp${String.fromCharCode(167)}r`,
                ],
              },
            ]
          : guideEntityContentEntries(typeId, "extra", page.extra),
    }),
  );
}

function getEntityIcon(
  player: Player,
  creature: GuideCreature,
): string | undefined {
  if (
    creature.category === "bosses" &&
    player.getGameMode() !== GameMode.Creative &&
    getDiscoveryLevel(player, creature.typeId) < 2
  ) {
    return undefined;
  }
  return getGuideCreatureIcon(creature);
}

export function getGuideCreatureIcon(creature: GuideCreature): string {
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
      creature.category === "bosses" ||
      getDiscoveryLevel(player, creature.typeId) > 0,
  );
  const form = new ActionFormData().title({
    translate: `guide.minere.section.${section}`,
  });

  if (
    player.getGameMode() !== GameMode.Creative &&
    (section === "animals" || section === "monsters")
  ) {
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
    const icon = getEntityIcon(player, creature);
    if (icon) {
      form.button({ translate: `entity.${creature.typeId}.name` }, icon);
    } else {
      form.button({ translate: `entity.${creature.typeId}.name` });
    }
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
      const discoveryLevel = getDiscoveryLevel(player, creature.typeId);
      if (
        creature.category === "bosses" &&
        player.getGameMode() !== GameMode.Creative &&
        discoveryLevel < 2
      ) {
        const legend: RawMessage = {
          rawtext: [
            {
              translate: `guide.minere.entity.${creature.typeId.split(":")[1]}.legend`,
            },
            ...(discoveryLevel === 1
              ? [
                  { text: "\n\n" },
                  { translate: "guide.minere.entity.boss_defeat_prompt" },
                ]
              : []),
          ],
        };
        showCreatureMessagePage(player, creature, legend, () =>
          showCreatureSection(player, section, onBack),
        );
        return;
      }
      if (
        creature.category !== "animals" &&
        player.getGameMode() !== GameMode.Creative &&
        discoveryLevel === 1
      ) {
        showCreatureMessagePage(
          player,
          creature,
          "guide.minere.entity.not_defeated",
          () => showCreatureSection(player, section, onBack),
        );
        return;
      }
      const page = entityPages.get(creature.typeId);
      if (page) {
        page.show(player, () => showCreatureSection(player, section, onBack));
        return;
      }
      showCreatureMessagePage(
        player,
        creature,
        "guide.minere.entity.page_coming_soon",
        () => showCreatureSection(player, section, onBack),
      );
    })
    .catch((error) =>
      console.error("Failed to show creature section: " + error),
    );
}

function showCreatureMessagePage(
  player: Player,
  creature: GuideCreature,
  message: RawMessage | string,
  onBack: () => void,
): void {
  new ActionFormData()
    .title({ translate: `entity.${creature.typeId}.name` })
    .body(typeof message === "string" ? { translate: message } : message)
    .button({ translate: "guide.minere.back" })
    .show(player)
    .then((response) => {
      if (!response.canceled) {
        onBack();
      }
    })
    .catch((error) => console.error("Failed to show entity page: " + error));
}
