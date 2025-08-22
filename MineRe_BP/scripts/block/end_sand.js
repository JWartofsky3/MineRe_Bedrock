import { system } from "@minecraft/server";
const EFFECT_DURATION = 40;
export const endSand = {
  onEntityFallOn(arg) {
    const entity = arg.entity;
    if (entity?.typeId === "minecraft:player") {
      entity.addEffect("jump_boost", EFFECT_DURATION, {
        amplifier: 2,
        showParticles: false,
      });
      const runner = system.runInterval(() => {
        if (
          entity?.isValid &&
          entity.location.y > entity.dimension.heightRange.min + 1
        ) {
          const block = entity.dimension.getBlock({
            x: entity.location.x,
            y: entity.location.y - 1,
            z: entity.location.z,
          });
          if (
            block.isValid &&
            !block.isAir &&
            block.typeId !== "minere:end_sand"
          ) {
            entity.removeEffect("jump_boost");
          }
        }
      }, 3);
      system.runTimeout(() => {
        system.clearRun(runner);
      }, EFFECT_DURATION);
    }
  },
};
