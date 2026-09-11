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
  buttonGroups?: EquipmentPageButtonGroup[];
  unobtainedItemIds?: readonly string[];
  emptyMessage?: EquipmentPageText;
}

interface EquipmentPageSection {
  title: EquipmentPageText;
  entries: EquipmentPageText[];
}

interface EquipmentPageButtonGroup {
  title: EquipmentPageText;
  buttons: EquipmentPageButton[];
}

const MAGIC_ITEM_COLORS: Readonly<Record<string, string>> = {
  "minere:amethyst_staff": "§d",
  "minere:blaster_staff": "§5",
  "minere:echo_staff": "§b",
  "minere:emerald_staff": "§a",
  "minere:fire_staff": "§c",
  "minere:ice_staff": "§b",
  "minere:dark_staff": "§8",
  "minere:darkheart": "§4",
  "minere:firebrand": "§c",
  "minere:ghostwalker": "§7",
  "minere:ice_dagger": "§b",
  "minere:illumina": "§e",
  "minere:venom_shank": "§2",
  "minere:windforce": "§9",
  "minere:fire_axe": "§c",
  "minere:ice_pick": "§b",
  "minere:shadow_scythe": "§8",
  "minere:wind_shovel": "§9",
};

function coloredEquipmentItemName(itemId: string): RawMessage {
  return {
    rawtext: [
      { text: MAGIC_ITEM_COLORS[itemId] ?? "§f" },
      { translate: `item.${itemId}` },
      { text: "§r" },
    ],
  };
}

/** A standard ActionForm page used for text-only item sets and categories. */
export class ItemPage {
  constructor(private readonly options: ItemPageOptions) {}

  show(player: Player, onBack: () => void): void {
    const entries = this.options.entries ?? [];
    const isVisible = (button: EquipmentPageButton): boolean => {
      if (player.getGameMode() === GameMode.Creative) {
        return true;
      }

      return (
        !button.requiredItemId ||
        hasDiscoveredEquipment(player, button.requiredItemId)
      );
    };
    const buttons = (this.options.buttons ?? []).filter(isVisible);
    const buttonGroups = (this.options.buttonGroups ?? []).map((group) => ({
      ...group,
      buttons: group.buttons.filter(isVisible),
    }));
    const groupedButtons = buttonGroups.flatMap((group) => group.buttons);
    const allButtons = [...buttons, ...groupedButtons];
    const unobtainedItemIds =
      player.getGameMode() === GameMode.Creative
        ? []
        : (this.options.unobtainedItemIds ?? []).filter(
            (itemId) => !hasDiscoveredEquipment(player, itemId),
          );
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
      allButtons.length === 0 &&
      (this.options.emptyMessage ||
        this.options.buttons?.length ||
        this.options.buttonGroups?.some((group) => group.buttons.length))
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
    for (const group of buttonGroups) {
      form.divider();
      form.header(group.title);
      for (const button of group.buttons) {
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
    }
    if (unobtainedItemIds.length > 0) {
      form.divider();
      for (const itemId of unobtainedItemIds) {
        form.label(coloredEquipmentItemName(itemId));
      }
    }
    form.button({ translate: "guide.minere.back" });
    form
      .show(player)
      .then((response) => {
        if (response.canceled || response.selection === undefined) {
          return;
        }
        if (response.selection === allButtons.length) {
          onBack();
          return;
        }
        allButtons[response.selection].show(player, () =>
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
    text: coloredEquipmentItemName(itemId),
    iconPath: imagePath,
    requiredItemId: itemId,
    show: (player, onBack) => page.show(player, onBack),
  };
}

const magicStavesPage = new ItemPage({
  title: { translate: "guide.minere.equipment.magic_staves" },
  unobtainedItemIds: DISCOVERABLE_EQUIPMENT.magicStaves,
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
      "minere:dark_staff",
      "textures/items/minere/dark_staff",
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
  unobtainedItemIds: DISCOVERABLE_EQUIPMENT.magicSwords,
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
  unobtainedItemIds: DISCOVERABLE_EQUIPMENT.magicTools,
  emptyMessage: {
    translate: "guide.minere.equipment.magic_tools.none_discovered",
  },
  buttons: [
    magicItemButton(
      "minere:fire_axe",
      "textures/items/minere/fire_axe",
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
      ],
      ["guide.minere.equipment.tool.fire_axe.obtain.inferno"],
    ),
    magicItemButton(
      "minere:ice_pick",
      "textures/items/minere/ice_pick",
      [
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
      ],
      [
        "guide.minere.equipment.tool.ice_pick.obtain.glacier",
        "guide.minere.equipment.tool.ice_pick.obtain.ice_dungeon",
        "guide.minere.equipment.tool.ice_pick.obtain.ice_castle",
        "guide.minere.equipment.tool.ice_pick.obtain.goblin_trades",
      ],
    ),
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
      ["guide.minere.equipment.tool.shadow_scythe.obtain.wither_pyramid"],
    ),
    magicItemButton(
      "minere:wind_shovel",
      "textures/items/minere/wind_shovel",
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
            { translate: "guide.minere.equipment.tool.wind_shovel.abilities" },
          ],
        },
      ],
      [
        "guide.minere.equipment.tool.wind_shovel.obtain.trial_chambers",
        "guide.minere.equipment.tool.wind_shovel.obtain.goblin_trades",
      ],
    ),
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

type ToolsetMaterial =
  | "wooden"
  | "golden"
  | "stone"
  | "iron"
  | "diamond"
  | "netherite"
  | "enderon"
  | "indigon";

function toolsetPage(
  set: ToolsetMaterial,
  durability: string,
  miningSpeed: string,
  swordDamage: string,
): ItemPage {
  const isCustom = set === "enderon" || set === "indigon";
  const itemKey = (item: string): string =>
    isCustom ? `item.minere:${set}_${item}` : `item.${set}_${item}.name`;
  return new ItemPage({
    title: { translate: `guide.minere.equipment.${set}_tools` },
    sections: [
      {
        title: { translate: "guide.minere.equipment.stats" },
        entries: [
          {
            translate: "guide.minere.equipment.stat.attack_damage",
            with: [swordDamage],
          },
          {
            translate: "guide.minere.equipment.stat.durability",
            with: [durability],
          },
          {
            translate: "guide.minere.equipment.stat.mining_speed",
            with: [miningSpeed],
          },
          ...(isCustom
            ? [{ translate: `guide.minere.equipment.${set}_tools.repair` }]
            : []),
        ],
      },
      ...(isCustom
        ? [
            {
              title: { translate: "guide.minere.equipment.abilities" },
              entries: [
                { translate: `guide.minere.equipment.${set}_tools.abilities` },
              ],
            },
          ]
        : []),
      {
        title: { translate: "guide.minere.equipment.includes" },
        entries: [
          { translate: itemKey("sword") },
          ...(isCustom ? [{ translate: itemKey("spear") }] : []),
          { translate: itemKey("pickaxe") },
          { translate: itemKey("axe") },
          { translate: itemKey("shovel") },
          { translate: itemKey("hoe") },
        ],
      },
    ],
  });
}

const woodenToolsPage = toolsetPage("wooden", "59", "2", "4");
const goldenToolsPage = toolsetPage("golden", "32", "12", "4");
const stoneToolsPage = toolsetPage("stone", "131", "4", "5");
const ironToolsPage = toolsetPage("iron", "250", "6", "6");
const diamondToolsPage = toolsetPage("diamond", "1561", "8", "7");
const indigonToolsPage = toolsetPage("indigon", "1776", "8", "7");
const enderonToolsPage = toolsetPage("enderon", "1280", "12", "7");
const netheriteToolsPage = toolsetPage("netherite", "2031", "9", "8");

const toolsetsPage = new ItemPage({
  title: { translate: "guide.minere.equipment.toolsets" },
  buttons: [
    {
      text: { translate: "guide.minere.equipment.wooden_tools" },
      iconPath: "textures/items/wood_sword",
      show: (player, onBack) => woodenToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.golden_tools" },
      iconPath: "textures/items/gold_sword",
      show: (player, onBack) => goldenToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.stone_tools" },
      iconPath: "textures/items/stone_sword",
      show: (player, onBack) => stoneToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.iron_tools" },
      iconPath: "textures/items/iron_sword",
      show: (player, onBack) => ironToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.diamond_tools" },
      iconPath: "textures/items/diamond_sword",
      show: (player, onBack) => diamondToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.indigon_tools" },
      iconPath: "textures/items/minere/indigon_sword",
      show: (player, onBack) => indigonToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.enderon_tools" },
      iconPath: "textures/items/minere/enderon_sword",
      show: (player, onBack) => enderonToolsPage.show(player, onBack),
    },
    {
      text: { translate: "guide.minere.equipment.netherite_tools" },
      iconPath: "textures/items/netherite_sword",
      show: (player, onBack) => netheriteToolsPage.show(player, onBack),
    },
  ],
});

type ArmorMaterial =
  | "leather"
  | "chainmail"
  | "golden"
  | "iron"
  | "diamond"
  | "netherite"
  | "enderon"
  | "indigon"
  | "aetherial";

function armorSetPage(
  set: ArmorMaterial,
  protection: string,
  durability: string,
  weight: "light" | "heavy",
  abilityKey?: string,
  craftingKey?: string,
): ItemPage {
  const isCustom = ["enderon", "indigon", "aetherial"].includes(set);
  const itemKey = (item: string): string =>
    isCustom ? `item.minere:${set}_${item}` : `item.${set}_${item}.name`;
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
              weight === "heavy"
                ? "guide.minere.equipment.stat.weight_heavy"
                : "guide.minere.equipment.stat.weight_light",
          },
        ],
      },
      ...(abilityKey
        ? [
            {
              title: { translate: "guide.minere.equipment.abilities" },
              entries: [{ translate: abilityKey }],
            },
          ]
        : []),
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
          { translate: itemKey("helmet") },
          { translate: itemKey("chestplate") },
          { translate: itemKey("leggings") },
          { translate: itemKey("boots") },
        ],
      },
    ],
  });
}

const enderonArmorPage = armorSetPage(
  "enderon",
  "20",
  "1485",
  "light",
  "guide.minere.equipment.armor.enderon.abilities",
);
const indigonArmorPage = armorSetPage(
  "indigon",
  "20",
  "2065",
  "heavy",
  "guide.minere.equipment.armor.indigon.abilities",
);
const aetherialArmorPage = armorSetPage(
  "aetherial",
  "17",
  "1485",
  "light",
  "guide.minere.equipment.armor.aetherial.abilities",
  "guide.minere.equipment.armor.aetherial.crafting",
);
const leatherArmorPage = armorSetPage("leather", "7", "275", "light");
const chainmailArmorPage = armorSetPage("chainmail", "12", "825", "light");
const goldenArmorPage = armorSetPage("golden", "11", "385", "heavy");
const ironArmorPage = armorSetPage("iron", "15", "825", "heavy");
const diamondArmorPage = armorSetPage("diamond", "20", "1815", "heavy");
const netheriteArmorPage = armorSetPage("netherite", "20", "2035", "heavy");

const armorPage = new ItemPage({
  title: { translate: "guide.minere.equipment.armor" },
  buttonGroups: [
    {
      title: { text: "§aLight§r" },
      buttons: [
        {
          text: { translate: "guide.minere.equipment.leather_armor" },
          iconPath: "textures/items/leather_helmet",
          show: (player, onBack) => leatherArmorPage.show(player, onBack),
        },
        {
          text: { translate: "guide.minere.equipment.chainmail_armor" },
          iconPath: "textures/items/chainmail_helmet",
          show: (player, onBack) => chainmailArmorPage.show(player, onBack),
        },
        {
          text: { translate: "guide.minere.equipment.aetherial_armor" },
          iconPath: "textures/items/minere/aetherial_helmet",
          show: (player, onBack) => aetherialArmorPage.show(player, onBack),
        },
        {
          text: { translate: "guide.minere.equipment.enderon_armor" },
          iconPath: "textures/items/minere/enderon_helmet",
          show: (player, onBack) => enderonArmorPage.show(player, onBack),
        },
      ],
    },
    {
      title: { text: "§cHeavy§r" },
      buttons: [
        {
          text: { translate: "guide.minere.equipment.golden_armor" },
          iconPath: "textures/items/gold_helmet",
          show: (player, onBack) => goldenArmorPage.show(player, onBack),
        },
        {
          text: { translate: "guide.minere.equipment.iron_armor" },
          iconPath: "textures/items/iron_helmet",
          show: (player, onBack) => ironArmorPage.show(player, onBack),
        },
        {
          text: { translate: "guide.minere.equipment.diamond_armor" },
          iconPath: "textures/items/diamond_helmet",
          show: (player, onBack) => diamondArmorPage.show(player, onBack),
        },
        {
          text: { translate: "guide.minere.equipment.netherite_armor" },
          iconPath: "textures/items/netherite_helmet",
          show: (player, onBack) => netheriteArmorPage.show(player, onBack),
        },
        {
          text: { translate: "guide.minere.equipment.indigon_armor" },
          iconPath: "textures/items/minere/indigon_helmet",
          show: (player, onBack) => indigonArmorPage.show(player, onBack),
        },
      ],
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
