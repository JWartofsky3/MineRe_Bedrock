import { BlockPermutation } from "@minecraft/server";

// NewSteps' stair routine, with only MineRe's component state name substituted.
export const stairs = {
  onPlace: e => {
    const half = e.block.permutation.getState("minecraft:vertical_half");
    const dir = e.block.permutation.getState("minecraft:cardinal_direction");
    const adjacents = { north: [e.block.north(), undefined], south: [e.block.south(), undefined], east: [e.block.east(), undefined], west: [e.block.west(), undefined] };
    const inversions = { bottom: { north: "west", south: "east", east: "north", west: "south" }, top: { north: "east", south: "west", east: "south", west: "north" } };
    let config = "default"; let invert = false;
    let neighbors = 0;
    for (const a in adjacents) {
      if (adjacents[a][0] !== undefined && adjacents[a][0].typeId.includes("_stairs") && adjacents[a][0].permutation.getState("minecraft:vertical_half") === half) {
        adjacents[a][1] = adjacents[a][0].permutation.getState("minecraft:cardinal_direction");
        neighbors++;
      }
    }
    if (neighbors) {
      if (dir === "north" && (adjacents.north[1] === "east" || adjacents.north[1] === "west")) { config = "outer_corner"; invert = (half === "bottom" && adjacents.north[1] === "west") || (half === "top" && adjacents.north[1] === "east"); }
      else if (dir === "south" && (adjacents.south[1] === "west" || adjacents.south[1] === "east")) { config = "outer_corner"; invert = (half === "bottom" && adjacents.south[1] === "east") || (half === "top" && adjacents.south[1] === "west"); }
      else if (dir === "east" && (adjacents.east[1] === "south" || adjacents.east[1] === "north")) { config = "outer_corner"; invert = (half === "bottom" && adjacents.east[1] === "north") || (half === "top" && adjacents.east[1] === "south"); }
      else if (dir === "west" && (adjacents.west[1] === "south" || adjacents.west[1] === "north")) { config = "outer_corner"; invert = (half === "bottom" && adjacents.west[1] === "south") || (half === "top" && adjacents.west[1] === "north"); }
    }
    if (neighbors >= 2 && config !== "outer_corner") {
      if (dir === "north") {
        if ((adjacents.east[1] !== dir || adjacents.west[1] !== dir) && ((adjacents.south[1] === "west" && adjacents.east[1] === "north") || (adjacents.south[1] === "east" && adjacents.west[1] === "north"))) { config = "inner_corner"; invert = (half === "bottom" && adjacents.south[1] === "west" && adjacents.east[1] === "north") || (half === "top" && adjacents.south[1] === "east" && adjacents.west[1] === "north"); }
      } else if (dir === "south") {
        if ((adjacents.east[1] !== dir || adjacents.west[1] !== dir) && ((adjacents.north[1] === "east" && adjacents.west[1] === "south") || (adjacents.north[1] === "west" && adjacents.east[1] === "south"))) { config = "inner_corner"; invert = (half === "bottom" && adjacents.north[1] === "east" && adjacents.west[1] === "south") || (half === "top" && adjacents.north[1] === "west" && adjacents.east[1] === "south"); }
      } else if (dir === "east") {
        if ((adjacents.north[1] !== dir || adjacents.south[1] !== dir) && ((adjacents.south[1] === "east" && adjacents.west[1] === "north") || (adjacents.north[1] === "east" && adjacents.west[1] === "south"))) { config = "inner_corner"; invert = (half === "bottom" && adjacents.south[1] === "east" && adjacents.west[1] === "north") || (half === "top" && adjacents.north[1] === "east" && adjacents.west[1] === "south"); }
      } else if (dir === "west") {
        if ((adjacents.north[1] !== dir || adjacents.south[1] !== dir) && ((adjacents.south[1] === "west" && adjacents.east[1] === "north") || (adjacents.north[1] === "west" && adjacents.east[1] === "south"))) { config = "inner_corner"; invert = (half === "bottom" && adjacents.north[1] === "west" && adjacents.east[1] === "south") || (half === "top" && adjacents.south[1] === "west" && adjacents.east[1] === "north"); }
      }
    }
    if (config !== "default") {
      e.dimension.setBlockPermutation(e.block.location, BlockPermutation.resolve(e.block.typeId, { "minecraft:cardinal_direction": invert ? inversions[half][dir] : dir, "minere:configuration": config, "minecraft:vertical_half": half }));
    }
  }
};
