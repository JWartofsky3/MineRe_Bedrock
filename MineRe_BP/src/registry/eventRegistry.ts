import { ReplacePlaceholderEntitiesEvent } from "events/spawning/replacePlaceholderEntities";
import { InfernoSpawnEvent } from "events/spawning/spawnInferno";
import { EndCrystalDestructionEvent } from "events/reaction/endCrystalDestruction";
import { EndermanTeleportTargetEvent } from "events/reaction/endermanTeleportTarget";
import { CreakingApplyEffectsEvent } from "events/reaction/creakingApplyEffects";
import { ArmorCurveEvent } from "events/player/armorCurveEvent";
import { BonusXPEvent } from "events/player/bonusXPEvent";
import { HorseDieRemoveChestEvent } from "events/reaction/horseDieRemoveChest";
import { BabySpawnMatchParentEvent } from "events/spawning/babySpawnMatchParent";
import { PlayerInputEvent } from "events/player/playerInputEvent";

export function RegisterCustomEvents() {
  // spawn events
  new ReplacePlaceholderEntitiesEvent().register();
  new InfernoSpawnEvent().register();
  new BabySpawnMatchParentEvent().register();

  // reaction events
  new EndCrystalDestructionEvent().register();
  new EndermanTeleportTargetEvent().register();
  new CreakingApplyEffectsEvent().register();
  new HorseDieRemoveChestEvent().register();

  // player events
  new ArmorCurveEvent().register();
  new BonusXPEvent().register();
  new PlayerInputEvent().register();
}
