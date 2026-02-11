import { system } from "@minecraft/server";
import { isSolid } from "block/blockUtils";
const LIFESPAN = 100;
export function iceCharge(
  dimension,
  location,
  radius = 4,
  coverWithSnow = false,
) {
  dimension.playSound("item.ice_charge.blast", location);
  const blockAt = dimension.getBlock(location);
  if (blockAt.isAir) {
    blockAt.setType("minecraft:snow_layer");
  }
  const commandRange = radius / 3;
  dimension.runCommand(
    `fill ${location.x - commandRange} ~${location.y} ~${location.z - commandRange} ~${location.x + commandRange} ~${location.y + commandRange} ~${location.z + commandRange} ice replace water`,
  );
  dimension.runCommand(
    `fill ${location.x - commandRange} ~${location.y} ~${location.z - commandRange} ~${location.x + commandRange} ~${location.y + commandRange} ~${location.z + commandRange} snow_layer replace flowing_water`,
  );
  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= radius; z++) {
        if (x * x + y * y + z * z > radius * radius) continue;
        const blockPos = {
          x: Math.round(location.x + x),
          y: Math.round(location.y + y),
          z: Math.round(location.z + z),
        };
        if (
          blockPos.y <= dimension.heightRange.min ||
          blockPos.y >= dimension.heightRange.max
        ) {
          continue;
        }
        const block = dimension.getBlock(blockPos);
        if (!block) continue;
        // Fire cleanup
        if (
          block.typeId === "minecraft:fire" ||
          block.typeId === "minecraft:soul_fire"
        ) {
          block.setType("minecraft:air");
          continue;
        }
        // Powder snow → snow
        if (block.typeId === "minecraft:powder_snow") {
          block.setType("minecraft:snow");
          snowParticles(block);
          continue;
        }
        // Water → ice
        if (
          block.typeId === "minecraft:water" ||
          block.typeId === "minecraft:flowing_water" ||
          (block.isWaterlogged && block.isAir)
        ) {
          if (block.above()?.typeId !== "minecraft:water") {
            block.setType("minecraft:ice");
            snowParticles(block);
          }
          continue;
        }
        // Lava handling (inner radius only)
        if (x * x + y * y + z * z <= radius * radius * 0.5) {
          if (block.typeId === "minecraft:lava") {
            if (block.above()?.typeId !== "minecraft:lava") {
              block.setType("minecraft:obsidian");
              snowParticles(block);
            }
            continue;
          }
          if (block.typeId === "minecraft:flowing_lava") {
            block.setType("minecraft:cobblestone");
            snowParticles(block);
            continue;
          }
        }
        // ───── Snow layer coverage ─────
        if (coverWithSnow && block.isAir) {
          const below = block.below();
          if (isSolid(below)) {
            block.setType("minecraft:snow_layer");
          }
        }
      }
    }
  }
}
export function iceChargeRunner(entity) {
  if (entity?.typeId !== "minere:ice_charge" || !entity?.isValid) {
    return;
  }
  const dimension = entity.dimension;
  const runner = system.runInterval(() => {
    if (entity?.isValid && entity?.isInWater) {
      iceCharge(dimension, entity.location, 3);
      system.runTimeout(() => {
        entity.remove();
      });
    }
  });
  system.runTimeout(() => {
    system.clearRun(runner);
  }, LIFESPAN);
}
function snowParticles(block) {
  const dimension = block.dimension;
  dimension.spawnParticle("minere:ice_charge_particles_short", {
    x: block.location.x,
    y: block.location.y + 0.25,
    z: block.location.z,
  });
}
