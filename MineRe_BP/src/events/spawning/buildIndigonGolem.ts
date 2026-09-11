import {
  Block,
  PlayerPlaceBlockAfterEvent,
  Vector3,
  world,
} from "@minecraft/server";
import { RegisterableEvent } from "events/CustomEvent";
import { takeCommand } from "entities/helpers/commandableCompanion";
import { completeAchievement } from "guide/achievements";

const CARVED_PUMPKIN = "minecraft:carved_pumpkin";
const INDIGON_BLOCK = "minere:indigon_block";
const INDIGON_GOLEM = "minere:indigon_golem";
const INDIGON_ARMOR_POWERUP_SOUND = "item.armor.powerup";

export class BuildIndigonGolemEvent implements RegisterableEvent {
  register(): void {
    world.afterEvents.playerPlaceBlock.subscribe((data) => {
      buildIndigonGolem(data);
    });
  }
}

function buildIndigonGolem(data: PlayerPlaceBlockAfterEvent): void {
  const pumpkin = data.block;
  if (pumpkin.typeId !== CARVED_PUMPKIN) {
    return;
  }

  const structure = findIndigonGolemStructure(pumpkin);
  if (!structure) {
    return;
  }

  for (const block of structure) {
    block.setType("minecraft:air");
  }

  const location = pumpkin.location;
  const golem = pumpkin.dimension.spawnEntity<string>(INDIGON_GOLEM, {
    x: location.x,
    y: location.y - 2,
    z: location.z,
  });
  golem.triggerEvent("minere:from_player");
  takeCommand(golem, data.player, "minere:take_command");
  completeAchievement(data.player, "build_indigon_golem");
  pumpkin.dimension.playSound(INDIGON_ARMOR_POWERUP_SOUND, golem.location);
}

function findIndigonGolemStructure(pumpkin: Block): Block[] | undefined {
  const location = pumpkin.location;
  const stem = getBlockAt(pumpkin, location.x, location.y - 1, location.z);
  const base = getBlockAt(pumpkin, location.x, location.y - 2, location.z);
  if (!stem || !base || !isIndigonBlock(stem) || !isIndigonBlock(base)) {
    return undefined;
  }

  const axes: readonly Vector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  for (const axis of axes) {
    const firstArm = getBlockAt(
      pumpkin,
      location.x - axis.x,
      location.y - 1,
      location.z - axis.z,
    );
    const secondArm = getBlockAt(
      pumpkin,
      location.x + axis.x,
      location.y - 1,
      location.z + axis.z,
    );
    if (!firstArm || !secondArm) {
      continue;
    }
    if (isIndigonBlock(firstArm) && isIndigonBlock(secondArm)) {
      return [pumpkin, stem, base, firstArm, secondArm];
    }
  }

  return undefined;
}

function getBlockAt(
  reference: Block,
  x: number,
  y: number,
  z: number,
): Block | undefined {
  return reference.dimension.getBlock({ x, y, z });
}

function isIndigonBlock(block: Block): boolean {
  return block.typeId === INDIGON_BLOCK;
}
