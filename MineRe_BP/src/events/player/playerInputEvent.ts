import {
  world,
  PlayerButtonInputAfterEvent,
  InputButton,
  Player,
  ButtonState,
} from "@minecraft/server";
import { RegisterableEvent } from "events/CustomEvent";
import { handleArmorSetJump } from "items/armor/ArmorSetJump";

export class PlayerInputEvent implements RegisterableEvent {
  register(): void {
    world.afterEvents.playerButtonInput.subscribe(
      (data: PlayerButtonInputAfterEvent) => {
        if (data.button === InputButton.Jump) {
          onJump(data.player, data.newButtonState);
        }
      },
    );
  }
}

function onJump(player: Player, newButtonState: ButtonState) {
  if (newButtonState === ButtonState.Pressed) {
    handleArmorSetJump(player);
  }
}
