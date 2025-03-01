import { system, EntityComponentTypes, } from "@minecraft/server";
import { addVector3, directionVector3, distVector3, multiplyVector3Number, } from "util/vector3Functions";
const IS_LEAPING = "is_leaping";
export function rollLeap(attacker, target, minRange, maxRange, vertical, horizontal, attemptDelay, maxAttempts, initialChance, chance) {
    if (Math.random() > initialChance) {
        return;
    }
    if (!attacker.isValid || !target.isValid) {
        return;
    }
    const health = attacker.getComponent(EntityComponentTypes.Health);
    if (health.currentValue <= 0) {
        return;
    }
    if (attacker.getDynamicProperty(IS_LEAPING)) {
        return;
    }
    attacker.setDynamicProperty(IS_LEAPING, true);
    const cleanup = (attacker, run) => {
        system.clearRun(run);
        if (attacker && attacker?.isValid) {
            attacker.setDynamicProperty(IS_LEAPING, false);
        }
    };
    const run = system.runInterval(() => {
        if (Math.random() > chance) {
            return;
        }
        if (!attacker?.isValid || !target?.isValid) {
            return cleanup(attacker, run);
        }
        const health = attacker.getComponent(EntityComponentTypes.Health);
        if (health.currentValue <= 0) {
            return cleanup(attacker, run);
        }
        if (!attacker.isOnGround) {
            return;
        }
        const distance = distVector3(attacker.location, target.location);
        if (distance > maxRange || distance < minRange) {
            return cleanup(attacker, run);
        }
        const jumpVector = addVector3(multiplyVector3Number(directionVector3(target.location, attacker.location), horizontal), { x: 0, y: vertical, z: 0 });
        jumpVector.y = Math.max(Math.min(vertical, jumpVector.y), -jumpVector.y);
        attacker.applyImpulse(jumpVector);
    }, attemptDelay);
    // cleanup
    system.runTimeout(() => {
        cleanup(attacker, run);
    }, maxAttempts * attemptDelay + 1);
}
