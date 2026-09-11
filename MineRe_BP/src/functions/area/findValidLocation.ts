import { Dimension, Vector3 } from "@minecraft/server";
import { isSolid } from "block/blockUtils";

type GroundSearchOptions = {
  /** Defaults to the dimension's minimum height. */
  minOffset?: number;
  /** Defaults to zero, starting the scan at the candidate's height. */
  maxOffset?: number;
};

type TargetLocationConstraints = {
  location: Vector3;
  minDistance?: number;
  maxDistance?: number;
  maxVerticalDistance?: number;
};

export type FindValidLocationOptions = {
  dimension: Dimension;
  origin: Vector3;
  attempts: number;
  minHorizontalDistance?: number;
  maxHorizontalDistance: number;
  minVerticalOffset?: number;
  maxVerticalOffset?: number;
  centerOnBlock?: boolean;
  groundSearch?: GroundSearchOptions;
  clearance: {
    width: number;
    height: number;
    requireGround: boolean;
  };
  target?: TargetLocationConstraints;
  isValidCandidate?: (location: Vector3) => boolean;
};

/** Returns the first randomly generated location that satisfies every constraint. */
export function findValidLocation(
  options: FindValidLocationOptions,
): Vector3 | undefined {
  for (let attempt = 0; attempt < options.attempts; attempt++) {
    const candidate = createCandidate(options);
    const location = options.groundSearch
      ? findGroundedLocation(options, candidate)
      : candidate;
    if (
      !location ||
      !isWithinDimension(options.dimension, location, options.clearance.height)
    ) {
      continue;
    }
    if (!matchesTarget(location, options.target)) {
      continue;
    }
    if (!hasClearance(options.dimension, location, options.clearance)) {
      continue;
    }
    try {
      if (options.isValidCandidate && !options.isValidCandidate(location)) {
        continue;
      }
    } catch {
      continue;
    }
    return location;
  }
}

function createCandidate(options: FindValidLocationOptions): Vector3 {
  const minDistance = options.minHorizontalDistance ?? 0;
  const distance =
    minDistance + Math.random() * (options.maxHorizontalDistance - minDistance);
  const angle = Math.random() * Math.PI * 2;
  const minVerticalOffset = options.minVerticalOffset ?? 0;
  const maxVerticalOffset = options.maxVerticalOffset ?? minVerticalOffset;
  const verticalOffset =
    minVerticalOffset + Math.random() * (maxVerticalOffset - minVerticalOffset);
  const x = Math.floor(options.origin.x + Math.cos(angle) * distance);
  const y = Math.floor(options.origin.y + verticalOffset);
  const z = Math.floor(options.origin.z + Math.sin(angle) * distance);
  return {
    x: options.centerOnBlock ? x + 0.5 : x,
    y,
    z: options.centerOnBlock ? z + 0.5 : z,
  };
}

function findGroundedLocation(
  options: FindValidLocationOptions,
  candidate: Vector3,
): Vector3 | undefined {
  const groundSearch = options.groundSearch!;
  const x = Math.floor(candidate.x);
  const z = Math.floor(candidate.z);
  const maximumY = Math.min(
    Math.floor(options.dimension.heightRange.max),
    Math.floor(candidate.y + (groundSearch.maxOffset ?? 0)),
  );
  const minimumY =
    groundSearch.minOffset === undefined
      ? Math.ceil(options.dimension.heightRange.min)
      : Math.max(
          Math.ceil(options.dimension.heightRange.min),
          Math.floor(candidate.y + groundSearch.minOffset),
        );

  for (let y = maximumY; y >= minimumY; y--) {
    try {
      if (!isSolid(options.dimension.getBlock({ x, y, z }))) {
        continue;
      }
      return {
        x: options.centerOnBlock ? x + 0.5 : x,
        y: y + 1,
        z: options.centerOnBlock ? z + 0.5 : z,
      };
    } catch {
      return undefined;
    }
  }
}

function matchesTarget(
  location: Vector3,
  target: TargetLocationConstraints | undefined,
): boolean {
  if (!target) {
    return true;
  }
  const distance = Math.hypot(
    location.x - target.location.x,
    location.y - target.location.y,
    location.z - target.location.z,
  );
  if (
    (target.minDistance !== undefined && distance < target.minDistance) ||
    (target.maxDistance !== undefined && distance > target.maxDistance) ||
    (target.maxVerticalDistance !== undefined &&
      Math.abs(location.y - target.location.y) > target.maxVerticalDistance)
  ) {
    return false;
  }
  return true;
}

function hasClearance(
  dimension: Dimension,
  location: Vector3,
  clearance: FindValidLocationOptions["clearance"],
): boolean {
  const baseX = Math.floor(location.x) - Math.floor(clearance.width / 2);
  const baseY = Math.floor(location.y);
  const baseZ = Math.floor(location.z) - Math.floor(clearance.width / 2);

  try {
    for (let x = baseX; x < baseX + clearance.width; x++) {
      for (let z = baseZ; z < baseZ + clearance.width; z++) {
        if (
          clearance.requireGround &&
          !isSolid(dimension.getBlock({ x, y: baseY - 1, z }))
        ) {
          return false;
        }
        for (let y = baseY; y < baseY + clearance.height; y++) {
          const block = dimension.getBlock({ x, y, z });
          if (!block?.isValid || !block.isAir) {
            return false;
          }
        }
      }
    }
  } catch {
    return false;
  }
  return true;
}

function isWithinDimension(
  dimension: Dimension,
  location: Vector3,
  clearanceHeight: number,
): boolean {
  const baseY = Math.floor(location.y);
  return (
    baseY >= Math.ceil(dimension.heightRange.min) &&
    baseY + clearanceHeight - 1 <= Math.floor(dimension.heightRange.max)
  );
}
