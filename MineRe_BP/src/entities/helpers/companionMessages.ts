import { Entity, Player } from "@minecraft/server";
import { getTamedOwner } from "entities/helpers/commandableCompanion";

type CompanionMessageOptions = {
  commandRange: number;
  nameColor: string;
  nameTranslationKey: string;
};

export function createCompanionMessenger(options: CompanionMessageOptions): {
  send: (player: Player, companion: Entity, messageKey: string) => void;
  sendToOwner: (companion: Entity, messageKey: string) => boolean;
} {
  const send = (player: Player, companion: Entity, messageKey: string): void => {
    player.sendMessage({
      rawtext: [
        { text: `§7[${options.nameColor}` },
        companion.nameTag
          ? { text: `${options.nameColor}${companion.nameTag}` }
          : { translate: options.nameTranslationKey },
        { text: "§7]: " },
        { translate: messageKey },
      ],
    });
  };

  const sendToOwner = (companion: Entity, messageKey: string): boolean => {
    const owner = getTamedOwner(companion);
    if (!owner || !isWithinCommandRange(owner, companion, options.commandRange)) {
      return false;
    }
    send(owner, companion, messageKey);
    return true;
  };

  return { send, sendToOwner };
}

function isWithinCommandRange(
  player: Player,
  companion: Entity,
  commandRange: number,
): boolean {
  if (player.dimension !== companion.dimension) {
    return false;
  }

  const x = player.location.x - companion.location.x;
  const y = player.location.y - companion.location.y;
  const z = player.location.z - companion.location.z;
  return x * x + y * y + z * z <= commandRange ** 2;
}
