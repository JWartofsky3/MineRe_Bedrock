import {
  Block,
  DataDrivenEntityTriggerAfterEvent,
  Dimension,
  Entity,
  world,
} from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { getBlock } from "block/blockUtils";
import { GREMLIN_BREAKS_TORCHES } from "settings";

const GREMLIN_TYPE_ID = "minere:gremlin";
const BREAK_TORCHES_EVENT = "minere:break_torches";
const ATTACK_ANIMATION_EVENT = "minere:play_attack_animation";
const TORCH_RADIUS = 2;

const torchSet = new Set<string>([
  "minecraft:torch",
  "minecraft:copper_torch",
  "minecraft:redstone_torch",
  "minecraft:soul_torch",
]);

export class Gremlin extends BaseCustomEntity {
  constructor() {
    super(GREMLIN_TYPE_ID, 0);
  }

  onDataDrivenEntityTrigger(data: DataDrivenEntityTriggerAfterEvent): void {
    if (data.eventId !== BREAK_TORCHES_EVENT) {
      return;
    }
    breakTorches(data.entity, TORCH_RADIUS);
  }
}

function isTorch(block: Block | undefined): boolean {
  if (!block) {
    return false;
  }
  return torchSet.has(block.typeId);
}

function breakTorches(entity: Entity, radius: number): void {
  if (!entity?.isValid) {
    return;
  }
  if (!world?.getDynamicProperty(GREMLIN_BREAKS_TORCHES).valueOf()) {
    return;
  }

  const dimension: Dimension = entity.dimension;
  const base = entity.location;
  let torchesBroken = 0;

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const x = Math.floor(base.x + dx) + 0.5;
        const y = Math.floor(base.y + dy) + 0.5;
        const z = Math.floor(base.z + dz) + 0.5;

        const block: Block | undefined = getBlock(dimension, { x, y, z });
        if (!isTorch(block)) {
          continue;
        }

        entity.runCommand(`setblock ${x} ${y} ${z} air destroy`);
        torchesBroken++;
      }
    }
  }

  if (torchesBroken > 0) {
    entity.triggerEvent(ATTACK_ANIMATION_EVENT);
  }
}
