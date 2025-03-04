import { GameMode, Player } from "@minecraft/server";

export const consumeXp = (player: Player, amount: number): boolean => {
  if (!player || !amount) {
    return false;
  }
  if (player.getGameMode() === GameMode.creative) {
    return true;
  }
  if (player.getTotalXp() < amount) {
    return false;
  }

  if (player.xpEarnedAtCurrentLevel == 0) {
    player.addLevels(-1);
    player.addExperience(player.totalXpNeededForNextLevel - amount);
  } else {
    player.addExperience(-1 * amount);
  }
  return true;
};

export const consumeLevels = (player: Player, amount: number): boolean => {
  let level = player.level;
  for (let i = 0; i < amount; i++) {
    if (level <= 0) {
      return false;
    }
    player.addLevels(-1);
    level -= 1;
  }
  return true;
};
