import { ModalFormData } from "@minecraft/server-ui";
import { getSettings, saveSettings } from "settings";
export const SettingsBook = {
  onUse(arg) {
    const player = arg.source;
    // Get the current settings to pre-fill the form.
    const currentSettings = getSettings();
    // Create the form using ModalFormData.
    const form = new ModalFormData()
      .title("settings.minere.title")
      .toggle("settings.minere.toggle.reduced_health_regen", {
        defaultValue: currentSettings.reducedHealthRegen,
        tooltip: "settings.minere.tooltip.reduced_health_regen",
      })
      .toggle("settings.minere.toggle.healing_from_soup", {
        defaultValue: currentSettings.healingFromSoup,
        tooltip: "settings.minere.tooltip.healing_from_soup",
      })
      .toggle("settings.minere.toggle.armor_weight", {
        defaultValue: currentSettings.armorWeight,
        tooltip: "settings.minere.tooltip.armor_weight",
      })
      .toggle("settings.minere.toggle.armor_curve", {
        defaultValue: currentSettings.armorCurve,
        tooltip: "settings.minere.tooltip.armor_curve",
      })
      .toggle("settings.minere.toggle.protection_nerf", {
        defaultValue: currentSettings.protectionNerf,
        tooltip: "settings.minere.tooltip.protection_nerf",
      })
      .toggle("settings.minere.toggle.end_storms", {
        defaultValue: currentSettings.endStorms,
        tooltip: "settings.minere.tooltip.end_storms",
      })
      .toggle("settings.minere.toggle.gremlin_breaks_torches", {
        defaultValue: currentSettings.gremlinBreaksTorches,
        tooltip: "settings.minere.tooltip.gremlin_breaks_torches",
      })
      .toggle("settings.minere.toggle.ogre_breaks_blocks", {
        defaultValue: currentSettings.ogreBreaksBlocks,
        tooltip: "settings.minere.tooltip.ogre_breaks_blocks",
      })
      .toggle("settings.minere.toggle.reduce_daylight_drowned", {
        defaultValue: currentSettings.reduceDaylightDrowned,
        tooltip: "settings.minere.tooltip.reduce_daylight_drowned",
      })
      .toggle("settings.minere.toggle.gold_xp_bonus", {
        defaultValue: currentSettings.goldXPBonus,
        tooltip: "settings.minere.tooltip.gold_xp_bonus",
      });
    // Show the form to the player.
    form
      .show(player)
      .then((response) => {
        if (response.canceled) {
          return;
        }
        // The formValues array holds the state of the toggles.
        const formValues = response.formValues;
        if (formValues && formValues.length === 10) {
          // Map the form values back to a settings object.
          const newSettings = {
            reducedHealthRegen: formValues[0],
            healingFromSoup: formValues[1],
            armorWeight: formValues[2],
            armorCurve: formValues[3],
            protectionNerf: formValues[4],
            endStorms: formValues[5],
            gremlinBreaksTorches: formValues[6],
            ogreBreaksBlocks: formValues[7],
            reduceDaylightDrowned: formValues[8],
            goldXPBonus: formValues[9],
          };
          // Save the new settings to the world's dynamic properties.
          saveSettings(newSettings);
          player.sendMessage(`§aMineRe settings updated successfully!`);
        } else {
          player.sendMessage(`§cFailed to update settings!`);
        }
      })
      .catch((error) => {
        console.error("Failed to show form: " + error);
      });
  },
};
