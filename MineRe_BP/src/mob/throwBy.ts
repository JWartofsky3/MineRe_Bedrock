import { Entity } from "@minecraft/server";
import {
  addVector3,
  directionVector3,
  multiplyVector3Number,
} from "util/vector3Functions";

export function throwBy(
  thrower: Entity,
  target: Entity,
  scale: number,
  vAddition: number,
) {
  if (!thrower || !target || !scale) {
    return;
  }

  // Calculate the direction vector from the thrower to the target.
  const direction = {
    x: target.location.x - thrower.location.x,
    z: target.location.z - thrower.location.z,
  };

  // Normalize the direction vector to get a unit vector.
  const magnitude = Math.sqrt(
    direction.x * direction.x + direction.z * direction.z,
  );
  const normalizedDirection = {
    x: direction.x / magnitude,
    z: direction.z / magnitude,
  };

  // Create the horizontal force vector by multiplying the normalized direction by the scale.
  const horizontalForce = {
    x: normalizedDirection.x * scale,
    z: normalizedDirection.z * scale,
  };

  // Apply the knockback with the new parameter structure.
  target.applyKnockback(horizontalForce, vAddition);
}
