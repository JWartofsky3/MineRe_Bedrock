import {
  EntityComponentTypes,
  ItemComponentTypes,
  ItemCooldownComponent,
  ItemCustomComponent,
} from "@minecraft/server";
import { throwEntity } from "entities/functions/throw";
import { reduceDurability } from "./reduce_durability";
import { multiplyVector3Number } from "util/vector3Functions";

const DURABILITY_COST = 2;

export const WindShovel: ItemCustomComponent = {
  onHitEntity(arg) {
    if (!arg.hadEffect) {
      return;
    }
    throwEntity(arg.attackingEntity.location, arg.hitEntity, 1.25, 0.5);
  },
  onUse(arg) {
    const cooldownComponent = arg.itemStack?.getComponent(
      ItemComponentTypes.Cooldown,
    ) as ItemCooldownComponent;
    if (cooldownComponent) {
      cooldownComponent.startCooldown(arg.source);
    }

    const dimension = arg.source.dimension;
    const baseDir = arg.source.getViewDirection();
    const loc = {
      x: arg.source.location.x + baseDir.x * 1.5,
      y: arg.source.location.y + 1.5 + baseDir.y * 1.5,
      z: arg.source.location.z + baseDir.z * 1.5,
    };

    reduceDurability(arg.source, arg.itemStack, DURABILITY_COST);
    dimension.playSound("mob.breeze.shoot", arg.source.location);

    const windCharge = dimension.spawnEntity(
      "minecraft:wind_charge_projectile",
      loc,
    );
    const projectile = windCharge.getComponent(EntityComponentTypes.Projectile);

    if (!projectile) {
      return;
    }

    projectile.owner = arg.source;
    windCharge.applyImpulse(multiplyVector3Number(baseDir, 3.0));
  },
};
