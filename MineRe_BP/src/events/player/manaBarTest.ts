import { PlayerJoinAfterEvent, system, world } from "@minecraft/server";
import { RegisterableEvent } from "events/CustomEvent";

export class ManaBarTestEvent implements RegisterableEvent {
  register(): void {
    world.afterEvents.playerJoin.subscribe(playerJoin);
  }
}

function playerJoin(data: PlayerJoinAfterEvent) {
  const runner = system.runInterval(() => {
    const player = world.getPlayers().find((p) => p.id === data.playerId);
    if (!player) {
      system.clearRun(runner);
      return;
    }

    const manaProperty = player.getDynamicProperty("minere:mana");
    const maxManaProperty = player.getDynamicProperty("minere:maxMana");

    const currentMana = typeof manaProperty === "number" ? manaProperty : 20;
    const maxMana = typeof maxManaProperty === "number" ? maxManaProperty : 20;

    const manaBar = createManaBar(currentMana, maxMana, 20);

    player.onScreenDisplay.setTitle(`\u00a79Mana\n${manaBar}`, {
      fadeInDuration: 0,
      stayDuration: 20,
      fadeOutDuration: 0,
    });
  }, 10);
}

function createManaBar(
  currentMana: number,
  maxMana: number,
  totalSegments: number,
): string {
  if (maxMana <= 0) {
    return "\u00a77".concat("|".repeat(totalSegments));
  }

  const clampedMana = Math.max(0, Math.min(currentMana, maxMana));
  const filledSegments = Math.round((clampedMana / maxMana) * totalSegments);
  const emptySegments = totalSegments - filledSegments;

  const filledBar = "|".repeat(filledSegments);
  const emptyBar = "|".repeat(emptySegments);

  return `\u00a79${filledBar}\u00a77${emptyBar}`;
}
