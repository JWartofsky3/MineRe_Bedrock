import { EntityComponentTypes } from "@minecraft/server";
const CALL_RANGE = 64;
const CALL_CHANCE = 0.55;
const RESPOND_CHANCE = 0.55;
var mobGroups;
mobGroups = [
  {
    name: "overworld_undead",
    set: new Set([
      "minecraft:zombie",
      "minecraft:husk",
      "minecraft:drowned",
      "minecraft:skeleton",
      "minecraft:stray",
      "minecraft:bogged",
      "minecraft:wither_skeleton",
    ]),
    excluded: new Set([
      "minecraft:zombie_pigman",
      "minecraft:zombified_piglin",
      "minecraft:zoglin",
    ]),
  },
  {
    name: "spider",
    set: new Set([
      "minecraft:spider",
      "minecraft:cave_spider",
      "minecraft:creeper",
      "minecraft:silverfish",
      "minecraft:witch",
      "minere:web_spider",
      "minere:lizord",
    ]),
  },
  {
    name: "nether_fortress",
    set: new Set([
      "minecraft:blaze",
      "minecraft:wither_skeleton",
      "minecraft:skeleton",
      "minecraft:wither",
    ]),
  },
  {
    name: "zombie_pigmen",
    set: new Set([
      "minecraft:zombified_piglin",
      "minecraft:zombie_pigman",
      "minecraft:zoglin",
    ]),
  },
  {
    name: "piglin",
    set: new Set(["minecraft:piglin", "minecraft:piglin_brute"]),
  },
  {
    name: "illager",
    set: new Set([
      "minecraft:pillager",
      "minecraft:vindicator",
      "minecraft:witch",
      "minecraft:evoker",
      "minecraft:ravager",
      "minecraft:illusioner",
    ]),
  },
];
export const mobHorde = (data) => {
  if (Math.random() > CALL_CHANCE) {
    return;
  }
  let targetEntityIdsSet = new Set();
  let targetFamilies = new Set();
  let excludedSet = new Set();
  let entityFamilyComponent = data.hurtEntity.getComponent(
    EntityComponentTypes.TypeFamily,
  );
  let filteredGroups = mobGroups.filter(
    (group) =>
      group.set?.has(data.hurtEntity.typeId) ||
      (group.family && entityFamilyComponent?.hasTypeFamily(group.family)),
  );
  // get included mobs
  filteredGroups.forEach((group) => {
    if (group.set !== null) {
      group.set.forEach((id) => {
        targetEntityIdsSet.add(id.toString());
      });
    }
    if (group.family) {
      targetFamilies.add(group.family);
    }
    if (group.excluded) {
      excludedSet.add(group.excluded.toString());
    }
  });
  // filter out excluded
  filteredGroups.forEach((group) => {
    excludedSet.forEach((excluded) => {
      targetEntityIdsSet.delete(excluded);
      targetFamilies.delete(excluded);
    });
  });
  let nearbyEntities = data.hurtEntity.dimension.getEntities({
    maxDistance: 64,
    location: data.hurtEntity.location,
    excludeFamilies: Array.from(excludedSet.values()),
    excludeTypes: Array.from(excludedSet.values()),
  });
  nearbyEntities.forEach((nearbyEntity) => {
    if (Math.random() > RESPOND_CHANCE) {
      return;
    }
    if (targetEntityIdsSet.has(nearbyEntity.typeId)) {
      // set target here, but we can't do that yet :(
    }
  });
};
