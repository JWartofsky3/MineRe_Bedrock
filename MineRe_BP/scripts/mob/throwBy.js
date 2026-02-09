function throwByFromPos(throwerPos, target, scale, vAddition) {
    if (!throwerPos || !target || !scale)
        return;
    const dx = target.location.x - throwerPos.x;
    const dz = target.location.z - throwerPos.z;
    const magnitude = Math.sqrt(dx * dx + dz * dz);
    if (magnitude === 0)
        return;
    const horizontalForce = {
        x: (dx / magnitude) * scale,
        z: (dz / magnitude) * scale,
    };
    target.applyKnockback(horizontalForce, vAddition);
}
export function throwBy(thrower, target, scale, vAddition) {
    if (!thrower)
        return;
    throwByFromPos(thrower.location, target, scale, vAddition);
}
export function throwByPos(throwerPos, target, scale, vAddition) {
    throwByFromPos(throwerPos, target, scale, vAddition);
}
