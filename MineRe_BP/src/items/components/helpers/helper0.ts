import { ItemCustomComponent, Player } from "@minecraft/server";
import { takeCommand } from "entities/helpers/commandableCompanion";

const INDIGON_GOLEM = "minere:indigon_golem";

export const Helper0: ItemCustomComponent = {
  onUse(arg) {
    if (!(arg.source instanceof Player)) {
      return;
    }

    const golems = arg.source.dimension.getEntities({
      type: INDIGON_GOLEM,
      location: arg.source.location,
      maxDistance: 16,
    });

    let commandedGolems = 0;
    for (const golem of golems) {
      if (takeCommand(golem, arg.source, "minere:take_command")) {
        commandedGolems++;
      }
    }

    arg.source.sendMessage(
      `Took command of ${commandedGolems} nearby Indigon Golem(s).`,
    );
  },
};
