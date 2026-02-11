import { Vector3, Entity } from "@minecraft/server";

export function throwEntity(
  throwerPos: Vector3,
  target: Entity,
  scale: number,
  vAddition: number,
) {
  if (!throwerPos || !target || !scale) return;

  const dx = target.location.x - throwerPos.x;
  const dz = target.location.z - throwerPos.z;

  const magnitude = Math.sqrt(dx * dx + dz * dz);
  if (magnitude === 0) return;

  const horizontalForce = {
    x: (dx / magnitude) * scale,
    z: (dz / magnitude) * scale,
  };

  target.applyKnockback(horizontalForce, vAddition);
}
