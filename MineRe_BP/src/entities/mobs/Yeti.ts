import { Entity, EntityHurtAfterEvent, system } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { throwEntity } from "entities/functions/throw";
import {
  addVector3,
  directionVector3,
  distVector3,
  multiplyVector3Number,
} from "util/vector3Functions";
import { isAlive } from "entities/utilities/common";
const IS_LEAPING = "minere:is_leaping";

const THROW_DISTANCE_SCALE = 1.25;
const THROW_VERTICAL = 1.0;

const LEAP_MIN_RANGE = 3;
const LEAP_MAX_RANGE = 24;
const LEAP_VERTICAL = 1;
const LEAP_HORIZONTAL = 1;
const LEAP_ATTEMPT_DELAY = 20;
const LEAP_MAX_ATTEMPTS = 6;
const LEAP_INITIAL_CHANCE = 0.4;
const LEAP_CHANCE = 0.2;

export class Yeti extends BaseCustomEntity {
  constructor() {
    super("minere:yeti");
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const attacker = data.damageSource?.damagingEntity;
    const target = data.hurtEntity;
    if (!isAlive(attacker) || !isAlive(target)) {
      return;
    }
    throwEntity(
      attacker.location,
      target,
      THROW_DISTANCE_SCALE,
      THROW_VERTICAL,
    );
    this.rollLeap(attacker, target);
  };

  onEntityHurt = (data: EntityHurtAfterEvent): void => {
    const target = data.hurtEntity;
    const attacker = data.damageSource?.damagingEntity;
    if (!isAlive(target) || !isAlive(attacker)) {
      return;
    }
    this.rollLeap(target, attacker);
  };

  private rollLeap(attacker: Entity, target: Entity): void {
    if (Math.random() > LEAP_INITIAL_CHANCE) {
      return;
    }
    if (!isAlive(attacker) || !isAlive(target)) {
      return;
    }
    if (attacker.getDynamicProperty(IS_LEAPING)) {
      return;
    }
    attacker.setDynamicProperty(IS_LEAPING, true);

    const cleanup = (runner: number) => {
      system.clearRun(runner);
      if (attacker?.isValid) {
        attacker.setDynamicProperty(IS_LEAPING, false);
      }
    };

    const runner = system.runInterval(() => {
      if (Math.random() > LEAP_CHANCE) {
        return;
      }
      if (!isAlive(attacker) || !isAlive(target)) {
        return cleanup(runner);
      }
      if (!attacker.isOnGround) {
        return;
      }
      const distance = distVector3(attacker.location, target.location);
      if (distance > LEAP_MAX_RANGE || distance < LEAP_MIN_RANGE) {
        return cleanup(runner);
      }
      const jumpVector = addVector3(
        multiplyVector3Number(
          directionVector3(target.location, attacker.location),
          LEAP_HORIZONTAL,
        ),
        { x: 0, y: LEAP_VERTICAL, z: 0 },
      );
      jumpVector.y = Math.max(
        Math.min(LEAP_VERTICAL, jumpVector.y),
        -jumpVector.y,
      );
      attacker.applyImpulse(jumpVector);
    }, LEAP_ATTEMPT_DELAY);

    system.runTimeout(
      () => {
        cleanup(runner);
      },
      LEAP_MAX_ATTEMPTS * LEAP_ATTEMPT_DELAY + 1,
    );
  }
}
