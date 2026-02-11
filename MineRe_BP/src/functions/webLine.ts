import { Dimension, Vector3, system } from "@minecraft/server";
import {
  addVector3,
  directionVector3,
  multiplyVector3Number,
  randomVector3,
} from "util/vector3Functions";

export type WebLineOptions = {
  maxRange?: number;
  stepTicks?: number;
  randomOffset?: number;
  verticalOffset?: number;
  webLifetimeTicks?: number;
};

export function webLine(
  dimension: Dimension,
  origin: Vector3,
  target: Vector3,
  options: WebLineOptions = {},
): void {
  const {
    maxRange = 6,
    stepTicks = 3,
    randomOffset = 1.0,
    verticalOffset = 0.25,
    webLifetimeTicks = 400,
  } = options;

  const dir = directionVector3(target, origin);

  for (let i = 1; i <= maxRange; i++) {
    const pos = addVector3(
      addVector3(
        addVector3(origin, multiplyVector3Number(dir, i)),
        randomVector3(randomOffset),
      ),
      { x: 0, y: verticalOffset, z: 0 },
    );

    system.runTimeout(() => {
      if (
        pos.y < dimension.heightRange.min ||
        pos.y > dimension.heightRange.max
      ) {
        return;
      }
      const block = dimension.getBlock(pos);
      if (block.isAir) {
        dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} web`);
        system.runTimeout(
          () => {
            dimension.runCommand(
              `fill ${pos.x} ${pos.y} ${pos.z} ${pos.x} ${pos.y} ${pos.z} air replace web`,
            );
          },
          webLifetimeTicks + Math.random() * 200,
        );
      }
    }, i * stepTicks);
  }
}
