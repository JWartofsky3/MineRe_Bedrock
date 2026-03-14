import {
  Entity,
  EntityComponentTypes,
  EntityProjectileComponent,
  system,
} from "@minecraft/server";
import { isFamilySet } from "./mob_utils";
import { magnitudeVector3 } from "util/vector3Functions";

const IS_STRAFING = "minere:is_strafing";
const STRAFE_FORCE = 0.06;
const ANGLE_CHANGE = 3;
const DURATION_MIN = 1;
const DURATION_MAX = 4;

const validTypes = new Set<string>();
validTypes.add("minecraft:skeleton");
validTypes.add("minecraft:stray");
validTypes.add("minecraft:bogged");
validTypes.add("minecraft:parched");
validTypes.add("minecraft:goblin");

export function skeletonStrafe(entity: Entity, chance: number) {
  if (Math.random() > chance) {
    return;
  }
  if (entity.typeId !== "minecraft:arrow") {
    return;
  }
  const projectileComponent = entity.getComponent(
    EntityComponentTypes.Projectile,
  ) as EntityProjectileComponent;
  const owner = projectileComponent?.owner;
  if (!owner) {
    return;
  }

  // validate shooter belongs to a valid type
  if (!validTypes.has(owner.typeId)) {
    return;
  }

  // check if shooter is already strafing
  const isStrafing = owner.getDynamicProperty(IS_STRAFING);
  if (isStrafing) {
    return;
  }
  owner.setDynamicProperty(IS_STRAFING, true);

  // start strafing
  let angle = Math.random() * 360;
  const dir = Math.random() > 0.5 ? 1 : -1;
  const runner = system.runInterval(() => {
    if (
      !owner.isValid ||
      !owner.isOnGround ||
      owner.isInWater ||
      owner.isClimbing ||
      owner.location.y <= owner.dimension.heightRange.min ||
      !owner.getDynamicProperty(IS_STRAFING)
    ) {
      endStrafe(owner, runner);
      return;
    }
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const blockAt = owner.dimension.getBlock({
          x: owner.location.x + i,
          y: owner.location.y - 1,
          z: owner.location.z + j,
        });
        if (!blockAt || blockAt.isAir || blockAt.isLiquid) {
          endStrafe(owner, runner);
          return;
        }
      }
    }
    const strafeDirRadians = angle * (Math.PI / 180);
    if (magnitudeVector3(owner.getVelocity()) < 0.15) {
      owner.applyImpulse({
        x: Math.cos(strafeDirRadians) * STRAFE_FORCE,
        y: 0,
        z: Math.sin(strafeDirRadians) * STRAFE_FORCE,
      });
    }
    angle += ANGLE_CHANGE * dir;
  });

  // cleanup
  system.runTimeout(
    () => {
      endStrafe(owner, runner);
    },
    20 * DURATION_MIN + 20 * DURATION_MAX * Math.random(),
  );
}

function endStrafe(owner: Entity, runner: number) {
  system.clearRun(runner);
  if (owner?.isValid) {
    owner.setDynamicProperty(IS_STRAFING, false);
  }
}
