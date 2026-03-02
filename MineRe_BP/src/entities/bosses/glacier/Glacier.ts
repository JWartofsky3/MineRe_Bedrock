import {
  Entity,
  EntityComponentTypes,
  EntityDamageCause,
  EntityHurtAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { isOffCooldown } from "entities/functions/checkCooldown";
import { isAlive } from "mob/mob_utils";
import { distVector3 } from "util/vector3Functions";

const GLACIER_TYPE_ID = "minere:glacier";
const TICK_INTERVAL: [number, number] = [16, 24];
const TARGET_FAMILIES = ["player", "villager", "irongolem"];

enum GlacierMode {
  Ranged = 0,
  Melee = 1,
}

const MODE_PROPERTIES = {
  MODE_PROPERTY: "minere:mode",
  COOLDOWN_PROPERTY: "minere:mode_change_cooldown",
  COOLDOWN: 20 * 5,
  CHANCE: 0.33,
  RANGE_BRACKETS: 8,
  MODE_WEIGHTS: [
    new Map<GlacierMode, number>([
      [GlacierMode.Ranged, 2],
      [GlacierMode.Melee, 8],
    ]),
    new Map<GlacierMode, number>([
      [GlacierMode.Ranged, 5],
      [GlacierMode.Melee, 5],
    ]),
    new Map<GlacierMode, number>([
      [GlacierMode.Ranged, 8],
      [GlacierMode.Melee, 2],
    ]),
  ] as Map<GlacierMode, number>[],
  EVENT_MAP: new Map<GlacierMode, string>([
    [GlacierMode.Ranged, "minere:switch_to_ranged"],
    [GlacierMode.Melee, "minere:switch_to_melee"],
  ]),
};

const ROAR_PROPERTIES = {
  PROP: "minere:glacier_roar_cooldown",
  COOLDOWN: 20 * 8,
  CHANCE: 0.125,
  ACTIVATION_RANGE: 8,
};

const TELEPORT_PROPERTIES = {
  PROP: "minere:glacier_teleport_cooldown",
  COOLDOWN: 20 * 12,
  CHANCE: 0.2,
};

export class Glacier extends BaseCustomEntity {
  constructor() {
    super(GLACIER_TYPE_ID, {
      tick: TICK_INTERVAL,
      targetQuery: { families: TARGET_FAMILIES, maxDistance: 48 },
    });
  }

  onTick(entity: Entity): void {
    if (Math.random() > MODE_PROPERTIES.CHANCE) {
      return;
    }

    const target = this.getTarget(entity);
    if (!isAlive(target)) {
      return;
    }

    if (
      !isOffCooldown(
        entity,
        MODE_PROPERTIES.COOLDOWN_PROPERTY,
        MODE_PROPERTIES.COOLDOWN,
      )
    ) {
      return;
    }

    const distance = distVector3(entity.location, target.location);
    const currentMode = this.getMode(entity);
    const baseWeights = this.getWeightsForDistance(distance);
    const rolledWeights = this.applyCurrentModePenalty(
      baseWeights,
      currentMode,
    );
    const nextMode = this.pickWeightedMode(rolledWeights, GlacierMode.Ranged);

    if (nextMode === currentMode) {
      return;
    }

    const eventId = MODE_PROPERTIES.EVENT_MAP.get(nextMode);
    if (!eventId) {
      return;
    }

    entity.setProperty(MODE_PROPERTIES.MODE_PROPERTY, nextMode);
    entity.triggerEvent(eventId);
    entity.setDynamicProperty(
      MODE_PROPERTIES.COOLDOWN_PROPERTY,
      system.currentTick,
    );
  }

  onEntityHurt(data: EntityHurtAfterEvent): void {
    if (!isAlive(data.hurtEntity)) {
      return;
    }
    const glacier = data.hurtEntity;
    const attacker = data.damageSource?.damagingEntity;

    if (
      data.damageSource.cause === EntityDamageCause.temperature &&
      world.getTimeOfDay() > 500 &&
      world.getTimeOfDay() < 11000 &&
      !(glacier.getProperty("minere:is_submerging") as boolean)
    ) {
      return this.submergeAndDespawn(glacier);
    }

    if (!isAlive(attacker)) {
      return;
    }

    const distToAttacker = distVector3(glacier.location, attacker.location);
    if (
      distToAttacker < ROAR_PROPERTIES.ACTIVATION_RANGE &&
      Math.random() <= ROAR_PROPERTIES.CHANCE &&
      isOffCooldown(glacier, ROAR_PROPERTIES.PROP, ROAR_PROPERTIES.COOLDOWN)
    ) {
      glacier.triggerEvent("minere:glacier_start_roar");
    }
  }

  private getWeightsForDistance(distance: number): Map<GlacierMode, number> {
    const bracketIndex = Math.min(
      Math.floor(distance / MODE_PROPERTIES.RANGE_BRACKETS),
      MODE_PROPERTIES.MODE_WEIGHTS.length - 1,
    );
    return new Map(MODE_PROPERTIES.MODE_WEIGHTS[bracketIndex]);
  }

  private applyCurrentModePenalty(
    weights: Map<GlacierMode, number>,
    currentMode: GlacierMode,
  ): Map<GlacierMode, number> {
    const currentWeight = weights.get(currentMode) ?? 0;
    weights.set(currentMode, currentWeight * 0.5);
    return weights;
  }

  private pickWeightedMode(
    weights: Map<GlacierMode, number>,
    fallback: GlacierMode,
  ): GlacierMode {
    let totalWeight = 0;
    for (const [, weight] of weights) {
      if (weight > 0) {
        totalWeight += weight;
      }
    }

    if (totalWeight <= 0) {
      return fallback;
    }

    let roll = Math.random() * totalWeight;
    for (const [mode, weight] of weights) {
      if (weight <= 0) {
        continue;
      }
      roll -= weight;
      if (roll <= 0) {
        return mode;
      }
    }

    return fallback;
  }

  private getMode(entity: Entity): GlacierMode {
    const value = entity.getProperty(MODE_PROPERTIES.MODE_PROPERTY);
    if (typeof value === "number") {
      return value as GlacierMode;
    }
    return GlacierMode.Ranged;
  }

  private submergeAndDespawn(glacier: Entity) {
    glacier.triggerEvent("minere:start_submerging");
    system.runTimeout(() => {
      glacier.remove();
    }, 70);
  }
}
