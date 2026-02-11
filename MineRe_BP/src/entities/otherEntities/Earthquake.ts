import {
  Block,
  Entity,
  EntityDamageCause,
  EntitySpawnAfterEvent,
  system,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { throwEntity } from "entities/functions/throw";
import { distVector3 } from "util/vector3Functions";
import { getBlock } from "block/blockUtils";
import { isFamily, isFamilySet } from "entities/utilities/common";

export class Earthquake extends BaseCustomEntity {
  constructor() {
    super("minere:earthquake", 0);
  }

  onEntitySpawn(data: EntitySpawnAfterEvent): void {
    runEarthquake(data.entity);
  }
}

const EARTHQUAKE_TYPE_ID = "minere:earthquake";
const RANGE = 1.35;
const EARTHQUAKE_DAMAGE = 5;
const REMOVE_DELAY_TICKS = 30;
const DAMAGE_DELAY_TICKS = 8;
const SUMMONER_SEARCH_RANGE = 24;

const earthquakeSummoners = new Set<string>(["ogre", "yeti"]);
const earthquakeTargets = new Set<string>([
  "player",
  "iron_golem",
  "irongolem",
  "coppergolem",
  "villager",
  "goblin",
  "wolf",
  "demon",
]);

export function runEarthquake(earthquake: Entity) {
  if (earthquake.typeId !== EARTHQUAKE_TYPE_ID || !earthquake.isValid) {
    return;
  }
  const dimension = earthquake.dimension;

  const under: Block = getBlock(dimension, {
    x: earthquake.location.x,
    y: earthquake.location.y - 1,
    z: earthquake.location.z,
  });
  const at: Block = getBlock(dimension, {
    x: earthquake.location.x,
    y: earthquake.location.y,
    z: earthquake.location.z,
  });

  const check = (id: string) => {
    return under?.typeId === id || at?.typeId === id;
  };

  // The logic for determining the variant remains the same, but the implementation changes.
  let variantToSet = 0;

  // dimension checks
  if (dimension.id === "minecraft:overworld") {
    if (earthquake.location.y < 0) {
      variantToSet = 1;
    }
    if (earthquake.location.y > 62) {
      variantToSet = 2;
    }
  }
  if (dimension.id === "minecraft:the_nether") {
    variantToSet = 8;
  }
  if (dimension.id === "minecraft:the_end") {
    variantToSet = 9;
  }

  // block checks - these will override the dimension checks if a block is found
  if (check("minecraft:stone")) {
    variantToSet = 0;
  }
  if (check("minecraft:deepslate")) {
    variantToSet = 1;
  }
  if (check("minecraft:dirt") || check("minecraft:grass_block")) {
    variantToSet = 2;
  }
  if (check("minecraft:sand")) {
    variantToSet = 3;
  }
  if (check("minecraft:red_sand")) {
    variantToSet = 4;
  }
  if (
    check("minecraft:snow") ||
    check("minecraft:powdered_snow") ||
    check("minecraft:snow_layer")
  ) {
    variantToSet = 5;
  }
  if (
    check("minecraft:ice") ||
    check("minecraft:packed_ice") ||
    check("minecraft:blue_ice") ||
    check("minere:freeze_ice")
  ) {
    variantToSet = 6;
  }
  if (check("minecraft:gravel")) {
    variantToSet = 7;
  }
  if (check("minecraft:netherrack")) {
    variantToSet = 8;
  }
  if (check("minecraft:end_stone")) {
    variantToSet = 9;
  }

  // Finally, trigger the appropriate event based on the determined variant.
  earthquake.triggerEvent(`minere:set_variant_${variantToSet}`);

  // trace damage to summoner
  let damagingEntity = earthquake;
  const summoners = dimension.getEntities({
    location: earthquake.location,
    maxDistance: SUMMONER_SEARCH_RANGE,
  });
  summoners.forEach((summoner: Entity) => {
    if (isFamilySet(summoner, earthquakeSummoners)) {
      if (
        damagingEntity === earthquake ||
        distVector3(summoner.location, earthquake.location) <
          distVector3(damagingEntity.location, earthquake.location)
      ) {
        damagingEntity = summoner;
      }
    }
  });

  system.runTimeout(() => {
    const entities = dimension.getEntities({
      location: earthquake.location,
      maxDistance: RANGE,
    });
    for (let i = 0; i < entities.length; i++) {
      const target = entities[i];
      if (target.typeId === earthquake.typeId) {
        continue;
      }
      if (!target.isValid) {
        continue;
      }
      if (
        !isFamilySet(target, earthquakeTargets) &&
        isFamily(target, "monster")
      ) {
        continue;
      }
      target.applyDamage(EARTHQUAKE_DAMAGE, {
        damagingEntity: damagingEntity,
        cause: EntityDamageCause.entityAttack,
      });
      throwEntity(earthquake.location, target, 1.0, 1.0);
    }
  }, DAMAGE_DELAY_TICKS);
  system.runTimeout(() => {
    if (earthquake?.isValid) {
      earthquake.remove();
    }
  }, REMOVE_DELAY_TICKS);
}
