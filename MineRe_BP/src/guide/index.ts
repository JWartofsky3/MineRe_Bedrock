import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import {
  DiscoveryCategory,
  GUIDE_DISCOVERY_TOTALS,
  getDiscoveredCount,
} from "guide/discovery";
import { showCreatureSection } from "guide/creaturePages";
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
  blocks: "textures/guide/main/blocks",
  items: "textures/items/minere/ender_plasma",
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
  for (const section of sections) {
    const category = discoveryCategories[section];
    if (category) {
      form.button(
        {
          translate: `guide.minere.section.${section}.progress`,
          with: [
            getDiscoveredCount(player, category).toString(),
            GUIDE_DISCOVERY_TOTALS[category].toString(),
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
      showPlaceholderPage(player, sections[response.selection]);
    })
    .catch((error) => console.error("Failed to show guide: " + error));
}

function showPlaceholderPage(
  player: Player,
  section: (typeof sections)[number],
) {
  if (section === "animals" || section === "monsters" || section === "bosses") {
    showCreatureSection(player, section, () => showGuide(player));
    return;
  }

  new ActionFormData()
    .title(`guide.minere.section.${section}`)
    .body("guide.minere.placeholder")
    .button("guide.minere.back")
    .show(player)
    .then((response) => {
      if (!response.canceled) showGuide(player);
    })
    .catch((error) => console.error("Failed to show guide section: " + error));
}
