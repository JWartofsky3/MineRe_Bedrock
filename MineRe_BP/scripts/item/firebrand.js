import { ItemComponentTypes, EntityComponentTypes, } from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";
import { multiplyVector3Number } from "util/vector3Functions";
const DURABILITY_COST = 3;
const RESISTANCE_DURATION = 3;
export const Firebrand = {
    onHitEntity(arg) {
        if (!arg.hadEffect) {
            return;
        }
        arg.hitEntity.setOnFire(10);
    },
    onUse(arg) {
        const cooldownComponent = arg.itemStack?.getComponent(ItemComponentTypes.Cooldown);
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
        const fireball = dimension.spawnEntity("minere:firebrand_fireball", loc);
        arg.source.addEffect("fire_resistance", 20 * RESISTANCE_DURATION, {
            showParticles: false,
        });
        const proj = fireball.getComponent(EntityComponentTypes.Projectile);
        proj.owner = arg.source;
        fireball.applyImpulse(multiplyVector3Number(arg.source.getViewDirection(), 3.0));
    },
};
