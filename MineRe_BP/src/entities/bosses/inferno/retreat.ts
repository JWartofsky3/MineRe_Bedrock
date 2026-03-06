import { Entity, system } from "@minecraft/server";
import {
  directionVector3,
  distVector3,
  magnitudeVector3,
  multiplyVector3Number,
} from "util/vector3Functions";

type InfernoRetreatDynamicProperties = {
  RETREAT_RUNNER: string;
};

type InfernoRetreatMovementProperties = {
  RETREAT_DISTANCE: number;
  RETREAT_FORCE: number;
  RETREAT_TICKS: number;
  MAX_VELOCITY: number;
};

type InfernoRetreatOptions = {
  entity: Entity;
  target: Entity;
  getMode: (entity: Entity) => number;
  meleeMode: number;
  dynamicProperties: InfernoRetreatDynamicProperties;
  movementProperties: InfernoRetreatMovementProperties;
};

export function tryInfernoRetreat(options: InfernoRetreatOptions): void {
  const {
    entity,
    target,
    getMode,
    meleeMode,
    dynamicProperties,
    movementProperties,
  } = options;
  const existing = entity.getDynamicProperty(dynamicProperties.RETREAT_RUNNER);
  if (typeof existing === "number") {
    return;
  }

  const dir = directionVector3(target.location, entity.location);
  let ticks = 0;
  const runner = system.runInterval(() => {
    if (!entity?.isValid || !target?.isValid) {
      system.clearRun(runner);
      entity.setDynamicProperty(dynamicProperties.RETREAT_RUNNER, undefined);
      return;
    }
    if (getMode(entity) !== meleeMode) {
      system.clearRun(runner);
      entity.setDynamicProperty(dynamicProperties.RETREAT_RUNNER, undefined);
      return;
    }
    const distance = distVector3(entity.location, target.location);
    if (distance >= movementProperties.RETREAT_DISTANCE) {
      system.clearRun(runner);
      entity.setDynamicProperty(dynamicProperties.RETREAT_RUNNER, undefined);
      return;
    }
    const impulse = multiplyVector3Number(
      dir,
      -movementProperties.RETREAT_FORCE,
    );
    impulse.y = 0.1;
    if (
      magnitudeVector3(entity.getVelocity()) < movementProperties.MAX_VELOCITY
    ) {
      entity.applyImpulse(impulse);
    }
    ticks += 1;
    if (ticks >= movementProperties.RETREAT_TICKS) {
      system.clearRun(runner);
      entity.setDynamicProperty(dynamicProperties.RETREAT_RUNNER, undefined);
    }
  }, 1);
  entity.setDynamicProperty(dynamicProperties.RETREAT_RUNNER, runner);
}
