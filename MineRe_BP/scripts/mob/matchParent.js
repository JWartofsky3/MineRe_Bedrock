import { EntityComponentTypes } from "@minecraft/server";
const babyEvents = new Map([
  [
    "minere:grizzly_bear",
    [
      "minere:become_brown",
      "minere:become_light",
      "minere:become_gray",
      "minere:become_red",
      "minere:become_blue",
    ],
  ],
  [
    "minere:moose",
    ["minere:become_brown", "minere:become_dark", "minere:become_light"],
  ],
]);
export function matchParent(baby) {
  if (!babyEvents.has(baby.typeId)) {
    return;
  }
  const isBaby = baby.getComponent(EntityComponentTypes.IsBaby);
  if (!isBaby?.isValid) {
    return;
  }
  const nearbyEntities = baby.dimension.getEntities({
    type: baby.typeId,
    location: baby.location,
    maxDistance: 2,
  });
  for (let i = 0; i < nearbyEntities.length; i++) {
    const nearby = nearbyEntities[i];
    if (nearby.getComponent(EntityComponentTypes.IsBaby)?.isValid) {
      continue;
    }
    const variant =
      nearby.getComponent(EntityComponentTypes.Variant)?.value || 0;
    const events = babyEvents.get(baby.typeId);
    if (events.length <= variant) {
      continue;
    }
    baby.triggerEvent(events[variant]);
  }
}
