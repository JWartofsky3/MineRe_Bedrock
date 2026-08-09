import { GameMode, Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  DiscoveryCategory,
  GUIDE_DISCOVERY_TOTALS,
  getDiscoveredCount,
  getDiscoveryLevel,
  getGuideCreatures,
} from "guide/discovery";
import { getGuideCreatureIcon, showCreatureSection } from "guide/creaturePages";
import { showBlocksPage } from "guide/blocksPages";
import {
  GUIDE_EQUIPMENT_DISCOVERY_TOTAL,
  getDiscoveredEquipmentTotal,
} from "guide/equipmentDiscovery";
import { showEquipmentPage } from "guide/equipmentPages";
import { showItemsPage } from "guide/itemsPages";
import { showPreferencesPage } from "guide/preferences";
import { showSettingsPage } from "guide/settings";

const sections = [
  "animals",
  "monsters",
  "bosses",
  "equipment",
  "blocks",
  "items",
] as const;

const sectionIcons: Partial<Record<(typeof sections)[number], string>> = {
  animals: "textures/guide/animals/deer",
  monsters: "textures/guide/monsters/ogre",
  bosses: "textures/guide/bosses/inferno",
  equipment: "textures/items/minere/emerald_staff",
  blocks: "textures/guide/blocks/indigon_block",
  items: "textures/items/minere/ender_plasma",
};

const undiscoveredSectionIcons: Partial<Record<DiscoveryCategory, string>> = {
  animals: "textures/items/egg",
  monsters: "textures/items/bone",
  bosses: "textures/items/nether_star",
};

const discoveryCategories: Partial<
  Record<(typeof sections)[number], DiscoveryCategory>
> = {
  animals: "animals",
  monsters: "monsters",
  bosses: "bosses",
};

export function showGuide(player: Player) {
  const form = new ActionFormData().title("guide.minere.title");
  const isCreative = player.getGameMode() === GameMode.Creative;
  for (const section of sections) {
    const category = discoveryCategories[section];
    if (category) {
      const discovered = getDiscoveredCount(player, category);
      let icon = sectionIcons[section];
      if (discovered === 0 && !isCreative) {
        icon = undiscoveredSectionIcons[category];
      } else {
        const creatures = getGuideCreatures(category).filter(
          (creature) =>
            isCreative || getDiscoveryLevel(player, creature.typeId) > 0,
        );
        const creature =
          creatures[Math.floor(Math.random() * creatures.length)];
        if (creature) {
          icon = getGuideCreatureIcon(creature);
        }
      }
      form.button(
        isCreative
          ? `guide.minere.section.${section}`
          : {
              translate: `guide.minere.section.${section}.progress`,
              with: [
                discovered.toString(),
                GUIDE_DISCOVERY_TOTALS[category].toString(),
              ],
            },
        icon,
      );
    } else if (section === "equipment") {
      const discoveredEquipment = getDiscoveredEquipmentTotal(player);
      form.button(
        isCreative
          ? "guide.minere.section.equipment"
          : {
              translate: "guide.minere.section.equipment.progress",
              with: [
                discoveredEquipment.toString(),
                GUIDE_EQUIPMENT_DISCOVERY_TOTAL.toString(),
              ],
            },
        sectionIcons[section],
      );
    } else {
      form.button(`guide.minere.section.${section}`, sectionIcons[section]);
    }
  }
  form.button(
    "guide.minere.section.preferences",
    "textures/guide/main/preferences",
  );
  form.button("guide.minere.section.settings", "textures/guide/main/settings");
  form.label("guide.minere.section.crafting_hint");
  form
    .show(player)
    .then((response) => {
      if (response.canceled || response.selection === undefined) {
        return;
      }
      if (response.selection === sections.length) {
        showPreferencesPage(player, () => showGuide(player));
        return;
      }
      if (response.selection === sections.length + 1) {
        showSettingsPage(player, () => showGuide(player));
        return;
      }
      const section = sections[response.selection];
      const onBack = () => showGuide(player);
      if (
        section === "animals" ||
        section === "monsters" ||
        section === "bosses"
      ) {
        showCreatureSection(player, section, onBack);
        return;
      }
      if (section === "equipment") {
        showEquipmentPage(player, onBack);
        return;
      }
      if (section === "items") {
        showItemsPage(player, onBack);
        return;
      }
      showBlocksPage(player, onBack);
    })
    .catch((error) => console.error("Failed to show guide: " + error));
}
