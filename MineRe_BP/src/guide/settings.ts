import {
  CommandPermissionLevel,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  Player,
} from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import {
  MAX_TELEPORTER_MAX_DISTANCE,
  MIN_TELEPORTER_MAX_DISTANCE,
  WorldSettings,
  getSettings,
  saveSettings,
} from "settings";

const toggleSettingKeys: (keyof Omit<
  WorldSettings,
  "teleporterMaxDistance"
>)[] = [
  "reducedHealthRegen",
  "healingFromSoup",
  "armorWeight",
  "armorCurve",
  "protectionNerf",
  "endStorms",
  "gremlinBreaksTorches",
  "ogreBreaksBlocks",
  "reduceDaylightDrowned",
  "goldXPBonus",
];

const settingTranslationNames: Record<
  keyof Omit<WorldSettings, "teleporterMaxDistance">,
  string
> = {
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

export function showSettingsPage(
  player: Player,
  onBack: () => void = () => {},
) {
  const settings = getSettings();
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  const mayEdit =
    player.commandPermissionLevel > CommandPermissionLevel.Any &&
    equippable?.getEquipment(EquipmentSlot.Head)?.typeId !==
      "minecraft:carved_pumpkin";
  const form = new ModalFormData().title({
    translate: "guide.minere.settings.title",
  });

  for (const key of toggleSettingKeys) {
    const name = settingTranslationNames[key];
    if (mayEdit) {
      form.toggle(
        { translate: `guide.minere.settings.toggle.${name}` },
        {
          defaultValue: settings[key],
          tooltip: { translate: `guide.minere.settings.tooltip.${name}` },
        },
      );
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

  if (mayEdit) {
    form.textField(
      { translate: "guide.minere.settings.teleporter_max_distance" },
      `${MIN_TELEPORTER_MAX_DISTANCE}-${MAX_TELEPORTER_MAX_DISTANCE}`,
      {
        defaultValue: String(settings.teleporterMaxDistance),
        tooltip: {
          translate: "guide.minere.settings.tooltip.teleporter_max_distance",
        },
      },
    );
  } else {
    form.label({
      translate: "guide.minere.settings.display.teleporter_max_distance",
      with: [String(settings.teleporterMaxDistance)],
    });
    form.label({
      translate: "guide.minere.settings.tooltip.teleporter_max_distance",
    });
  }

  form.submitButton({
    translate: mayEdit ? "guide.minere.settings.save" : "guide.minere.back",
  });

  form
    .show(player)
    .then((response) => {
      if (response.canceled || !mayEdit) {
        onBack();
        return;
      }

      if (
        player.commandPermissionLevel === CommandPermissionLevel.Any ||
        response.formValues?.length !== toggleSettingKeys.length + 1
      ) {
        player.sendMessage({
          translate: "guide.minere.settings.update_failed",
        });
        onBack();
        return;
      }
      const updated = { ...settings };
      toggleSettingKeys.forEach((key, index) => {
        updated[key] = response.formValues![index] as boolean;
      });
      const teleporterMaxDistance = Number(
        response.formValues![toggleSettingKeys.length],
      );
      if (
        !Number.isInteger(teleporterMaxDistance) ||
        teleporterMaxDistance < MIN_TELEPORTER_MAX_DISTANCE ||
        teleporterMaxDistance > MAX_TELEPORTER_MAX_DISTANCE
      ) {
        player.sendMessage({
          translate: "guide.minere.settings.update_failed",
        });
        onBack();
        return;
      }
      updated.teleporterMaxDistance = teleporterMaxDistance;
      saveSettings(updated);
      player.sendMessage({ translate: "guide.minere.settings.updated" });
      onBack();
    })
    .catch((error) => console.error("Failed to show settings form: " + error));
}
