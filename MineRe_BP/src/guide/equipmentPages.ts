import { GameMode, Player, RawMessage } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  DISCOVERABLE_EQUIPMENT,
  getDiscoveredEquipmentCount,
  hasDiscoveredEquipment,
} from "guide/equipmentDiscovery";
import { craftingIngredient } from "guide/crafting";

type EquipmentPageText = RawMessage | string;

interface EquipmentPageButton {
  text: EquipmentPageText;
  iconPath: string;
  show: (player: Player, onBack: () => void) => void;
  getText?: (player: Player) => EquipmentPageText;
  requiredItemId?: string;
  progressTranslation?: string;
  progressItemIds?: readonly string[];
}

interface ItemPageOptions {
  title: EquipmentPageText;
  entries?: EquipmentPageText[];
  sections?: EquipmentPageSection[];
  buttons?: EquipmentPageButton[];
  emptyMessage?: EquipmentPageText;
}

interface EquipmentPageSection {
  title: EquipmentPageText;
  entries: EquipmentPageText[];
}

/** A standard ActionForm page used for text-only item sets and categories. */
export class ItemPage {
  constructor(private readonly options: ItemPageOptions) {}

  show(player: Player, onBack: () => void): void {
    const entries = this.options.entries ?? [];
    const buttons = (this.options.buttons ?? []).filter((button) => {
      if (player.getGameMode() === GameMode.Creative) {
        return true;
      }

      return (
        !button.requiredItemId ||
        hasDiscoveredEquipment(player, button.requiredItemId)
      );
    });
    const form = new ActionFormData().title(this.options.title);

    for (const entry of entries) {
      form.label(entry);
    }
    for (const section of this.options.sections ?? []) {
      form.divider();
      form.header(section.title);
      for (const entry of section.entries) {
        form.label(entry);
      }
    }
    if (
      buttons.length === 0 &&
      (this.options.emptyMessage || this.options.buttons?.length)
    ) {
      form.label(
        this.options.emptyMessage ?? {
          translate: "guide.minere.equipment.none_discovered",
        },
      );
    }
    for (const button of buttons) {
      const text =
        button.getText?.(player) ??
        (player.getGameMode() !== GameMode.Creative &&
        button.progressTranslation &&
        button.progressItemIds
          ? {
              translate: button.progressTranslation,
              with: [
                getDiscoveredEquipmentCount(
                  player,
                  button.progressItemIds,
                ).toString(),
                button.progressItemIds.length.toString(),
              ],
            }
          : button.text);
      form.button(text, button.iconPath);
    }
    form.button({ translate: "guide.minere.back" });
    form
      .show(player)
      .then((response) => {
        if (response.canceled || response.selection === undefined) {
          return;
        }
        if (response.selection === buttons.length) {
          onBack();
          return;
        }
        buttons[response.selection].show(player, () =>
          this.show(player, onBack),
        );
      })
      .catch((error) =>
        console.error("Failed to show equipment page: " + error),
      );
  }
}

function magicItemButton(
  itemId: string,
  imagePath: string,
  sections: EquipmentPageSection[] = [],
  obtainedFrom: string[] = [],
): EquipmentPageButton {
  const page = new ItemPage({
    title: { translate: `item.${itemId}` },
    sections: [
      ...sections,
      ...(obtainedFrom.length > 0
        ? [
            {
              title: { translate: "guide.minere.obtained_from" },
              entries: obtainedFrom.map((entry) => ({ translate: entry })),
            },
          ]
        : []),
    ],
  });
  return {
    text: { translate: `item.${itemId}` },
    iconPath: imagePath,
    requiredItemId: itemId,
    show: (player, onBack) => page.show(player, onBack),
  };
}

const magicStavesPage = new ItemPage({
  title: { translate: "guide.minere.equipment.magic_staves" },
  emptyMessage: {
    translate: "guide.minere.equipment.magic_staves.none_discovered",
  },
  buttons: [
    magicItemButton(
      "minere:amethyst_staff",
      "textures/items/minere/amethyst_staff",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["3"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["384"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.primary_ability" },
          entries: [
            { translate: "guide.minere.equipment.staff.amethyst.primary" },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.sneak_ability" },
          entries: [
            { translate: "guide.minere.equipment.staff.amethyst.sneak" },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.ammunition" },
          entries: [
            { translate: "guide.minere.equipment.staff.amethyst.ammunition" },
          ],
        },
        {
          title: { translate: "guide.minere.crafting" },
          entries: [
            craftingIngredient("item.breeze_rod.name", 2),
            craftingIngredient("item.amethyst_shard.name", 3),
          ],
        },
      ],
    ),
    magicItemButton(
      "minere:blaster_staff",
      "textures/items/minere/blaster_staff",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["2"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["1024"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.primary_ability" },
          entries: [
            { translate: "guide.minere.equipment.staff.blaster.primary" },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.ammunition" },
          entries: [
            { translate: "guide.minere.equipment.staff.blaster.ammunition" },
          ],
        },
        {
          title: { translate: "guide.minere.crafting" },
          entries: [
            craftingIngredient("tile.minere:enderon_block.name", 2),
            craftingIngredient("item.phased_ender_pearl.name"),
            craftingIngredient("item.minere:enderon_gemstone", 2),
            craftingIngredient("tile.end_rod.name", 2),
          ],
        },
      ],
    ),
    magicItemButton("minere:echo_staff", "textures/items/minere/echo_staff", [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.attack_damage",
            with: ["2"],
          },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: ["1024"],
          },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.primary_ability" },
        entries: [{ translate: "guide.minere.equipment.staff.echo.primary" }],
      },
      {
        title: { translate: "guide.minere.equipment.sneak_ability" },
        entries: [{ translate: "guide.minere.equipment.staff.echo.sneak" }],
      },
      {
        title: { translate: "guide.minere.equipment.ammunition" },
        entries: [
          { translate: "guide.minere.equipment.staff.echo.ammunition" },
        ],
      },
      {
        title: { translate: "guide.minere.crafting" },
        entries: [
          craftingIngredient("item.breeze_rod.name", 2),
          craftingIngredient("item.echo_shard.name", 5),
        ],
      },
    ]),
    magicItemButton(
      "minere:emerald_staff",
      "textures/items/minere/emerald_staff",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["3"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["512"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.primary_ability" },
          entries: [
            { translate: "guide.minere.equipment.staff.emerald.primary" },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.ammunition" },
          entries: [
            { translate: "guide.minere.equipment.staff.emerald.ammunition" },
          ],
        },
        {
          title: { translate: "guide.minere.crafting" },
          entries: [
            craftingIngredient("item.blaze_rod.name", 2),
            craftingIngredient("item.emerald.name", 2),
            craftingIngredient("tile.emerald_block.name"),
          ],
        },
      ],
    ),
    magicItemButton("minere:fire_staff", "textures/items/minere/fire_staff", [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.attack_damage",
            with: ["2"],
          },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: ["2048"],
          },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.primary_ability" },
        entries: [{ translate: "guide.minere.equipment.staff.fire.primary" }],
      },
      {
        title: { translate: "guide.minere.equipment.sneak_ability" },
        entries: [{ translate: "guide.minere.equipment.staff.fire.sneak" }],
      },
      {
        title: { translate: "guide.minere.equipment.ammunition" },
        entries: [
          { translate: "guide.minere.equipment.staff.fire.ammunition" },
        ],
      },
      {
        title: { translate: "guide.minere.crafting" },
        entries: [
          craftingIngredient("item.blaze_rod.name", 4),
          craftingIngredient("item.netherite_ingot.name", 2),
          craftingIngredient("item.ender_eye.name"),
        ],
      },
    ]),
    magicItemButton("minere:ice_staff", "textures/items/minere/ice_staff", [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.attack_damage",
            with: ["3"],
          },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: ["512"],
          },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.primary_ability" },
        entries: [{ translate: "guide.minere.equipment.staff.ice.primary" }],
      },
      {
        title: { translate: "guide.minere.equipment.sneak_ability" },
        entries: [{ translate: "guide.minere.equipment.staff.ice.sneak" }],
      },
      {
        title: { translate: "guide.minere.equipment.ammunition" },
        entries: [{ translate: "guide.minere.equipment.staff.ice.ammunition" }],
      },
      {
        title: { translate: "guide.minere.crafting" },
        entries: [
          craftingIngredient("item.breeze_rod.name", 2),
          craftingIngredient("item.ice_charge.name", 2),
          craftingIngredient("tile.diamond_block.name"),
        ],
      },
    ]),
    magicItemButton(
      "minere:shadow_staff",
      "textures/items/minere/shadow_staff",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["4"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["512"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.primary_ability" },
          entries: [
            { translate: "guide.minere.equipment.staff.shadow.primary" },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.sneak_ability" },
          entries: [{ translate: "guide.minere.equipment.staff.shadow.sneak" }],
        },
        {
          title: { translate: "guide.minere.equipment.ammunition" },
          entries: [
            { translate: "guide.minere.equipment.staff.shadow.ammunition" },
          ],
        },
        {
          title: { translate: "guide.minere.crafting" },
          entries: [
            craftingIngredient("item.netherite_ingot.name", 2),
            craftingIngredient("item.ender_eye.name"),
          ],
        },
      ],
    ),
  ],
});

const magicSwordsPage = new ItemPage({
  title: { translate: "guide.minere.equipment.magic_swords" },
  emptyMessage: {
    translate: "guide.minere.equipment.magic_swords.none_discovered",
  },
  buttons: [
    magicItemButton(
      "minere:darkheart",
      "textures/items/minere/darkheart",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["13"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["6000"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            { translate: "guide.minere.equipment.sword.darkheart.abilities" },
          ],
        },
      ],
      ["guide.minere.equipment.sword.darkheart.obtain.wither_pyramid"],
    ),
    magicItemButton(
      "minere:firebrand",
      "textures/items/minere/firebrand",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["7"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["2000"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            { translate: "guide.minere.equipment.sword.firebrand.abilities" },
          ],
        },
      ],
      ["guide.minere.equipment.sword.firebrand.obtain.inferno"],
    ),
    magicItemButton(
      "minere:ghostwalker",
      "textures/items/minere/ghostwalker",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["7"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["1800"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            {
              translate: "guide.minere.equipment.sword.ghostwalker.abilities",
            },
          ],
        },
      ],
      ["guide.minere.equipment.sword.ghostwalker.obtain.ancient_city"],
    ),
    magicItemButton(
      "minere:ice_dagger",
      "textures/items/minere/ice_dagger",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["3"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["200"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            { translate: "guide.minere.equipment.sword.ice_dagger.abilities" },
          ],
        },
      ],
      [
        "guide.minere.equipment.sword.ice_dagger.obtain.glacier",
        "guide.minere.equipment.sword.ice_dagger.obtain.ice_dungeon",
        "guide.minere.equipment.sword.ice_dagger.obtain.ice_castle",
        "guide.minere.equipment.sword.ice_dagger.obtain.goblin_trades",
      ],
    ),
    magicItemButton(
      "minere:illumina",
      "textures/items/minere/illumina",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["7"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["1600"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            { translate: "guide.minere.equipment.sword.illumina.abilities" },
          ],
        },
      ],
      [
        "guide.minere.equipment.sword.illumina.obtain.end_temple",
        "guide.minere.equipment.sword.illumina.obtain.end_city",
        "guide.minere.equipment.sword.illumina.obtain.trial_chambers",
        "guide.minere.equipment.sword.illumina.obtain.goblin_trades",
      ],
    ),
    magicItemButton(
      "minere:venom_shank",
      "textures/items/minere/venom_shank",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["6"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["900"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            {
              translate: "guide.minere.equipment.sword.venom_shank.abilities",
            },
          ],
        },
      ],
      [
        "guide.minere.equipment.sword.venom_shank.obtain.woodland_mansion",
        "guide.minere.equipment.sword.venom_shank.obtain.wild_dungeon",
        "guide.minere.equipment.sword.venom_shank.obtain.jungle_temple",
        "guide.minere.equipment.sword.venom_shank.obtain.goblin_trades",
      ],
    ),
    magicItemButton(
      "minere:windforce",
      "textures/items/minere/windforce",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["7"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["1400"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            { translate: "guide.minere.equipment.sword.windforce.abilities" },
          ],
        },
      ],
      ["guide.minere.equipment.sword.windforce.obtain.trial_chambers"],
    ),
  ],
});

const magicToolsPage = new ItemPage({
  title: { translate: "guide.minere.equipment.magic_tools" },
  emptyMessage: {
    translate: "guide.minere.equipment.magic_tools.none_discovered",
  },
  buttons: [
    magicItemButton("minere:fire_axe", "textures/items/minere/fire_axe", [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.attack_damage",
            with: ["6"],
          },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: ["2000"],
          },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.abilities" },
        entries: [
          { translate: "guide.minere.equipment.tool.fire_axe.abilities" },
        ],
      },
    ]),
    magicItemButton("minere:ice_pick", "textures/items/minere/ice_pick", [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.attack_damage",
            with: ["5"],
          },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: ["1024"],
          },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.abilities" },
        entries: [
          { translate: "guide.minere.equipment.tool.ice_pick.abilities" },
        ],
      },
    ]),
    magicItemButton(
      "minere:shadow_scythe",
      "textures/items/minere/shadow_scythe",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.attack_damage",
              with: ["10"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["6000"],
            },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            {
              translate: "guide.minere.equipment.tool.shadow_scythe.abilities",
            },
          ],
        },
      ],
    ),
    magicItemButton("minere:wind_shovel", "textures/items/minere/wind_shovel", [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.attack_damage",
            with: ["7"],
          },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: ["1400"],
          },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.abilities" },
        entries: [
          { translate: "guide.minere.equipment.tool.wind_shovel.abilities" },
        ],
      },
    ]),
  ],
});

const magicArmorPage = new ItemPage({
  title: { translate: "guide.minere.equipment.magic_armor" },
  emptyMessage: {
    translate: "guide.minere.equipment.magic_armor.none_discovered",
  },
  buttons: [
    magicItemButton(
      "minere:inferno_crown",
      "textures/items/minere/inferno_crown",
      [
        {
          title: { translate: "guide.minere.equipment.stats" },
          entries: [
            {
              translate: "guide.minere.equipment.stat.protection",
              with: ["3"],
            },
            {
              translate: "guide.minere.equipment.stat.durability",
              with: ["408"],
            },
            { translate: "guide.minere.equipment.stat.weight_light" },
          ],
        },
        {
          title: { translate: "guide.minere.equipment.abilities" },
          entries: [
            {
              translate: "guide.minere.equipment.armor.inferno_crown.abilities",
            },
          ],
        },
      ],
    ),
    magicItemButton("minere:ice_crown", "textures/items/minere/ice_crown", [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          { translate: "guide.minere.equipment.stat.protection", with: ["3"] },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: ["306"],
          },
          { translate: "guide.minere.equipment.stat.weight_light" },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.abilities" },
        entries: [
          { translate: "guide.minere.equipment.armor.ice_crown.abilities" },
        ],
      },
    ]),
  ],
});

const treecapitatorsPage = new ItemPage({
  title: { translate: "guide.minere.equipment.treecapitators" },
  sections: [
    {
      title: { translate: "guide.minere.blocks.description" },
      entries: [
        {
          translate: "guide.minere.equipment.treecapitators.description",
        },
      ],
    },
    {
      title: { translate: "guide.minere.equipment.treecapitators.available" },
      entries: [
        { translate: "item.minere:copper_treecapitator" },
        { translate: "item.minere:iron_treecapitator" },
        { translate: "item.minere:golden_treecapitator" },
        { translate: "item.minere:diamond_treecapitator" },
        { translate: "item.minere:netherite_treecapitator" },
        { translate: "item.minere:enderon_treecapitator" },
        { translate: "item.minere:indigon_treecapitator" },
      ],
    },
    {
      title: { translate: "guide.minere.equipment.enchantments" },
      entries: [
        { translate: "enchantment.digging" },
        { translate: "enchantment.durability" },
        { translate: "enchantment.mending" },
      ],
    },
  ],
});

function toolsetPage(
  set: "enderon" | "indigon",
  durability: string,
  miningSpeed: string,
): ItemPage {
  return new ItemPage({
    title: { translate: `guide.minere.equipment.${set}_tools` },
    sections: [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.durability",
            with: [durability],
          },
          {
            translate: "guide.minere.equipment.stat.mining_speed",
            with: [miningSpeed],
          },
          { translate: `guide.minere.equipment.${set}_tools.repair` },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.abilities" },
        entries: [
          { translate: `guide.minere.equipment.${set}_tools.abilities` },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.includes" },
        entries: [
          { translate: `item.minere:${set}_sword` },
          { translate: `item.minere:${set}_spear` },
          { translate: `item.minere:${set}_pickaxe` },
          { translate: `item.minere:${set}_axe` },
          { translate: `item.minere:${set}_shovel` },
          { translate: `item.minere:${set}_hoe` },
        ],
      },
    ],
  });
}

const enderonToolsPage = toolsetPage("enderon", "1280", "12");
const indigonToolsPage = toolsetPage("indigon", "1776", "8");

const toolsetsPage = new ItemPage({
  title: { translate: "guide.minere.equipment.toolsets" },
  buttons: [
    {
      text: { translate: "guide.minere.equipment.enderon_tools" },
      iconPath: "textures/items/minere/enderon_pickaxe",
      show: (player, onBack) => enderonToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.indigon_tools" },
      iconPath: "textures/items/minere/indigon_pickaxe",
      show: (player, onBack) => indigonToolsPage.show(player, onBack),
    },
  ],
});

function armorSetPage(
  set: "enderon" | "indigon" | "aetherial",
  protection: string,
  durability: string,
  abilityKey: string,
  craftingKey?: string,
): ItemPage {
  return new ItemPage({
    title: { translate: `guide.minere.equipment.${set}_armor` },
    sections: [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.full_set_protection",
            with: [protection],
          },
          {
            translate: "guide.minere.equipment.stat.full_set_durability",
            with: [durability],
          },
          {
            translate:
              set === "indigon"
                ? "guide.minere.equipment.stat.weight_heavy"
                : "guide.minere.equipment.stat.weight_light",
          },
        ],
      },
      {
        title: { translate: "guide.minere.equipment.abilities" },
        entries: [{ translate: abilityKey }],
      },
      ...(craftingKey
        ? [
            {
              title: { translate: "guide.minere.crafting" },
              entries: [{ translate: craftingKey }],
            },
          ]
        : []),
      {
        title: { translate: "guide.minere.equipment.includes" },
        entries: [
          { translate: `item.minere:${set}_helmet` },
          { translate: `item.minere:${set}_chestplate` },
          { translate: `item.minere:${set}_leggings` },
          { translate: `item.minere:${set}_boots` },
        ],
      },
    ],
  });
}

const enderonArmorPage = armorSetPage(
  "enderon",
  "20",
  "1485",
  "guide.minere.equipment.armor.enderon.abilities",
);
const indigonArmorPage = armorSetPage(
  "indigon",
  "20",
  "2065",
  "guide.minere.equipment.armor.indigon.abilities",
);
const aetherialArmorPage = armorSetPage(
  "aetherial",
  "17",
  "1485",
  "guide.minere.equipment.armor.aetherial.abilities",
  "guide.minere.equipment.armor.aetherial.crafting",
);

const armorPage = new ItemPage({
  title: { translate: "guide.minere.equipment.armor" },
  buttons: [
    {
      text: { translate: "guide.minere.equipment.enderon_armor" },
      iconPath: "textures/items/minere/enderon_helmet",
      show: (player, onBack) => enderonArmorPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.indigon_armor" },
      iconPath: "textures/items/minere/indigon_helmet",
      show: (player, onBack) => indigonArmorPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.aetherial_armor" },
      iconPath: "textures/items/minere/aetherial_helmet",
      show: (player, onBack) => aetherialArmorPage.show(player, onBack),
    },
  ],
});

const equipmentPage = new ItemPage({
  title: { translate: "guide.minere.section.equipment" },
  buttons: [
    {
      text: { translate: "guide.minere.equipment.magic_staves" },
      iconPath: "textures/items/minere/emerald_staff",
      show: (player, onBack) => magicStavesPage.show(player, onBack),
      progressTranslation: "guide.minere.equipment.magic_staves.progress",
      progressItemIds: DISCOVERABLE_EQUIPMENT.magicStaves,
    },
    {
      text: { translate: "guide.minere.equipment.magic_swords" },
      iconPath: "textures/items/minere/firebrand",
      show: (player, onBack) => magicSwordsPage.show(player, onBack),
      progressTranslation: "guide.minere.equipment.magic_swords.progress",
      progressItemIds: DISCOVERABLE_EQUIPMENT.magicSwords,
    },
    {
      text: { translate: "guide.minere.equipment.magic_tools" },
      iconPath: "textures/items/minere/ice_pick",
      show: (player, onBack) => magicToolsPage.show(player, onBack),
      progressTranslation: "guide.minere.equipment.magic_tools.progress",
      progressItemIds: DISCOVERABLE_EQUIPMENT.magicTools,
    },
    {
      text: { translate: "guide.minere.equipment.magic_armor" },
      iconPath: "textures/items/minere/inferno_crown",
      show: (player, onBack) => magicArmorPage.show(player, onBack),
      progressTranslation: "guide.minere.equipment.magic_armor.progress",
      progressItemIds: DISCOVERABLE_EQUIPMENT.magicArmor,
    },
    {
      text: { translate: "guide.minere.equipment.treecapitators" },
      iconPath: "textures/items/minere/diamond_treecapitator",
      show: (player, onBack) => treecapitatorsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.toolsets" },
      iconPath: "textures/items/minere/enderon_pickaxe",
      show: (player, onBack) => toolsetsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.armor" },
      iconPath: "textures/items/minere/enderon_helmet",
      show: (player, onBack) => armorPage.show(player, onBack),
    },
  ],
});

export function showEquipmentPage(player: Player, onBack: () => void): void {
  equipmentPage.show(player, onBack);
}
