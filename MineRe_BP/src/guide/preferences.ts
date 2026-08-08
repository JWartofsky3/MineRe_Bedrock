import { Player, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

export interface PlayerPreferences {
  enableHints: boolean;
}

const DEFAULT_PREFERENCES: PlayerPreferences = {
  enableHints: true,
};

export function getPreferences(player: Player): PlayerPreferences {
  const storedPreferences = world.getDynamicProperty(
    `minere:preferences:${player.id}`,
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
    `minere:preferences:${player.id}`,
    JSON.stringify(preferences),
  );
}

export function showPreferencesPage(
  player: Player,
  onBack: () => void = () => {},
): void {
  const preferences = getPreferences(player);
  const form = new ModalFormData().title({
    translate: "guide.minere.preferences.title",
  });

  form.toggle(
    { translate: "guide.minere.preferences.toggle.enable_hints" },
    {
      defaultValue: preferences.enableHints,
      tooltip: { translate: "guide.minere.preferences.tooltip.enable_hints" },
    },
  );
  form.submitButton({ translate: "guide.minere.preferences.save" });

  form
    .show(player)
    .then((response) => {
      if (response.canceled) {
        onBack();
        return;
      }

      if (response.formValues?.length !== 1) {
        player.sendMessage({
          translate: "guide.minere.preferences.update_failed",
        });
        onBack();
        return;
      }

      savePreferences(player, {
        enableHints: response.formValues[0] as boolean,
      });
      player.sendMessage({ translate: "guide.minere.preferences.updated" });
      onBack();
    })
    .catch((error) =>
      console.error("Failed to show preferences form: " + error),
    );
}
