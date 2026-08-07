import {
  CommandPermissionLevel,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  Player,
} from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { WorldSettings, getSettings, saveSettings } from "settings";

const settingKeys: (keyof WorldSettings)[] = [
  "reducedHealthRegen", "healingFromSoup", "armorWeight", "armorCurve", "protectionNerf",
  "endStorms", "gremlinBreaksTorches", "ogreBreaksBlocks", "reduceDaylightDrowned", "goldXPBonus",
];

const settingTranslationNames: Record<keyof WorldSettings, string> = {
  reducedHealthRegen: "reduced_health_regen",
  healingFromSoup: "healing_from_soup",
  armorWeight: "armor_weight",
  armorCurve: "armor_curve",
  protectionNerf: "protection_nerf",
  endStorms: "end_storms",
  gremlinBreaksTorches: "gremlin_breaks_torches",
  ogreBreaksBlocks: "ogre_breaks_blocks",
  reduceDaylightDrowned: "reduce_daylight_drowned",
  goldXPBonus: "gold_xp_bonus",
};

function canEditSettings(player: Player): boolean {
  return player.commandPermissionLevel > CommandPermissionLevel.Any;
}

function isWearingCarvedPumpkin(player: Player): boolean {
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  return (
    equippable?.getEquipment(EquipmentSlot.Head)?.typeId ===
    "minecraft:carved_pumpkin"
  );
}

export function showSettingsPage(player: Player, onBack: () => void = () => {}) {
  const settings = getSettings();
  const mayEdit = canEditSettings(player) && !isWearingCarvedPumpkin(player);
  const form = new ModalFormData().title("guide.minere.settings.title");

  for (const key of settingKeys) {
    const name = settingTranslationNames[key];
    if (mayEdit) {
      form.toggle(`guide.minere.settings.toggle.${name}`, {
        defaultValue: settings[key],
        tooltip: `guide.minere.settings.tooltip.${name}`,
      });
    } else {
      form.label({
        translate: `guide.minere.settings.display.${name}`,
        with: [settings[key] ? "§aOn" : "§cOff"],
      });
      if (settings[key]) {
        form.label({ translate: `guide.minere.settings.tooltip.${name}` });
      }
    }
  }

  form.submitButton({
    translate: mayEdit ? "guide.minere.settings.save" : "guide.minere.back",
  });

  form.show(player).then((response) => {
    if (response.canceled || !mayEdit) {
      onBack();
      return;
    }

    if (!canEditSettings(player) || response.formValues?.length !== settingKeys.length) {
      player.sendMessage("guide.minere.settings.update_failed");
      onBack();
      return;
    }
    const updated = { ...settings };
    settingKeys.forEach((key, index) => { updated[key] = response.formValues![index] as boolean; });
    saveSettings(updated);
    player.sendMessage("guide.minere.settings.updated");
    onBack();
  }).catch((error) => console.error("Failed to show settings form: " + error));
}
