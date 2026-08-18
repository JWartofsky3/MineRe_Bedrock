import { Player, RawMessage } from "@minecraft/server";

const FORMAT_CODE = String.fromCharCode(167);

/** Announces that a newly unlocked guide entry is available. */
export function sendGuideDiscoveryMessage(
  player: Player,
  name: RawMessage,
): void {
  player.sendMessage({
    rawtext: [
      { text: "Discovered " },
      { text: `${FORMAT_CODE}b` },
      name,
      { text: `${FORMAT_CODE}r. It has been added to your guide.` },
    ],
  });
}
