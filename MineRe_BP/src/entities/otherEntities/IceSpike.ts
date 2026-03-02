import {
  Block,
  Entity,
  EntityComponentTypes,
  EntityDamageCause,
  EntitySpawnAfterEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { throwEntity } from "entities/functions/throw";
import { distVector3 } from "util/vector3Functions";
import { isFamily, isFamilySet } from "entities/utilities/common";

export class IceSpike extends BaseCustomEntity {
  constructor() {
    super(ICE_SPIKE_TYPE_ID);
  }

  onEntitySpawn(data: EntitySpawnAfterEvent): void {
    runIceSpike(data.entity);
  }
}

const ICE_SPIKE_TYPE_ID = "minere:ice_spike";
const RANGE = 1.35;
const ICE_SPIKE_DAMAGE = 5;
const REMOVE_DELAY_TICKS = 80;
const DAMAGE_DELAY_TICKS = 14;
const SUMMONER_SEARCH_RANGE = 24;
const SLOWNESS_DAMAGE_MULT = 2.0;

const iceSpikeSummoners = new Set<string>(["glacier"]);
const INVALID_TARGET_TYPES = new Set<string>([
  "minecraft:item",
  "minere:ice_spike",
]);

export function runIceSpike(iceSpike: Entity) {
  const dimension = iceSpike.dimension;

  // trace damage to summoner
  const summoners = dimension.getEntities({
    location: iceSpike.location,
    maxDistance: SUMMONER_SEARCH_RANGE,
  });

  let damagingEntity = iceSpike;
  summoners.forEach((summoner: Entity) => {
    if (isFamilySet(summoner, iceSpikeSummoners)) {
      if (
        damagingEntity === iceSpike ||
        distVector3(summoner.location, iceSpike.location) <
          distVector3(damagingEntity.location, iceSpike.location)
      ) {
        damagingEntity = summoner;
      }
    }
  });

  system.runTimeout(() => {
    const entities = dimension.getEntities({
      location: iceSpike.location,
      maxDistance: RANGE,
    });
    for (let i = 0; i < entities.length; i++) {
      const target = entities[i];
      if (
        !target.isValid ||
        INVALID_TARGET_TYPES.has(target.typeId) ||
        isFamily(target, "monster")
      ) {
        continue;
      }
      const slowness = target.getEffect("slowness");
      const finalDamage =
        ICE_SPIKE_DAMAGE +
        (slowness?.isValid
          ? (slowness?.amplifier + 1) * SLOWNESS_DAMAGE_MULT
          : 0);
      if (slowness) {
        dimension.playSound("item.ice_charge.blast", iceSpike.location);
        target.removeEffect("slowness");
      }
      target.applyDamage(finalDamage, {
        damagingEntity: damagingEntity,
        cause: EntityDamageCause.entityAttack,
      });
      throwEntity(iceSpike.location, target, 1.0, 1.0);
    }
  }, DAMAGE_DELAY_TICKS);
  system.runTimeout(() => {
    if (iceSpike?.isValid) {
      iceSpike.remove();
    }
  }, REMOVE_DELAY_TICKS);
}
