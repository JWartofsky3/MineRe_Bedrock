import {
  Entity,
  EntityComponentTypes,
  EntityIsBabyComponent,
  EntityVariantComponent,
} from "@minecraft/server";

type BabyEventMap = Map<string, string[]>;
const babyEvents: BabyEventMap = new Map([
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

export function matchParent(baby: Entity) {
  if (!babyEvents.has(baby.typeId)) {
    return;
  }
  const isBaby = baby.getComponent(
    EntityComponentTypes.IsBaby,
  ) as EntityIsBabyComponent;
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
    if (
      (
        nearby.getComponent(
          EntityComponentTypes.IsBaby,
        ) as EntityIsBabyComponent
      )?.isValid
    ) {
      continue;
    }
    const variant =
      (
        nearby.getComponent(
          EntityComponentTypes.Variant,
        ) as EntityVariantComponent
      )?.value || 0;
    const events = babyEvents.get(baby.typeId);
    if (events.length <= variant) {
      continue;
    }
    baby.triggerEvent(events[variant]);
  }
}
