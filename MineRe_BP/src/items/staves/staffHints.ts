import {
  ButtonState,
  EntityComponentTypes,
  EntityEquippableComponent,
  EquipmentSlot,
  InputButton,
  Player,
  PlayerButtonInputAfterEvent,
  system,
} from "@minecraft/server";

const DEFAULT_HINT_COOLDOWN_TICKS = 20 * 4;
const SNEAK_COOLDOWN_TICKS = 20 * 120;
const HINT_COOLDOWN_PREFIX = "minere:staff_hint:";

const STAFF_SNEAK_HINTS: Record<string, string> = {
  "minere:amethyst_staff": "hint.minere:staff.amethyst.sneak",
  "minere:echo_staff": "hint.minere:staff.echo.sneak",
  "minere:fire_staff": "hint.minere:staff.fire.sneak",
  "minere:ice_staff": "hint.minere:staff.ice.sneak",
};

export function showHint(
  player: Player,
  hintKey: string,
  cooldownTicks = DEFAULT_HINT_COOLDOWN_TICKS,
): void {
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

export function handleStaffSneakHint(
  data: PlayerButtonInputAfterEvent,
): void {
  if (data.button !== InputButton.Sneak) {
    return;
  }
  if (data.newButtonState !== ButtonState.Pressed) {
    return;
  }

  const equippable = data.player.getComponent(
    EntityComponentTypes.Equippable,
  ) as EntityEquippableComponent;
  const heldItem = equippable?.getEquipment(EquipmentSlot.Mainhand);

  if (!heldItem) {
    return;
  }

  const hintKey = STAFF_SNEAK_HINTS[heldItem.typeId];
  if (!hintKey) {
    return;
  }

  showHint(data.player, hintKey);
}
