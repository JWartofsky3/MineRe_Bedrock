import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// Keep this in sync with MineRe_BP/manifest.json.
const MINERE_VERSION = "1.13.2";

export function showAboutPage(player: Player, onBack: () => void): void {
  const form = new ActionFormData()
    .title({ translate: "guide.minere.about.title" })
    .body({
      translate: "guide.minere.about.body",
      with: [MINERE_VERSION],
    })
    .button({ translate: "guide.minere.back" });

  form
    .show(player)
    .then(() => onBack())
    .catch((error) => console.error("Failed to show About page: " + error));
}
