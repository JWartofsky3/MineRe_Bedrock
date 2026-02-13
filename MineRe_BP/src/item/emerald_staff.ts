import {
  system,
  world,
  ItemUseBeforeEvent,
  EntityDamageCause,
  ItemComponentTypes,
  ItemCooldownComponent,
  Block,
  Dimension,
  Vector3,
} from "@minecraft/server";
import { consumeXp } from "entities/functions/consumeXp";
import {
  addVector3,
  distVector3,
  multiplyVector3Number,
} from "util/vector3Functions";
import { isAlive, isFamily } from "mob/mob_utils";
import { reduceDurability } from "./reduce_durability";

const MONSTER_DAMAGE = 8;
const UNDEAD_DAMAGE = 12;
const XP_COST = 6;
const MAX_RANGE = 40;
const GROWTH_CHANCE = 0.1;
const DAMAGE_RANGE = 1.75;

export type WeightedGrowable = {
  block: string;
  weight: number;
};

export const GrowableBlocks: Record<string, WeightedGrowable[]> = {
  "minecraft:grass_block": [
    { block: "minecraft:short_grass", weight: 11 },
    { block: "minecraft:tall_grass", weight: 4 },
    { block: "minecraft:dandelion", weight: 3 },
    { block: "minecraft:poppy", weight: 2 },
  ],

  "minecraft:crimson_nylium": [
    { block: "minecraft:crimson_roots", weight: 4 },
    { block: "minecraft:crimson_fungus", weight: 1 },
  ],

  "minecraft:warped_nylium": [
    { block: "minecraft:warped_roots", weight: 4 },
    { block: "minecraft:warped_fungus", weight: 1 },
  ],
};

export const useEmeraldStaff = (data: ItemUseBeforeEvent) => {
  if (!data.source) {
    return;
  }
  const itemStack = data.itemStack;
  const source = data.source;
  const dimension = world.getDimension(source.dimension.id);
  const cooldownComponent = data?.itemStack.getComponent(
    ItemComponentTypes.Cooldown,
  ) as ItemCooldownComponent;
  if (itemStack.typeId == "minere:emerald_staff") {
    system.run(() => {
      if (cooldownComponent?.getCooldownTicksRemaining(source)) {
        return;
      }
      if (!consumeXp(source, XP_COST)) {
        source.playSound("item.amethyst_staff.error");
        return;
      }
      cooldownComponent.startCooldown(source);
      const sourceDir = source.getViewDirection();
      const targetLocation =
        source.getBlockFromViewDirection({
          maxDistance: MAX_RANGE,
          includeLiquidBlocks: false,
          includePassableBlocks: false,
        })?.block?.location ??
        addVector3(
          source.getHeadLocation(),
          multiplyVector3Number(source.getViewDirection(), MAX_RANGE),
        );
      const sourcePos = source.getHeadLocation();
      const dist = distVector3(source.location, targetLocation);
      reduceDurability(source, itemStack, 1);
      const entitiesHit = new Set<string>();
      for (let i = 1; i <= dist; i++) {
        system.runTimeout(() => {
          const pos = addVector3(
            sourcePos,
            multiplyVector3Number(sourceDir, i),
          );
          dimension.spawnParticle("minere:emerald_wave", pos);
          system.runTimeout(() => {
            // apply effects to entities
            const entitiesByRange = dimension.getEntities({
              location: pos,
              maxDistance: DAMAGE_RANGE,
            });
            dimension.playSound("item.emerald_staff.wave", pos);

            const entitiesAtBlock = dimension.getEntitiesAtBlockLocation(pos);

            // Combine + dedupe by entity.id, but filter out the staff user
            const entities = [
              ...new Map(
                [...entitiesByRange, ...entitiesAtBlock]
                  .filter((e) => e.id !== data.source.id) // <-- exclude the source
                  .map((e) => [e.id, e]),
              ).values(),
            ];
            for (let j = 0; j < entities.length; j++) {
              const entity = entities[j];
              if (!isAlive(entity) || entitiesHit.has(entity.id)) {
                continue;
              }
              entitiesHit.add(entity.id);
              if (isFamily(entity, "monster")) {
                entity.applyDamage(
                  isFamily(entity, "undead") ? UNDEAD_DAMAGE : MONSTER_DAMAGE,
                  {
                    damagingEntity: data.source,
                    cause: EntityDamageCause.magic,
                  },
                );
                dimension.spawnParticle(
                  "minecraft:critical_hit_emitter",
                  entity.getHeadLocation(),
                );
                dimension.spawnParticle("minere:emerald_wave", entity.location);
              } else {
                entity.addEffect("instant_health", 1);
                dimension.spawnParticle(
                  "minecraft:heart_particle",
                  entity.getHeadLocation(),
                );
              }
            }
            // apply effects to blocks
            if (
              pos.y < dimension.heightRange.min ||
              pos.y > dimension.heightRange.max
            ) {
              return;
            }
            for (let k = -1; k <= 1; k++) {
              growBlocks(dimension, {
                x: pos.x,
                y: pos.y + k,
                z: pos.z,
              });
            }
          }, 2);
        }, i);
      }
    });
  }
};

function growBlocks(dimension: Dimension, pos: Vector3) {
  if (pos.y < dimension.heightRange.min || pos.y > dimension.heightRange.max) {
    return;
  }
  const targetBlock = dimension?.getBlock(pos);
  const below = targetBlock?.below(1);
  if (!below) {
    return;
  }
  const blocks: Block[] = [];

  blocks.push(below?.east());
  blocks.push(below?.west());
  blocks.push(below?.north());
  blocks.push(below?.south());
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block?.isValid || block?.isAir || block?.isLiquid) {
      continue;
    }
    const growables = GrowableBlocks[block.typeId];
    if (
      growables &&
      block?.above()?.isValid &&
      block?.above().isAir &&
      Math.random() <= GROWTH_CHANCE
    ) {
      block.above().setType(pickWeighted(growables));
      dimension.spawnParticle(
        "minecraft:crop_growth_emitter",
        block.above().location,
      );
    }
  }
}

function pickWeighted(items: WeightedGrowable[]): string | undefined {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return undefined;

  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.block;
    }
  }

  return undefined;
}
