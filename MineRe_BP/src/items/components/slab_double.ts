import { ItemCustomComponent } from "@minecraft/server";

// NewSteps' horizontal slab-double routine, without its vertical-slab counterpart.
const complements: Record<string, [string, { x: number; y: number; z: number }, string]> = {
  bottom: ["Up", { x: 0, y: 1, z: 0 }, "bottom"],
  top: ["Down", { x: 0, y: -1, z: 0 }, "top"],
};

export const slabDouble: ItemCustomComponent = {
  onUseOn: (e: any, p: any) => {
    if (e.block.typeId === e.itemStack.typeId) {
      try {
        const side = complements[e.usedOnBlockPermutation.getState("minecraft:vertical_half")];
        if (e.blockFace === side[0]) {
          const oldSlab = e.block.dimension.getBlock({
            x: e.block.x + side[1].x,
            y: e.block.y + side[1].y,
            z: e.block.z + side[1].z,
          });
          if (oldSlab.typeId === e.itemStack.typeId && oldSlab.permutation.getState("minecraft:vertical_half") === side[2]) {
            e.block.dimension.setBlockType(oldSlab.location, "minecraft:air");
          }
          e.block.dimension.setBlockType(e.block.location, p.params.variant);
        }
      } catch (error) {
        console.warn(`MineRe slab merge failed: ${error}`);
      }
    }
  },
};
