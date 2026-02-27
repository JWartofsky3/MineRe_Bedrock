import {
  ItemComponentTypes,
  EntityComponentTypes,
  system,
} from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";
import { multiplyVector3Number, rotateVectorY } from "util/vector3Functions";
const DURABILITY_COST = 2;
export const Windforce = {
  onHitEntity(arg) {
    if (!arg.hadEffect) {
      return;
    }
    throw (arg.attackingEntity.location, arg.hitEntity, 1.5, 0.75);
  },
  onUse(arg) {
    const cooldownComponent = arg.itemStack?.getComponent(
      ItemComponentTypes.Cooldown,
    );
    if (cooldownComponent) {
      cooldownComponent.startCooldown(arg.source);
    }
    const dimension = arg.source.dimension;
    reduceDurability(arg.source, arg.itemStack, DURABILITY_COST);
    for (let i = -1; i <= 1; i++) {
      system.runTimeout(
        () => {
          const loc = {
            x: arg.source.location.x + arg.source.getViewDirection().x * 1.5,
            y:
              arg.source.location.y +
              1.5 +
              arg.source.getViewDirection().y * 1.5,
            z: arg.source.location.z + arg.source.getViewDirection().z * 1.5,
          };
          dimension.playSound("mob.breeze.shoot", arg.source.location);
          const baseDir = arg.source.getViewDirection();
          const angle = i * 10; // -10°, 0°, +10°
          const dir = rotateVectorY(baseDir, angle);
          const windCharge = dimension.spawnEntity(
            "minecraft:wind_charge_projectile",
            loc,
          );
          const proj = windCharge.getComponent(EntityComponentTypes.Projectile);
          proj.owner = arg.source;
          // apply impulse along rotated direction
          windCharge.applyImpulse(multiplyVector3Number(dir, 3.0));
        },
        (i + 1) * 2,
      );
    }
  },
};
