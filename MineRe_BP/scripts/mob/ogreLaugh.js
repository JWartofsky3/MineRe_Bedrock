import { system, EntityComponentTypes, } from "@minecraft/server";
import { isAlive } from "./mob_utils";
export function ogreLaugh(ogre, deadEntity) {
    if (!ogre || ogre.typeId !== "minere:ogre") {
        return;
    }
    if (!isAlive(ogre)) {
        return;
    }
    const health = deadEntity?.getComponent(EntityComponentTypes.Health);
    if (health?.effectiveMax < 10) {
        return;
    }
    system.runTimeout(() => {
        if (ogre !== null) {
            ogre.dimension.playSound("mob.ogre.laugh", ogre.location);
        }
    }, 3);
}
