import { world, system } from "@minecraft/server";
import { getRandomIntInclusive } from "util/mathFunctions";
const RUNNER_PROPERTY = "minere:inferno_runner";
const RUNNER_TICK = 100;
world.afterEvents.entityLoad.subscribe((data) => { });
function startRunner(entity) {
    if (!entity?.isValid || !(entity?.typeId === "minere:inferno")) {
        return;
    }
    const property = entity.getDynamicProperty(RUNNER_PROPERTY);
    if (property && typeof property === "number") {
        system.clearRun(property);
    }
    const runner = system.runInterval(() => {
        const rand = getRandomIntInclusive(0, 5);
        switch (rand) {
            case 0:
                entity.triggerEvent("switch_to_ranged");
                break;
            case 1:
                entity.triggerEvent("switch_to_melee");
                break;
            case 2:
                entity.triggerEvent("switch_to_ranged");
                break;
            case 3:
                entity.triggerEvent("switch_to_stomp");
                break;
            case 4:
                entity.triggerEvent("switch_to_guard");
                break;
            case 5:
                entity.triggerEvent("switch_to_stunned");
                break;
        }
    }, RUNNER_TICK);
    entity.setDynamicProperty(RUNNER_PROPERTY, runner);
}
