import { Dimension, system, Vector3 } from "@minecraft/server";
import {
  addVector3,
  directionVector3,
  multiplyVector3Number,
  randomVector3,
} from "util/vector3Functions";

export type CastFireOptions = {
  maxRange?: number;
  fireTicks?: number;
  delayTicks?: number;
  soundId?: string;
  soundVolume?: number;
  soundPitch?: number;
};

// Casts a fire beam from origin toward target and places fire on valid ground.
export function castFire(
  dimension: Dimension,
  origin: Vector3,
  target: Vector3,
  options: CastFireOptions = {},
): void {
  const {
    maxRange = 14,
    fireTicks = 3,
    delayTicks = 0,
    soundId = "mob.ghast.fireball",
    soundVolume = 0.25,
    soundPitch = 1.25,
  } = options;

  system.runTimeout(() => {
    const dir = directionVector3(target, origin);

    for (let i = 1; i <= maxRange; i++) {
      system.runTimeout(() => {
        let isSuccessful = false;
        for (let k = 0; k < 3; k++) {
          if (isSuccessful) {
            break;
          }
          const pos = addVector3(
            addVector3(
              addVector3(origin, multiplyVector3Number(dir, i)),
              randomVector3(1.5),
            ),
            { x: 0, y: 1.0, z: 0 },
          );
          if (
            pos.y < dimension.heightRange.min ||
            pos.y > dimension.heightRange.max
          ) {
            return;
          }
          for (let j = -4; j < 8; j++) {
            if (pos.y - j - 1 <= dimension.heightRange.min) {
              break;
            }
            if (pos.y - j >= dimension.heightRange.max) {
              continue;
            }
            const block = dimension.getBlock({
              x: pos.x,
              y: pos.y - j,
              z: pos.z,
            });
            const below = dimension.getBlock({
              x: pos.x,
              y: pos.y - j - 1,
              z: pos.z,
            });
            if (
              block.isValid &&
              below.isValid &&
              block.isAir &&
              !below.isAir &&
              !below.isLiquid &&
              below.typeId !== "minecraft:fire"
            ) {
              dimension.playSound(soundId, pos, {
                volume: soundVolume,
                pitch: soundPitch,
              });
              dimension.runCommand(
                `setblock ${block.location.x} ${block.location.y} ${block.location.z} fire`,
              );
              isSuccessful = true;
              break;
            }
          }
        }
      }, i * fireTicks);
    }
  }, Math.random() * delayTicks);
}
