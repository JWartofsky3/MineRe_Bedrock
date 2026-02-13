import { ReplacePlaceholderEntitiesEvent } from "events/spawning/replacePlaceholderEntities";
import { InfernoSpawnEvent } from "events/spawning/spawnInferno";
import { EndCrystalDestructionEvent } from "events/reaction/endCrystalDestruction";
import { EndermanTeleportTargetEvent } from "events/reaction/endermanTeleportTarget";
import { CreakingApplyEffectsEvent } from "events/reaction/creakingApplyEffects";
import { ArmorCurveEvent } from "events/player/armorCurveEvent";
import { BonusXPEvent } from "events/player/bonusXPEvent";
import { HorseDieRemoveChestEvent } from "events/reaction/horseDieRemoveChest";

export function RegisterCustomEvents() {
  // spawn events
  new ReplacePlaceholderEntitiesEvent().register();
  new InfernoSpawnEvent().register();

  // reaction events
  new EndCrystalDestructionEvent().register();
  new EndermanTeleportTargetEvent().register();
  new CreakingApplyEffectsEvent().register();
  new HorseDieRemoveChestEvent().register();

  // player events
  new ArmorCurveEvent().register();
  new BonusXPEvent().register();
}
