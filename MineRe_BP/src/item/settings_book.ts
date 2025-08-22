import { ItemCustomComponent, world, Player } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { WorldSettings, getSettings, saveSettings } from "settings";

export const SettingsBook: ItemCustomComponent = {
  onUse(arg) {
    const player = arg.source as Player;

    // Get the current settings to pre-fill the form.
    const currentSettings: WorldSettings = getSettings();

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

        if (formValues && formValues.length === 9) {
          // Map the form values back to a settings object.
          const newSettings: WorldSettings = {
            reducedHealthRegen: formValues[0] as boolean,
            healingFromSoup: formValues[1] as boolean,
            armorWeight: formValues[2] as boolean,
            armorCurve: formValues[3] as boolean,
            protectionNerf: formValues[4] as boolean,
            endStorms: formValues[5] as boolean,
            gremlinBreaksTorches: formValues[6] as boolean,
            reduceDaylightDrowned: formValues[7] as boolean,
            goldXPBonus: formValues[8] as boolean,
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
