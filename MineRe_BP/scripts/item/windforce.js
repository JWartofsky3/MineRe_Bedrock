import { ItemComponentTypes, EntityComponentTypes, } from "@minecraft/server";
import { reduceDurability } from "./reduce_durability";
import { multiplyVector3Number } from "util/vector3Functions";
import { throwBy } from "mob/throwBy";
const DURABILITY_COST = 2;
export const Windforce = {
    onHitEntity(arg) {
        if (!arg.hadEffect) {
            return;
        }
        throwBy(arg.attackingEntity, arg.hitEntity, 1.5, 0.75);
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
        dimension.playSound("mob.breeze.shoot", arg.source.location);
        const windCharge = dimension.spawnEntity("minecraft:wind_charge_projectile", loc);
        const proj = windCharge.getComponent(EntityComponentTypes.Projectile);
        proj.owner = arg.source;
        windCharge.applyImpulse(multiplyVector3Number(arg.source.getViewDirection(), 3.0));
    },
};
