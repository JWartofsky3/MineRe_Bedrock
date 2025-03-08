import { replaceableBlocks } from "block/blockUtils";
export const PlatformPath = {
  onUse(arg) {
    const player = arg.source;
    const dimension = player.dimension;
    const location = player.location;
    const y = location.y - 1;
    if (y < dimension.heightRange.min || y > dimension.heightRange.max) {
      dimension.playSound("item.amethyst_staff.error", player.location);
      return;
    }
    const block = dimension.getBlock({
      x: location.x,
      y: y,
      z: location.z,
    });
    if (!block.isAir) {
      dimension.playSound("item.amethyst_staff.error", player.location);
      return;
    }
    dimension.playSound("step.amethyst_block", player.location);
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const targetPos = {
          x: location.x + x,
          y: y,
          z: location.z + z,
        };
        const blockAt = dimension.getBlock(targetPos);
        if (
          !blockAt ||
          blockAt.isAir ||
          replaceableBlocks.has(blockAt?.typeId)
        ) {
          dimension.setBlockType(targetPos, "minere:end_crystalline");
        }
      }
    }
    player.teleport(player.location);
    if (player.getGameMode() !== "creative") {
      player.runCommand("clear @s[m=!c] minere:end_path 0 1");
    }
  },
};
