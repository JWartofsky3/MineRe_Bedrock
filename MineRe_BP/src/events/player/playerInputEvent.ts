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
        handleArmorSetJump(data);
      },
    );
  }
}
