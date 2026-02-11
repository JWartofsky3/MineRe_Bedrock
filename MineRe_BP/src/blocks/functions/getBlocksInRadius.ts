import { Block, Dimension, Vector3 } from "@minecraft/server";

export function getBlocksInRadius(
  dimension: Dimension,
  center: Vector3,
  radius: number,
  verticalRadius: number = radius,
): Block[] {
  if (radius < 0 || verticalRadius < 0) {
    return [];
  }

  const blocks: Block[] = [];
  const seen = new Set<string>();

  const roundedCenter = {
    x: Math.round(center.x),
    y: Math.round(center.y),
    z: Math.round(center.z),
  };

  const xRadius = Math.ceil(radius);
  const yRadius = Math.ceil(verticalRadius);
  const zRadius = Math.ceil(radius);

  for (let x = -xRadius; x <= xRadius; x++) {
    for (let y = -yRadius; y <= yRadius; y++) {
      for (let z = -zRadius; z <= zRadius; z++) {
        const normalizedX = radius === 0 ? 0 : (x * x) / (radius * radius);
        const normalizedY =
          verticalRadius === 0
            ? 0
            : (y * y) / (verticalRadius * verticalRadius);
        const normalizedZ = radius === 0 ? 0 : (z * z) / (radius * radius);

        // Use normalized distance to support both spheres and ellipsoids.
        if (normalizedX + normalizedY + normalizedZ > 1) {
          continue;
        }

        const location: Vector3 = {
          x: roundedCenter.x + x,
          y: roundedCenter.y + y,
          z: roundedCenter.z + z,
        };

        if (
          location.y <= dimension.heightRange.min ||
          location.y >= dimension.heightRange.max
        ) {
          continue;
        }

        const key = `${location.x},${location.y},${location.z}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        const block = dimension.getBlock(location);
        if (!block || !block.isValid) {
          continue;
        }

        blocks.push(block);
      }
    }
  }

  return blocks;
}
