import { Entity, system } from "@minecraft/server";
import { directionVector3, multiplyVector3Number } from "util/vector3Functions";

type InfernoStrafeDynamicProperties = {
  STRAFE_RUNNER: string;
};

type InfernoStrafeMovementProperties = {
  STRAFE_FORCE: number;
  STRAFE_TICKS: number;
};

type InfernoStrafeOptions = {
  entity: Entity;
  target: Entity;
  getMode: (entity: Entity) => number;
  rangedMode: number;
  dynamicProperties: InfernoStrafeDynamicProperties;
  movementProperties: InfernoStrafeMovementProperties;
};

export function tryInfernoStrafe(options: InfernoStrafeOptions): void {
  const {
    entity,
    target,
    getMode,
    rangedMode,
    dynamicProperties,
    movementProperties,
  } = options;
  const existing = entity.getDynamicProperty(dynamicProperties.STRAFE_RUNNER);
  if (typeof existing === "number") {
    return;
  }

  const dir = directionVector3(target.location, entity.location);
  const strafeDir = Math.random() < 0.5 ? 1 : -1;
  const strafe = { x: -dir.z * strafeDir, y: 0, z: dir.x * strafeDir };
  let ticks = 0;
  const runner = system.runInterval(() => {
    if (!entity?.isValid || !target?.isValid) {
      system.clearRun(runner);
      entity.setDynamicProperty(dynamicProperties.STRAFE_RUNNER, undefined);
      return;
    }
    if (getMode(entity) !== rangedMode) {
      system.clearRun(runner);
      entity.setDynamicProperty(dynamicProperties.STRAFE_RUNNER, undefined);
      return;
    }
    entity.applyImpulse(
      multiplyVector3Number(strafe, movementProperties.STRAFE_FORCE),
    );
    ticks += 1;
    if (ticks >= movementProperties.STRAFE_TICKS) {
      system.clearRun(runner);
      entity.setDynamicProperty(dynamicProperties.STRAFE_RUNNER, undefined);
    }
  }, 1);
  entity.setDynamicProperty(dynamicProperties.STRAFE_RUNNER, runner);
}
