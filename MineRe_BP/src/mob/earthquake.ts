import { system, Block, Entity, EntityDamageCause } from "@minecraft/server";
import { isFamily, isFamilySet } from "./mob_utils";
import { distVector3 } from "util/vector3Functions";
import { throwBy } from "./throwBy";
import { getBlock } from "block/blockUtils";

const RANGE = 1.35;
const EARTHQUAKE_DAMAGE = 5;

const earthquakeSummoners = new Set<string>();
earthquakeSummoners.add("ogre");
earthquakeSummoners.add("yeti");

const earthquakeTargets = new Set<string>();
earthquakeTargets.add("player");
earthquakeTargets.add("iron_golem");
earthquakeTargets.add("irongolem");
earthquakeTargets.add("coppergolem");
earthquakeTargets.add("villager");
earthquakeTargets.add("goblin");
earthquakeTargets.add("wolf");
earthquakeTargets.add("demon");

export function runEarthquake(earthquake: Entity) {
  if (earthquake.typeId !== "minere:earthquake" || !earthquake.isValid) {
    return;
  }
  const dimension = earthquake.dimension;
  // You no longer need to get the component since you're using events.
  // const markVariant = earthquake.getComponent(
  //   EntityComponentTypes.MarkVariant,
  // ) as EntityMarkVariantComponent;

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
    maxDistance: 24,
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
      throwBy(earthquake, target, 1.0, 1.0);
    }
  }, 8);
  system.runTimeout(() => {
    if (earthquake?.isValid) {
      earthquake.remove();
    }
  }, 30);
}
