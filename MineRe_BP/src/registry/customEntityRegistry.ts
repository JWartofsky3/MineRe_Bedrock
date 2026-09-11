import { Demon } from "entities/mobs/Demon";
import { Ghost } from "entities/mobs/Ghost";
import { Ogre } from "entities/mobs/Ogre";
import { Vampire } from "entities/mobs/Vampire";
import { Walker } from "entities/mobs/Walker";
import { FriendlyWalker } from "entities/mobs/FriendlyWalker";
import { WebSpider } from "entities/mobs/WebSpider";
import { Yeti } from "entities/mobs/Yeti";
import { IceCharge } from "entities/projectiles/IceCharge";
import { Bomb } from "entities/projectiles/Bomb";
import { FireBomb } from "entities/projectiles/FireBomb";
import { IceBomb } from "entities/projectiles/IceBomb";
import { PoisonBomb } from "entities/projectiles/PoisonBomb";
import { WindBomb } from "entities/projectiles/WindBomb";
import { Gremlin } from "entities/mobs/Gremlin";
import { Freeze } from "entities/mobs/Freeze";
import { Moose } from "entities/mobs/Moose";
import { Skelemoose } from "entities/mobs/Skelemoose";
import { EnderPhantom } from "entities/mobs/EnderPhantom";
import { Earthquake } from "entities/otherEntities/Earthquake";
import { Inferno } from "entities/bosses/inferno/Inferno";
import { Glacier } from "entities/bosses/glacier/Glacier";
import { Elephant } from "entities/mobs/Elephant";
import { Skelephant } from "entities/mobs/Skelephant";
import { GrizzlyBear } from "entities/mobs/GrizzlyBear";
import { IndigonGolem } from "entities/mobs/IndigonGolem";
import { CorruptedIndigonGolem } from "entities/mobs/CorruptedIndigonGolem";
import { PlasmaBolt } from "entities/projectiles/PlasmaBolt";
import { DarkCharge } from "entities/projectiles/DarkCharge";
import { DarkBomb } from "entities/projectiles/DarkBomb";
//import { Deer } from "entities/mobs/Deer";
import { IceSpike } from "entities/otherEntities/IceSpike";
import { CustomPlayer } from "entities/player/Player";

export function registerCustomEntities() {
  // mobs
  new Demon().register();
  new Ogre().register();
  new Vampire().register();
  new Ghost().register();
  new Walker().register();
  new FriendlyWalker().register();
  new Yeti().register();
  new WebSpider().register();
  new Gremlin().register();
  new Freeze().register();
  new Moose().register();
  new Skelemoose().register();
  new EnderPhantom().register();
  new Elephant().register();
  new Skelephant().register();
  new GrizzlyBear().register();
  new IndigonGolem().register();
  new CorruptedIndigonGolem().register();
  //new Deer().register();

  // projectiles
  new IceCharge().register();
  new Bomb().register();
  new FireBomb().register();
  new IceBomb().register();
  new PoisonBomb().register();
  new WindBomb().register();
  new PlasmaBolt().register();
  new DarkCharge().register();
  new DarkBomb().register();

  // others
  new Earthquake().register();
  new IceSpike().register();

  // bosses
  new Inferno().register();
  new Glacier().register();

  // player
  new CustomPlayer().register();
}
