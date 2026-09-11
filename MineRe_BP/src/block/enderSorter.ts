import {
  Block,
  BlockComponentTickEvent,
  BlockCustomComponent,
  BlockInventoryComponent,
  BlockPermutation,
  Container,
  EntityComponentTypes,
  EntityInventoryComponent,
  Player,
  Vector3,
} from "@minecraft/server";
import { particleWave } from "particles/particleWave";
import { showHint } from "items/staves/staffHints";

const ACTIVATED_ENDERON_BLOCK = "minere:activated_enderon_block";
const ENDERON_BLOCK = "minere:enderon_block";
const MAX_STACKS_PER_TICK = 1;
const MAX_ITEMS_PER_TICK = 16;
const BASE_SEARCH_RADIUS = 5;
const ENDERON_RADIUS_BONUS = 2;
const SORTER_PARTICLE = "minere:indigon_magic_short";
const BEAM_SOUND = "mob.endermen.portal";
const BEAM_SOUND_VOLUME = 0.2;
const BEAM_SOUND_PITCH = 1.2;
const ENDER_SORTER_HINT_COOLDOWN_TICKS = 20 * 60 * 2;
const ENDER_SORTER_PLACEMENT_HINT = "hint.minere:ender_sorter.placement";

export const enderSorter: BlockCustomComponent = {
  onTick(arg: BlockComponentTickEvent) {
    if (arg.block.getRedstonePower() > 0) {
      return;
    }

    const adjacentEnderon = getAdjacentEnderonBlocks(arg.block);
    activateEnderonBlocks(adjacentEnderon);

    const source = getInventoryAbove(arg.block);
    if (!source) {
      return;
    }

    const radius =
      BASE_SEARCH_RADIUS +
      (adjacentEnderon.length > 0 ? ENDERON_RADIUS_BONUS : 0);
    const destinations = getNearbyBlockInventories(arg.block, radius);
    const fallback = getInventoryBelow(arg.block);

    let processedStacks = 0;
    let movedItems = 0;
    for (
      let slot = 0;
      slot < source.size &&
      processedStacks < MAX_STACKS_PER_TICK &&
      movedItems < MAX_ITEMS_PER_TICK;
      slot++
    ) {
      const stack = source.getItem(slot);
      if (!stack) {
        continue;
      }
      processedStacks++;

      const target = findMatchingInventory(destinations, stack.typeId);
      if (target) {
        const moved = moveItems(
          source,
          slot,
          target.container,
          MAX_ITEMS_PER_TICK - movedItems,
        );
        movedItems += moved;
        if (moved > 0) {
          const sorterLocation = blockCenter(arg.block.location);
          const targetLocation = blockCenter(target.block.location);
          particleWave({
            dimension: arg.dimension,
            particle: SORTER_PARTICLE,
            startLocation: sorterLocation,
            endLocation: targetLocation,
            ticksPerStep: 0,
          });
          arg.dimension.playSound(BEAM_SOUND, sorterLocation, {
            volume: BEAM_SOUND_VOLUME,
            pitch: BEAM_SOUND_PITCH,
          });
          arg.dimension.playSound(BEAM_SOUND, targetLocation, {
            volume: BEAM_SOUND_VOLUME,
            pitch: BEAM_SOUND_PITCH,
          });
        }
        if (
          source.getItem(slot) &&
          fallback &&
          movedItems < MAX_ITEMS_PER_TICK
        ) {
          movedItems += moveItems(
            source,
            slot,
            fallback,
            MAX_ITEMS_PER_TICK - movedItems,
          );
        }
        continue;
      }

      if (fallback && movedItems < MAX_ITEMS_PER_TICK) {
        movedItems += moveItems(
          source,
          slot,
          fallback,
          MAX_ITEMS_PER_TICK - movedItems,
        );
      }
    }
  },
};

export function sendEnderSorterPlacementHint(player: Player): void {
  showHint(
    player,
    ENDER_SORTER_PLACEMENT_HINT,
    ENDER_SORTER_HINT_COOLDOWN_TICKS,
  );
}

function getInventoryAbove(block: Block): Container | undefined {
  return (
    getBlockInventory(block.above(1)) ??
    getEntityInventoryAt(block.above(1).location, block)
  );
}

function getInventoryBelow(block: Block): Container | undefined {
  return (
    getBlockInventory(block.below(1)) ??
    getEntityInventoryAt(block.below(1).location, block)
  );
}

function getNearbyBlockInventories(
  sorter: Block,
  radius: number,
): Array<{ block: Block; container: Container }> {
  const found: Array<{ block: Block; container: Container }> = [];
  const sorterLocation = sorter.location;
  const radiusSquared = radius * radius;

  for (let x = -radius; x <= radius; x++) {
    for (let y = -radius; y <= radius; y++) {
      for (let z = -radius; z <= radius; z++) {
        if (x * x + y * y + z * z > radiusSquared) {
          continue;
        }
        if (x === 0 && y === 0 && z === 0) {
          continue;
        }
        if (x === 0 && y === -1 && z === 0) {
          continue;
        }
        if (x === 0 && y === 1 && z === 0) {
          continue;
        }

        const block = sorter.dimension.getBlock({
          x: sorterLocation.x + x,
          y: sorterLocation.y + y,
          z: sorterLocation.z + z,
        });
        if (!block || !block.isValid) {
          continue;
        }
        const container = getBlockInventory(block);
        if (container) {
          found.push({ block, container });
        }
      }
    }
  }

  return found;
}

function getBlockInventory(block: Block): Container | undefined {
  const inventory = block.getComponent("minecraft:inventory") as
    | BlockInventoryComponent
    | undefined;
  return inventory?.container;
}

function getEntityInventoryAt(
  location: Vector3,
  sorter: Block,
): Container | undefined {
  const entities = sorter.dimension.getEntitiesAtBlockLocation(location);
  for (const entity of entities) {
    const inventory = entity.getComponent(EntityComponentTypes.Inventory) as
      | EntityInventoryComponent
      | undefined;
    if (inventory?.container) {
      return inventory.container;
    }
  }
  return undefined;
}

function findMatchingInventory(
  destinations: Array<{ block: Block; container: Container }>,
  typeId: string,
): { block: Block; container: Container } | undefined {
  for (const destination of destinations) {
    for (let slot = 0; slot < destination.container.size; slot++) {
      if (destination.container.getItem(slot)?.typeId === typeId) {
        return destination;
      }
    }
  }
  return undefined;
}

function moveItems(
  source: Container,
  slot: number,
  target: Container,
  maxItems: number,
): number {
  const sourceStack = source.getItem(slot);
  if (!sourceStack || maxItems <= 0) {
    return 0;
  }
  const transfer = sourceStack.clone();
  transfer.amount = Math.min(sourceStack.amount, maxItems);
  const remaining = target.addItem(transfer);
  const moved = transfer.amount - (remaining?.amount ?? 0);
  if (moved === 0) {
    return 0;
  }
  sourceStack.amount -= moved;
  source.setItem(slot, sourceStack.amount > 0 ? sourceStack : undefined);
  return moved;
}

function getAdjacentEnderonBlocks(sorter: Block): Block[] {
  return [
    sorter.above(1),
    sorter.below(1),
    sorter.east(1),
    sorter.west(1),
    sorter.north(1),
    sorter.south(1),
  ].filter((block) => block.isValid && block.typeId === ENDERON_BLOCK);
}

function activateEnderonBlocks(blocks: Block[]): void {
  for (const block of blocks) {
    block.setPermutation(BlockPermutation.resolve(ACTIVATED_ENDERON_BLOCK));
  }
}

function blockCenter(location: Vector3): Vector3 {
  return {
    x: location.x + 0.5,
    y: location.y + 0.5,
    z: location.z + 0.5,
  };
}
