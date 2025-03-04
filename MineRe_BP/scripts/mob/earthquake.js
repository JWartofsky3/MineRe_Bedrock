import { system, EntityComponentTypes, EntityDamageCause, } from "@minecraft/server";
import { isFamily } from "./mob_utils";
import { distVector3 } from "util/vector3Functions";
import { throwBy } from "./throwBy";
import { getBlock } from "block/blockUtils";
const RANGE = 1.35;
const EARTHQUAKE_DAMAGE = 5;
const earthquakeSummoners = new Set();
earthquakeSummoners.add("ogre");
earthquakeSummoners.add("yeti");
const earthquakeTargets = new Set();
earthquakeTargets.add("player");
earthquakeTargets.add("iron_golem");
earthquakeTargets.add("irongolem");
earthquakeTargets.add("coppergolem");
earthquakeTargets.add("villager");
earthquakeTargets.add("goblin");
earthquakeTargets.add("wolf");
earthquakeTargets.add("demon");
export function runEarthquake(earthquake) {
    if (earthquake.typeId !== "minere:earthquake" || !earthquake.isValid()) {
        return;
    }
    const dimension = earthquake.dimension;
    const markVariant = earthquake.getComponent(EntityComponentTypes.MarkVariant);
    const under = getBlock(dimension, {
        x: earthquake.location.x,
        y: earthquake.location.y - 1,
        z: earthquake.location.z,
    });
    const at = getBlock(dimension, {
        x: earthquake.location.x,
        y: earthquake.location.y,
        z: earthquake.location.z,
    });
    const check = (id) => {
        return under?.typeId === id || at?.typeId === id;
    };
    // dimension checks
    if (dimension.id === "minecraft:overworld") {
        if (earthquake.location.y < 0) {
            markVariant.value = 1;
        }
        if (earthquake.location.y > 62) {
            markVariant.value = 2;
        }
    }
    if (dimension.id === "minecraft:the_nether") {
        markVariant.value = 8;
    }
    if (dimension.id === "minecraft:the_end") {
        markVariant.value = 9;
    }
    // block checks
    if (check("minecraft:stone")) {
        markVariant.value = 0;
    }
    if (check("minecraft: deepslate")) {
        markVariant.value = 1;
    }
    if (check("minecraft:dirt") || check("minecraft:grass_block")) {
        markVariant.value = 2;
    }
    if (check("minecraft:sand")) {
        markVariant.value = 3;
    }
    if (check("minecraft:red_sand")) {
        markVariant.value = 4;
    }
    if (check("minecraft:snow") ||
        check("minecraft:powdered_snow") ||
        check("minecraft:snow_layer")) {
        markVariant.value = 5;
    }
    if (check("minecraft:ice") ||
        check("minecraft:packed_ice") ||
        check("minecraft:blue_ice") ||
        check("minere:freeze_ice")) {
        markVariant.value = 6;
    }
    if (check("minecraft:gravel")) {
        markVariant.value = 7;
    }
    if (check("minecraft:netherrack")) {
        markVariant.value = 8;
    }
    if (check("minecraft:end_stone")) {
        markVariant.value = 9;
    }
    // trace damage to summoner
    let damagingEntity = earthquake;
    const summoners = dimension.getEntities({
        location: earthquake.location,
        maxDistance: 24,
    });
    summoners.forEach((summoner) => {
        if (isFamily(summoner, earthquakeSummoners)) {
            if (damagingEntity === earthquake ||
                distVector3(summoner.location, earthquake.location) <
                    distVector3(damagingEntity.location, earthquake.location)) {
                damagingEntity = summoner;
            }
        }
    });
    system.runTimeout(() => {
        const entities = dimension.getEntities({
            location: earthquake.location,
            maxDistance: RANGE,
        });
        for (let i = 0; i < entities.length; i++) {
            const target = entities[i];
            if (target.typeId === earthquake.typeId) {
                continue;
            }
            if (!target.isValid()) {
                continue;
            }
            if (!isFamily(target, earthquakeTargets) &&
                isFamily(target, new Set("monster"))) {
                continue;
            }
            target.applyDamage(EARTHQUAKE_DAMAGE, {
                damagingEntity: damagingEntity,
                cause: EntityDamageCause.entityAttack,
            });
            throwBy(earthquake, target, 1.0, 3.0);
        }
    }, 8);
    system.runTimeout(() => {
        if (earthquake?.isValid()) {
            earthquake.remove();
        }
    }, 30);
}
