// import { system, Entity, EntityComponentTypes, EntityHealthComponent } from "@minecraft/server";
// const LIGHTNING_RUNNER = "minere:lightning_runner";
// const LIGHTNING_COOLDOWN = "minere:lightning_cooldown";
// const RUN_DURATION = 240 * 20;
// const RUN_INTERVAL = 8 * 20;
// const COOLDOWN_MIN = 30
// export function dragonLightning(dragon: Entity) {
//     if (!dragon.isValid) {
//         return;
//     }
//     const lightningRunning = dragon.getDynamicProperty("LIGHTNING_RUNNER");
//     if (lightningRunning.valueOf()) {
//         return;
//     }
//     dragon.setDynamicProperty(LIGHTNING_RUNNER, true);
//     const run = system.runInterval(() => {
//         const health = dragon.getComponent(EntityComponentTypes.Health) as EntityHealthComponent;
//         if (health?.currentValue <= 0) {
//             system.clearRun(run);
//             return;
//         }
//         const percentHealth = (health.effectiveMax - health.currentValue)/health.effectiveMax;
//         const chance = 0.02 + percentHealth * 0.48;
//     }, RUN_INTERVAL);
//     system.runTimeout(() => {
//         system.clearRun(run);
//     }, RUN_DURATION);
// }
