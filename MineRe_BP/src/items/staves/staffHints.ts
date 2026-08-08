import {
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  Player,
  system,
} from "@minecraft/server";
import { getPreferences } from "guide/preferences";

const DEFAULT_HINT_COOLDOWN_TICKS = 20 * 4;
const STAFF_EQUIP_HINT_COOLDOWN_TICKS = 20 * 60 * 30;
const HINT_COOLDOWN_PREFIX = "minere:staff_hint:";
const STAFF_HINT_EQUIPPED_ITEM_PROPERTY = "minere:staff_hint_equipped_item";

const STAFF_EQUIP_HINTS: Record<string, string> = {
  "minere:amethyst_staff": "hint.minere:staff.amethyst.sneak",
  "minere:echo_staff": "hint.minere:staff.echo.sneak",
  "minere:shadow_staff": "hint.minere:staff.shadow.sneak",
  "minere:fire_staff": "hint.minere:staff.fire.sneak",
  "minere:ice_staff": "hint.minere:staff.ice.sneak",
};

export function showHint(
  player: Player,
  hintKey: string,
  cooldownTicks = DEFAULT_HINT_COOLDOWN_TICKS,
): void {
  if (!getPreferences(player).enableHints) {
    return;
  }

  const propertyKey = `${HINT_COOLDOWN_PREFIX}${hintKey}`;
  const lastShownTick = player.getDynamicProperty(propertyKey);

  if (
    typeof lastShownTick === "number" &&
    system.currentTick - lastShownTick < cooldownTicks
  ) {
    return;
  }

  player.setDynamicProperty(propertyKey, system.currentTick);
  player.sendMessage({
    translate: hintKey,
  });
}

export function checkStaffEquipHint(player: Player): void {
  const equippable = player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  const heldItem = equippable?.getEquipment(EquipmentSlot.Mainhand);
  const heldItemTypeId = heldItem?.typeId;
  const previousItemTypeId = player.getDynamicProperty(
    STAFF_HINT_EQUIPPED_ITEM_PROPERTY,
  );

  if (previousItemTypeId === heldItemTypeId) {
    return;
  }

  player.setDynamicProperty(STAFF_HINT_EQUIPPED_ITEM_PROPERTY, heldItemTypeId);

  if (!heldItemTypeId) {
    return;
  }

  const hintKey = STAFF_EQUIP_HINTS[heldItemTypeId];
  if (!hintKey) {
    return;
  }

  showHint(player, hintKey, STAFF_EQUIP_HINT_COOLDOWN_TICKS);
}
