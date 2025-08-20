import { getBlock } from "block/blockUtils";
import { getRandomIntInclusive } from "util/mathFunctions";
const monsterHorseMap = new Map();
monsterHorseMap.set("minecraft:zombie", "minecraft:zombie_horse");
monsterHorseMap.set("minecraft:skeleton", "minecraft:skeleton_horse");
monsterHorseMap.set("minecraft:stray", "minecraft:skeleton_horse");
const MONSTER_HORSE_CHANCE = 0.03;
const MONSTER_HORSE_MIN = 1;
const MONSTER_HORSE_MAX = 2;
const MAX_HORSES = 2;
const HORSE_DISTANCE_CHECK = 64;
export function spawnMonsterHorse(data) {
  const entity = data?.entity;
  const dimension = entity?.dimension;
  const monsterHorseId = monsterHorseMap.get(entity?.typeId);
  if (!monsterHorseId || !entity || !dimension) {
    return;
  }
  const location = entity.location;
  // check if underground
  for (let i = 0; i < 20; i++) {
    const block = getBlock(dimension, {
      x: entity.location.x,
      y: entity.location.y + i,
      z: entity.location.z,
    });
    if (block && !block.isAir && !block.isLiquid && block.isLiquidBlocking) {
      return;
    }
  }
  if (Math.random() < MONSTER_HORSE_CHANCE) {
    const inSamePos = dimension.getEntities({
      location: location,
      maxDistance: 2,
      type: monsterHorseId,
    });
    if (inSamePos.length > 0) {
      return;
    }
    const nearbyHorses = dimension.getEntities({
      location: location,
      maxDistance: HORSE_DISTANCE_CHECK,
      type: monsterHorseId,
    });
    if (nearbyHorses.length >= MAX_HORSES) {
      return;
    }
    entity.remove();
    const horsesToSpawn = getRandomIntInclusive(
      MONSTER_HORSE_MIN,
      MONSTER_HORSE_MAX,
    );
    for (let i = 0; i < horsesToSpawn; i++) {
      dimension.spawnEntity(monsterHorseId, location);
    }
  }
}
