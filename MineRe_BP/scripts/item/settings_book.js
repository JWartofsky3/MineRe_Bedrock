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
        if (formValues && formValues.length === 6) {
          // Map the form values back to a settings object.
          const newSettings = {
            reducedHealthRegen: formValues[0],
            healingFromSoup: formValues[1],
            armorWeight: formValues[2],
            armorCurve: formValues[3],
            protectionNerf: formValues[4],
            endStorms: formValues[5],
          };
          // Save the new settings to the world's dynamic properties.
          saveSettings(newSettings);
          player.sendMessage(`§aMineRe settings updated successfully!`);
        }
      })
      .catch((error) => {
        console.error("Failed to show form: " + error);
      });
  },
};
