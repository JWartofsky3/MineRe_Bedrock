import {
  EntityComponentTypes,
  EntityTameableComponent,
  ItemCustomComponent,
  Player,
} from "@minecraft/server";
import { relinquishCommand } from "entities/mobs/IndigonGolem";

const INDIGON_GOLEM = "minere:indigon_golem";

export const Helper3: ItemCustomComponent = {
  onUse(arg) {
    if (!(arg.source instanceof Player)) {
      return;
    }

    let relinquishedCommands = 0;
    const golems = arg.source.dimension.getEntities({
      type: INDIGON_GOLEM,
      location: arg.source.location,
      maxDistance: 16,
    });

    for (const golem of golems) {
      const tameable = golem.getComponent(EntityComponentTypes.Tameable) as
        | EntityTameableComponent
        | undefined;
      if (tameable?.isTamed) {
        relinquishCommand(golem);
        relinquishedCommands++;
      }
    }

    arg.source.sendMessage(
      `Relinquished command of ${relinquishedCommands} nearby Indigon Golem(s).`,
    );
  },
};
