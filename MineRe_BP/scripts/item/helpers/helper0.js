import { world } from "@minecraft/server";
export const Helper0 = {
  onUse(arg) {
    world.sendMessage("Clearing old torches...");
    const dimension = arg.source.dimension;
    const { x, y, z } = arg.source.location;
    const spacing = 14; // keep darkest areas between 1–6 light level
    const radius = 64; // covers a 128×128 area
    for (let dx = -radius; dx <= radius; dx += spacing) {
      for (let dz = -radius; dz <= radius; dz += spacing) {
        const tx = Math.floor(x + dx);
        const ty = Math.floor(y); // same Y level as player’s feet
        const tz = Math.floor(z + dz);
        // First clear any old torch
        dimension.runCommand(`setblock ${tx} ${ty} ${tz} air`);
        // Then place a new one
        dimension.runCommand(`setblock ${tx} ${ty} ${tz} torch`);
      }
    }
    world.sendMessage("Torch grid refreshed!");
  },
};
