import { Player, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

export interface PlayerPreferences {
  enableHints: boolean;
}

const DEFAULT_PREFERENCES: PlayerPreferences = {
  enableHints: true,
};

function getPreferencesPropertyId(player: Player): string {
  return `minere:preferences:${player.id}`;
}

export function getPreferences(player: Player): PlayerPreferences {
  const storedPreferences = world.getDynamicProperty(
    getPreferencesPropertyId(player),
  );

  if (typeof storedPreferences !== "string") {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const parsedPreferences = JSON.parse(
      storedPreferences,
    ) as Partial<PlayerPreferences>;
    return {
      enableHints:
        typeof parsedPreferences.enableHints === "boolean"
          ? parsedPreferences.enableHints
          : DEFAULT_PREFERENCES.enableHints,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(
  player: Player,
  preferences: PlayerPreferences,
): void {
  world.setDynamicProperty(
    getPreferencesPropertyId(player),
    JSON.stringify(preferences),
  );
}

export function areHintsEnabled(player: Player): boolean {
  return getPreferences(player).enableHints;
}

export function showPreferencesPage(
  player: Player,
  onBack: () => void = () => {},
): void {
  const preferences = getPreferences(player);
  const form = new ModalFormData().title("guide.minere.preferences.title");

  form.toggle("guide.minere.preferences.toggle.enable_hints", {
    defaultValue: preferences.enableHints,
    tooltip: "guide.minere.preferences.tooltip.enable_hints",
  });
  form.submitButton("guide.minere.preferences.save");

  form
    .show(player)
    .then((response) => {
      if (response.canceled) {
        onBack();
        return;
      }

      if (response.formValues?.length !== 1) {
        player.sendMessage("guide.minere.preferences.update_failed");
        onBack();
        return;
      }

      savePreferences(player, {
        enableHints: response.formValues[0] as boolean,
      });
      player.sendMessage("guide.minere.preferences.updated");
      onBack();
    })
    .catch((error) =>
      console.error("Failed to show preferences form: " + error),
    );
}
