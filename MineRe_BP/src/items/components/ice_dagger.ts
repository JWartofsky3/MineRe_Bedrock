import { EntityDamageCause, ItemCustomComponent } from "@minecraft/server";
import { Inferno } from "entities/bosses/inferno/Inferno";
import { checkCooldown } from "./item_utils";
import { freezeEntity } from "entities/functions/freeze";
import { isAlive } from "mob/mob_utils";
import { spawnParticleCloud } from "particles/particleCloud";

const FIRE_MOBS = new Set<string>(["minecraft:blaze", "minere:inferno"]);
const FIRE_MOB_DAMAGE = 20;
const INFERNO_STUN_CHANCE = 0.5;

export const IceDagger: ItemCustomComponent = {
  onHitEntity(arg) {
    const target = arg.hitEntity;
    if (!isAlive(target)) {
      return;
    }
    if (target.typeId.includes("freeze")) {
      return;
    }
    target.addEffect("slowness", 160, {
      amplifier: 0,
    });
    if (!checkCooldown(arg.itemStack, arg.attackingEntity)) {
      return;
    }
    target.addEffect("slowness", 160, {
      amplifier: 3,
    });
    freezeEntity(target, 22);
    if (target.typeId === "minere:inferno" && Math.random() < INFERNO_STUN_CHANCE) {
      Inferno.enterStunned(target);
    }
    if (FIRE_MOBS.has(target.typeId)) {
      target.applyDamage(FIRE_MOB_DAMAGE, {
        damagingEntity: arg.attackingEntity,
        cause: EntityDamageCause.magic,
      });
      target.dimension.playSound("mob.freeze.freeze", target?.location);
      target.dimension.spawnParticle("minere:ice_charge_particles_short", target.location);
    }
  },
};
