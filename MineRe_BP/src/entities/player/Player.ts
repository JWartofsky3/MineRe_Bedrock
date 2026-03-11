import { EntityDamageCause, EntityHurtAfterEvent } from "@minecraft/server";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { indigonArmorOnEntityHurt } from "items/armor/IndigonArmor";
import { iceCrownOnEntityHurt } from "items/armor/IceCrown";
import { infernoCrownOnEntityHurt } from "items/armor/InfernoCrown";

const PLAYER_TYPE_ID = "minecraft:player";

export class CustomPlayer extends BaseCustomEntity {
  constructor() {
    super(PLAYER_TYPE_ID);
  }

  onEntityHurt(data: EntityHurtAfterEvent): void {
    infernoCrownOnEntityHurt(data);
    iceCrownOnEntityHurt(data);
    indigonArmorOnEntityHurt(data);
  }
}
