import { system } from "@minecraft/server";
import { distVector3 } from "util/vector3Functions";
const DENSITY_DISTANCE = 128;
const placeholderMap = new Map();
// ---------------- SPAWN RULES ---------------------
placeholderMap.set("minere:cosmic_jelly_placeholder", {
  typeId: "minere:cosmic_jelly",
  density: 2,
  endRule: {
    distanceFromOrigin: 1000,
    endermanChance: 1.0,
  },
});
placeholderMap.set("minere:walker_placeholder", {
  typeId: "minere:walker",
  density: 2,
  endRule: {
    distanceFromOrigin: 1000,
    endermanChance: 1.0,
  },
});
placeholderMap.set("minere:gremlin_placeholder", {
  typeId: "minere:gremlin",
  endRule: {
    distanceFromOrigin: 1000,
    endermanChance: 0.5,
  },
});
placeholderMap.set("minere:ogre_placeholder", {
  typeId: "minere:ogre",
  density: 4,
});
placeholderMap.set("minere:goblin_placeholder", {
  typeId: "minere:goblin",
});
placeholderMap.set("minere:monster_bat_placeholder", {
  typeId: "minere:monster_bat",
  density: 5,
});
placeholderMap.set("minere:ghost_placeholder", {
  typeId: "minere:ghost",
  density: 5,
});
placeholderMap.set("minere:lizord_placeholder", {
  typeId: "minere:lizord",
  density: 3,
});
placeholderMap.set("minere:dire_wolf_placeholder", {
  typeId: "minere:dire_wolf",
  density: 5,
});
placeholderMap.set("minere:yeti_placeholder", {
  typeId: "minere:yeti",
  density: 4,
});
placeholderMap.set("minere:scorpion_placeholder", {
  typeId: "minere:scorpion",
});
placeholderMap.set("minere:sand_stomp_placeholder", {
  typeId: "minere:sand_stomp",
  endRule: {
    distanceFromOrigin: 1000,
    endermanChance: 0.5,
  },
});
placeholderMap.set("minere:biter_placeholder", {
  typeId: "minere:biter",
  density: 5,
});
placeholderMap.set("minere:zombie_horse_placeholder", {
  typeId: "minecraft:zombie_horse",
});
placeholderMap.set("minere:skeleton_horse_placeholder", {
  typeId: "minecraft:skeleton_horse",
});
// ---------------- SPAWN RULES ---------------------
export function replacePlaceholder(entity) {
  if (!entity || !entity.isValid) {
    return;
  }
  system.run(() => {
    replaceHelper(entity);
  });
}
function replaceHelper(placeholder) {
  if (!placeholder || !placeholder.isValid || !placeholder.typeId) {
    return;
  }
  const spawnRule = placeholderMap.get(placeholder.typeId);
  if (!spawnRule) {
    return;
  }
  const dimension = placeholder.dimension;
  if (!dimension) {
    return;
  }
  const location = placeholder.location;
  // handle density
  const density = spawnRule.density;
  if (density > 0) {
    const entities = dimension.getEntities({
      location: location,
      type: spawnRule.typeId,
      maxDistance: DENSITY_DISTANCE,
    });
    if (entities.length >= density) {
      return placeholder.remove();
    }
  }
  // handle end rule
  const endRule = spawnRule.endRule;
  if (endRule && dimension.id === "minecraft:the_end") {
    const distance = distVector3(placeholder.location, { x: 0, y: 0, z: 0 });
    if (distance < endRule.distanceFromOrigin) {
      if (Math.random() <= endRule.endermanChance) {
        dimension.spawnEntity("minecraft:enderman", location);
        return placeholder.remove();
      }
    }
  }
  // success!
  dimension.spawnEntity(spawnRule.typeId, location);
  return placeholder.remove();
}
