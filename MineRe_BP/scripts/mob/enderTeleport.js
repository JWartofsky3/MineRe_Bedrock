import { world, system, EntityComponentTypes, } from "@minecraft/server";
import { spawnParticleCloud } from "particles/particleCloud";
import { addVector3, randomVector3 } from "util/vector3Functions";
export const enderRandomTeleport = (target, dist, chance, delay) => {
    if (Math.random() > chance) {
        return;
    }
    const health = target.getComponent(EntityComponentTypes.Health);
    if (!!health && health.currentValue <= 0) {
        return;
    }
    const dimension = world.getDimension(target.dimension.id);
    if (!dimension) {
        return;
    }
    system.runTimeout(() => {
        let pos = null;
        let foundValidLocation = false;
        let baseLocation = target.location;
        for (let i = 0; i < 3; i++) {
            pos = addVector3(baseLocation, randomVector3(dist));
            pos.y = Math.max(baseLocation.y, pos.y);
            if (pos.y < dimension.heightRange.min ||
                pos.y > dimension.heightRange.max) {
                continue;
            }
            if (dimension.getBlock(pos) && dimension.getBlock(pos).isAir) {
                foundValidLocation = true;
                break;
            }
        }
        if (!foundValidLocation) {
            return;
        }
        enderTeleport(target, pos);
    }, delay ?? 0);
};
export function enderTeleport(entity, end) {
    const dimension = entity?.dimension;
    if (!dimension) {
        return;
    }
    dimension.playSound("mob.endermen.portal", entity.location, {
        volume: 2.0,
    });
    spawnParticleCloud("minecraft:end_chest", entity.location, 2, 50, dimension);
    entity.teleport(end);
    system.runTimeout(() => {
        dimension.playSound("mob.endermen.portal", end, {
            volume: 2.0,
        });
        spawnParticleCloud("minecraft:end_chest", entity.location, 2, 50, dimension);
    }, 2);
}
