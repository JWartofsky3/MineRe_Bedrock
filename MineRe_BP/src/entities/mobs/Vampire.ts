import {
  Entity,
  EntityComponentTypes,
  EntityHealthComponent,
  EntityHurtAfterEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { applyToolDamageBonus } from "entities/functions/applyDamageBonus";
import { lifesteal } from "entities/functions/lifesteal";
import { isAlive } from "entities/utilities/common";
import { DEFAULT_TICK } from "main";
import {
  addVector3,
  getRandomAir,
  multiplyVector3Number,
} from "util/vector3Functions";

const LIFESTEAL_AMOUNT = 3;
const GOLD_DAMAGE_BONUS = 6;
const GOLD_PREFIX = "gold:";
const BAT_COOLDOWN_KEY = "minere:bat_mode_cooldown";
const BAT_COOLDOWN_TIME = 8;
const BECOME_BAT_CHANCE = 0.33;
const BECOME_BAT_MIN_HEALTH = 0.5;

export class Vampire extends BaseCustomEntity {
  constructor() {
    super("minere:vampire");
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    const attacker = data.damageSource?.damagingEntity;
    const target = data.hurtEntity;
    if (!isAlive(attacker) || !isAlive(target)) {
      return;
    }
    lifesteal(attacker, target, {
      lifesteal: LIFESTEAL_AMOUNT,
      subtractHealth: false,
    });
  };

  onEntityHurt = (data: EntityHurtAfterEvent): void => {
    const target = data.hurtEntity;
    const attacker = data.damageSource?.damagingEntity;
    if (!target?.isValid) {
      return;
    }
    applyToolDamageBonus(target, attacker, GOLD_DAMAGE_BONUS, GOLD_PREFIX);
    if (data.damageSource?.damagingProjectile || attacker) {
      rollBecomeBat(target, BECOME_BAT_CHANCE, BECOME_BAT_MIN_HEALTH);
    }
  };
}

export function rollBecomeBat(
  entity: Entity,
  chance: number,
  minHealth: number,
) {
  if (!entity) {
    return;
  }

  const health = entity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health) {
    return;
  }
  if (
    health.currentValue > minHealth * health.effectiveMax ||
    health.currentValue <= health.effectiveMin
  ) {
    return;
  }

  const dimension = entity.dimension;

  if (Math.random() > chance) {
    return;
  }
  const cooldown = entity.getDynamicProperty(BAT_COOLDOWN_KEY);
  if (
    !!cooldown &&
    typeof cooldown == "number" &&
    system.currentTick - cooldown < BAT_COOLDOWN_TIME * DEFAULT_TICK
  ) {
    return;
  }
  entity.setDynamicProperty(BAT_COOLDOWN_KEY, system.currentTick);

  const pos = getRandomAir(entity.location, entity.dimension, 2.0, 3);
  if (pos) {
    dimension.spawnParticle("minere:big_smoke", entity.location);
    dimension.spawnParticle(
      "minere:big_smoke",
      multiplyVector3Number(addVector3(entity.location, pos), 0.5),
    );
    dimension.spawnParticle("minere:big_smoke", pos);
    entity.teleport(pos);
    dimension.playSound("mob.bat.takeoff", pos);
    entity.triggerEvent("become_bat");
  }
}
