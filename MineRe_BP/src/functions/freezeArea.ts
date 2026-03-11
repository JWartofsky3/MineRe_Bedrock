import { Block, Dimension, Vector3, system } from "@minecraft/server";
import { isSolid } from "block/blockUtils";
import { getBlocksInRadius } from "blocks/functions/getBlocksInRadius";

export type FreezeAreaOptions = {
  radius?: number;
  verticalRadius?: number;
  coverWithSnow?: boolean;
  ticksPerStep?: number;
  playSound?: boolean;
};

type FreezeReplacement = {
  toTypeId: string;
  showParticles: boolean;
  playFizz?: boolean;
  freezeSoundVolume?: number;
};

const OUTER_REPLACEMENTS = new Map<string, FreezeReplacement>([
  ["minecraft:fire", { toTypeId: "minecraft:air", showParticles: false }],
  ["minecraft:soul_fire", { toTypeId: "minecraft:air", showParticles: false }],
  [
    "minecraft:water",
    { toTypeId: "minecraft:ice", showParticles: true, freezeSoundVolume: 0.25 },
  ],
  [
    "minecraft:flowing_water",
    { toTypeId: "minecraft:ice", showParticles: true, freezeSoundVolume: 0.25 },
  ],
]);

const INNER_RING_REPLACEMENTS = new Map<string, FreezeReplacement>([
  [
    "minecraft:magma",
    { toTypeId: "minecraft:basalt", showParticles: true, playFizz: true },
  ],
  [
    "minecraft:flowing_lava",
    { toTypeId: "minecraft:cobblestone", showParticles: true, playFizz: true },
  ],
  [
    "minecraft:lava",
    { toTypeId: "minecraft:obsidian", showParticles: true, playFizz: true },
  ],
]);

const LAVA_EXTINGUISH_SOUND_ID = "random.fizz";
const WATER_FREEZE_SOUND_ID = "mob.freeze.freeze";

export function freezeArea(
  dimension: Dimension,
  location: Vector3,
  options: FreezeAreaOptions = {
    radius: 4,
    verticalRadius: 4,
    coverWithSnow: false,
    ticksPerStep: 2,
    playSound: false,
  },
) {
  const radius = options.radius ?? 4;
  const verticalRadius = options.verticalRadius ?? 4;
  const coverWithSnow = options.coverWithSnow ?? false;
  const ticksPerStep = options.ticksPerStep ?? 2;
  const isNether = dimension.id.includes("nether");

  const blockAt = dimension.getBlock(location);
  if (blockAt && blockAt.isAir && !isNether && isSolid(blockAt.below())) {
    blockAt.setType("minecraft:snow_layer");
  }

  const blocks = getBlocksInRadius(dimension, location, radius, verticalRadius);
  const roundedCenter = {
    x: Math.round(location.x),
    y: Math.round(location.y + 1),
    z: Math.round(location.z),
  };
  const clampedTicksPerStep = Math.max(0, Math.floor(ticksPerStep));
  const ringBuckets = new Map<number, Block[]>();

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const dx = block.location.x - roundedCenter.x;
    const dy = block.location.y - roundedCenter.y;
    const dz = block.location.z - roundedCenter.z;
    const ringIndex = Math.floor(Math.sqrt(dx * dx + dy * dy + dz * dz));

    const bucket = ringBuckets.get(ringIndex);
    if (bucket) {
      bucket.push(block);
    } else {
      ringBuckets.set(ringIndex, [block]);
    }
  }

  const ringIndices = [...ringBuckets.keys()].sort((a, b) => a - b);

  for (let i = 0; i < ringIndices.length; i++) {
    const ringIndex = ringIndices[i];
    const ringBlocks = ringBuckets.get(ringIndex);
    if (!ringBlocks) {
      continue;
    }

    const isInnerRing = i <= Math.ceil(ringIndices.length / 2);

    system.runTimeout(() => {
      for (let j = 0; j < ringBlocks.length; j++) {
        const block = ringBlocks[j];
        if (!block?.isValid) {
          continue;
        }

        const outerReplacement = OUTER_REPLACEMENTS.get(block.typeId);
        if (outerReplacement) {
          applyReplacement(block, outerReplacement);
          continue;
        }

        if (block.isWaterlogged && block.isAir) {
          applyReplacement(block, {
            toTypeId: "minecraft:ice",
            showParticles: true,
          });
          continue;
        }

        if (isInnerRing) {
          const innerReplacement = INNER_RING_REPLACEMENTS.get(block.typeId);
          if (innerReplacement) {
            applyReplacement(block, innerReplacement);
            continue;
          }
        }

        if (coverWithSnow && block.isAir) {
          const below = block.below();
          if (isSolid(below) && !isNether) {
            block.setType("minecraft:snow_layer");
          }
        }
      }
    }, ringIndex * clampedTicksPerStep);
  }
}

function applyReplacement(block: Block, replacement: FreezeReplacement) {
  block.setType(replacement.toTypeId);
  if (replacement.playFizz) {
    block.dimension.playSound(LAVA_EXTINGUISH_SOUND_ID, block.location);
  }
  if (replacement.freezeSoundVolume) {
    block.dimension.playSound(WATER_FREEZE_SOUND_ID, block.location, {
      volume: replacement.freezeSoundVolume,
    });
  }
  if (replacement.showParticles) {
    snowParticles(block);
  }
}

function snowParticles(block: Block) {
  const dimension = block.dimension;
  dimension.spawnParticle("minere:ice_charge_particles_short", {
    x: block.location.x,
    y: block.location.y + 0.25,
    z: block.location.z,
  });
  if (
    block.typeId === "minecraft:obsidian" ||
    block.typeId === "minecraft:cobblestone"
  ) {
    for (let i = 0; i < 8; i++) {
      dimension.spawnParticle("minecraft:basic_smoke_particle", {
        x: block.location.x + 0.5,
        y: block.location.y + 0.5,
        z: block.location.z + 0.5,
      });
    }
  }
}
