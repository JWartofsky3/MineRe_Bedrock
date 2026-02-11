import { Entity, EntityHurtAfterEvent, system } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { castFire } from "functions/castFire";
import { isAlive } from "entities/utilities/common";
import { distVector3 } from "util/vector3Functions";

const FIRE_COOLDOWN_KEY = "minere:demon_fire_cooldown";
const IS_SUMMONER_KEY = "minere:is_summoner";

const FIRE_ROAR_EVENT = "minere:demon_start_roar";

const FIRE_COOLDOWN_TICKS = 160; // 8 seconds at 20 TPS
const FIRE_ACTIVATION_RANGE = 7;
const FIRE_MAX_RANGE = 14;
const FIRE_BEAM_DELAY = 15;
const FIRE_RANDOM_DELAY = 100;

export class Demon extends BaseCustomEntity {
  constructor() {
    super("minere:demon");
  }

  onEntitySpawn = (data: { entity: Entity }): void => {
    const entity = data.entity;
    if (!isAlive(entity)) {
      return;
    }
    rollBecomeSummoner(entity, 0.2);
  };

  onEntityHurt = (data: EntityHurtAfterEvent): void => {
    const demon = data.hurtEntity;
    if (!isAlive(demon)) {
      return;
    }
    const attacker = data.damageSource?.damagingEntity;
    if (!isAlive(attacker)) {
      return;
    }
    const wasProjectile = !!data.damageSource?.damagingProjectile;
    const fireChance = wasProjectile ? 0.33 : 0.25;
    const summonerChance = wasProjectile ? 0.33 : 0.2;
    this.tryCastFire(demon, attacker, fireChance, FIRE_RANDOM_DELAY);
    rollBecomeSummoner(demon, summonerChance);
  };

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const attacker = data.damageSource?.damagingEntity;
    const target = data.hurtEntity;
    if (!isAlive(attacker) || !isAlive(target)) {
      return;
    }
    this.tryCastFire(attacker, target, 0.25, FIRE_RANDOM_DELAY);
  };

  private tryCastFire(
    caster: Entity,
    target: Entity,
    chance: number,
    delayTicks: number,
  ): void {
    if (!isAlive(caster) || !isAlive(target)) {
      return;
    }
    if (Math.random() > chance) {
      return;
    }
    if (distVector3(caster.location, target.location) > FIRE_ACTIVATION_RANGE) {
      return;
    }
    const cooldown = caster.getDynamicProperty(FIRE_COOLDOWN_KEY);
    if (
      typeof cooldown === "number" &&
      system.currentTick - cooldown < FIRE_COOLDOWN_TICKS
    ) {
      return;
    }

    caster.setDynamicProperty(FIRE_COOLDOWN_KEY, system.currentTick);

    system.runTimeout(() => {
      if (!caster?.isValid) {
        return;
      }
      caster.triggerEvent(FIRE_ROAR_EVENT);
      system.runTimeout(() => {
        if (!caster?.isValid || !target?.isValid) {
          return;
        }
        castFire(caster.dimension, caster.location, target.location, {
          maxRange: FIRE_MAX_RANGE,
          delayTicks: 0,
        });
      }, FIRE_BEAM_DELAY);
    }, Math.random() * delayTicks);
  }
}

function rollBecomeSummoner(summoner: Entity, chance: number) {
  if (!summoner) {
    return;
  }
  const isSummoner = summoner.getDynamicProperty(IS_SUMMONER_KEY);

  if (Math.random() > chance) {
    return;
  }
  if (isSummoner?.valueOf() === 1) {
    return;
  }
  summoner.setDynamicProperty(IS_SUMMONER_KEY, 1);

  // DO NOT REMOVE THIS DUMB DUMB
  summoner.triggerEvent("become_summoner");
}
