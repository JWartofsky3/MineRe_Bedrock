import { system, Entity } from "@minecraft/server";
import {
  getBlock,
  isSolid,
  oceanBlocks,
  oceanFloorBlocks,
  oceanMonumentBlocks,
  oceanRuinBlocks,
  ruinedPortalBlocks,
  shipwreckBlocks,
} from "block/blockUtils";
import { distVector3 } from "util/vector3Functions";
import { isUnderground } from "./mob_utils";
import { isDay } from "weather/world_utils";

type SpawnRule = {
  typeId: string;
  spawnOnly?: boolean;
  density?: number;
  endRule?: EndRule;
  waterRule?: WaterRule;
};

type EndRule = {
  distanceFromOrigin: number;
  endermanChance: number;
};

type WaterRule = {
  dayDepth: number;
  allowStructureSpawn: boolean;
};

const DENSITY_DISTANCE = 128;
const placeholderMap = new Map<string, SpawnRule>();

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

placeholderMap.set("minere:stomp_placeholder", {
  typeId: "minere:stomp",
  endRule: {
    distanceFromOrigin: 1000,
    endermanChance: 0.5,
  },
});

placeholderMap.set("minere:biter_placeholder", {
  typeId: "minere:biter",
  density: 5,
  waterRule: {
    dayDepth: 32,
    allowStructureSpawn: false,
  },
});

placeholderMap.set("minecraft:drowned", {
  typeId: "minecraft:drowned",
  waterRule: {
    dayDepth: 40,
    allowStructureSpawn: true,
  },
});

placeholderMap.set("minere:zombie_horse_placeholder", {
  typeId: "minecraft:zombie_horse",
});

placeholderMap.set("minere:skeleton_horse_placeholder", {
  typeId: "minecraft:skeleton_horse",
});

// ---------------- SPAWN RULES ---------------------

export function replacePlaceholder(entity: Entity, isSpawn: boolean) {
  if (!entity || !entity.isValid) {
    return;
  }
  system.run(() => {
    replaceHelper(entity, isSpawn);
  });
}

function replaceHelper(placeholder: Entity, isSpawn: boolean) {
  if (!placeholder || !placeholder.isValid || !placeholder.typeId) {
    return;
  }
  const spawnRule: SpawnRule = placeholderMap.get(placeholder.typeId);
  if (!spawnRule) {
    return;
  }
  if (spawnRule.spawnOnly && !isSpawn) {
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

  // handle water rule
  const waterRule = spawnRule.waterRule;
  if (waterRule && placeholder.isInWater) {
    if (
      isDay() &&
      placeholder.location.y > waterRule.dayDepth &&
      !isUnderground(placeholder)
    ) {
      if (!waterRule.allowStructureSpawn || !checkIfStructure(placeholder)) {
        return placeholder.remove();
      }
    }
  }

  // success!
  if (placeholder.typeId !== spawnRule.typeId) {
    dimension.spawnEntity(spawnRule.typeId, location);
    return placeholder.remove();
  }
}

function checkIfStructure(entity: Entity): boolean {
  if (!entity?.isValid) return false;

  const dimension = entity.dimension;
  let y = Math.floor(entity.location.y);

  while (y >= 0) {
    const block = getBlock(dimension, {
      x: entity.location.x,
      y: y,
      z: entity.location.z,
    });

    if (!block?.isValid) return false;

    const typeId = block.typeId;

    // Skip liquids, air, and ocean floor blocks
    if (!isSolid(block)) {
      y--;
      continue;
    }

    // First solid non-ocean-floor block
    if (
      oceanMonumentBlocks.has(typeId) ||
      ruinedPortalBlocks.has(typeId) ||
      shipwreckBlocks.has(typeId) ||
      oceanRuinBlocks.has(typeId)
    ) {
      return !oceanFloorBlocks.has(typeId);
    }

    // Not a structure block
    return false;
  }

  return false;
}
