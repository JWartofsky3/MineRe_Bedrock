import { ItemCustomComponent } from "@minecraft/server";

const SECONDS_TO_TICKS = 20;

export const IndigonApple: ItemCustomComponent = {
  onCompleteUse(arg) {
    const player = arg.source;
    const itemId = arg.itemStack?.typeId;

    if (itemId === "minere:enchanted_indigon_apple") {
      player.addEffect("strength", 30 * SECONDS_TO_TICKS, {
        amplifier: 3,
      });
      player.addEffect("speed", 30 * SECONDS_TO_TICKS, {
        amplifier: 2,
      });
      player.addEffect("jump_boost", 30 * SECONDS_TO_TICKS, {
        amplifier: 5,
      });
      player.addEffect("levitation", 4 * SECONDS_TO_TICKS, {
        amplifier: 0,
      });
      player.addEffect("nausea", 4 * SECONDS_TO_TICKS, {
        amplifier: 2,
      });
      return;
    }

    player.addEffect("strength", 20 * SECONDS_TO_TICKS, {
      amplifier: 1,
    });
    player.addEffect("jump_boost", 20 * SECONDS_TO_TICKS, {
      amplifier: 0,
    });
    player.addEffect("speed", 5 * SECONDS_TO_TICKS, {
      amplifier: 2,
    });
  },
};
