import {
  ItemCustomComponent,
  ItemComponentTypes,
  ItemCooldownComponent,
  EntityComponentTypes,
  EntityProjectileComponent,
} from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";
import { multiplyVector3Number } from "util/vector3Functions";
import { getEnchantmentLevel } from "./item_utils";

const DURABILITY_COST = 3;
const RESISTANCE_DURATION = 3;

export const Firebrand: ItemCustomComponent = {
  onHitEntity(arg) {
    if (!arg.hadEffect) {
      return;
    }
    const fireAspectLevel = getEnchantmentLevel(
      arg.attackingEntity,
      "fire_aspect",
    );
    arg.hitEntity.setOnFire(8 + fireAspectLevel * 4);
  },
  onUse(arg) {
    const cooldownComponent = arg.itemStack?.getComponent(
      ItemComponentTypes.Cooldown,
    ) as ItemCooldownComponent;
    if (cooldownComponent) {
      cooldownComponent.startCooldown(arg.source);
    }
    const dimension = arg.source.dimension;
    const loc = {
      x: arg.source.location.x + arg.source.getViewDirection().x * 1.5,
      y: arg.source.location.y + 1.5 + arg.source.getViewDirection().y * 1.5,
      z: arg.source.location.z + arg.source.getViewDirection().z * 1.5,
    };
    reduceDurability(arg.source, arg.itemStack, DURABILITY_COST);
    dimension.playSound("mob.ghast.fireball", arg.source.location, {
      volume: 0.5,
    });
    const fireball = dimension.spawnEntity<string>("minere:firebrand_fireball", loc);
    arg.source.addEffect("fire_resistance", 20 * RESISTANCE_DURATION, {
      showParticles: false,
    });
    const proj = fireball.getComponent(
      EntityComponentTypes.Projectile,
    ) as EntityProjectileComponent;
    proj.owner = arg.source;
    const fireAspectLevel = getEnchantmentLevel(arg.source, "fire_aspect");
    fireball.applyImpulse(
      multiplyVector3Number(
        arg.source.getViewDirection(),
        1.5 + fireAspectLevel * 0.75,
      ),
    );
  },
};
