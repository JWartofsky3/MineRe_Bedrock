import {
  world,
  system,
  Player,
  Dimension,
  EntityDamageCause,
} from "@minecraft/server";
import { addVector3, distVector3, randomVector3 } from "util/vector3Functions";
import { getRandomIntInclusive } from "util/mathFunctions";
import { spawnParticleCloud } from "particles/particleCloud";
import { END_STORMS } from "settings";

const secondsToTicks = (seconds: number) => seconds * 20;

const STORM_PROPERTIES = {
  CHANCE: 0.25,
  MIN_DURATION: 120,
  MAX_DURATION: 240,
  INTERVAL: 600,
  BAND_DISTANCE: 5000,
  BAND_SIZE: 1000,
  MIN_DISTANCE: 1000,
} as const;

const LIGHTNING_PROPERTIES = {
  MAX_DISTANCE: 64,
  MIN_STRIKES: 2,
  MAX_STRIKES: 10,
  MIN_STRIKE_DELAY: 2,
  MAX_STRIKE_DELAY: 7,
  INTERVAL_MIN: 6,
  INTERVAL_MAX: 12,
  HIT_HEIGHT: 5,
  HIT_CHANCE: 0.1,
  GRACE_PERIOD: 15,
} as const;

const PHANTOM_PROPERTIES = {
  CHANCE: 0.07,
  MAX_DENSITY: 4,
  MAX_DISTANCE: 128,
  ALTITUDE: 40,
};

const END_FLAK_PROPERTIES = {
  MIN: 8,
  MAX: 16,
  PARTICLE_DISTANCE: 5,
  PARTICLE_COUNT: 60,
  MAX_DISTANCE: 32,
  DAMAGE_DIST: 10,
  DAMAGE_MULT: 3.0,
  DAMAGE_CAP: 16,
  START_BOTTOM: 0,
  START_TOP: 250,
} as const;

const activeStorms = new Set<string>(); // Use player's ID to track who is storming

export function runEndStorms() {
  system.runInterval(() => {
    if (Math.random() > STORM_PROPERTIES.CHANCE) return;

    const players = world.getDimension("the_end").getPlayers();
    players.forEach((player: Player) => {
      const id = player.id;
      if (isInEndStormZone(player) && !activeStorms.has(id)) {
        runStorm(player);
      }
    });
  }, secondsToTicks(STORM_PROPERTIES.INTERVAL));
}

function runStorm(player: Player) {
  const id = player.id;
  activeStorms.add(id);
  const dimension = player.dimension;

  let canBeStruck = false;
  system.runTimeout(() => {
    canBeStruck = true;
  }, secondsToTicks(LIGHTNING_PROPERTIES.GRACE_PERIOD));

  const lightningInterval = getRandomIntInclusive(
    LIGHTNING_PROPERTIES.INTERVAL_MIN,
    LIGHTNING_PROPERTIES.INTERVAL_MAX,
  );

  const stormRunner = system.runInterval(() => {
    const currentPlayer = getActivePlayerById(id);
    if (!currentPlayer || !isInEndStormZone(currentPlayer)) return;

    triggerLightningStrikes(currentPlayer, dimension, canBeStruck);
    runEndFlak(currentPlayer, dimension, canBeStruck);
  }, secondsToTicks(lightningInterval));

  const stormDuration = getRandomIntInclusive(
    STORM_PROPERTIES.MIN_DURATION,
    STORM_PROPERTIES.MAX_DURATION,
  );

  system.runTimeout(() => {
    system.clearRun(stormRunner);
    activeStorms.delete(id);
  }, secondsToTicks(stormDuration));
}

function getActivePlayerById(id: string): Player | undefined {
  return [...world.getPlayers()].find((p) => p.id === id);
}

function triggerLightningStrikes(
  player: Player,
  dimension: Dimension,
  canBeStruck: boolean,
) {
  const strikesCount = getRandomIntInclusive(
    LIGHTNING_PROPERTIES.MIN_STRIKES,
    LIGHTNING_PROPERTIES.MAX_STRIKES,
  );

  if (Math.random() <= PHANTOM_PROPERTIES.CHANCE) {
    const phantoms = dimension.getEntities({
      location: player.location,
      type: "minere:ender_phantom",
      maxDistance: PHANTOM_PROPERTIES.MAX_DISTANCE,
    });
    if (phantoms.length < PHANTOM_PROPERTIES.MAX_DENSITY) {
      dimension.spawnEntity("minere:ender_phantom", {
        x: player.location.x,
        y: player.location.y + PHANTOM_PROPERTIES.ALTITUDE,
        z: player.location.z,
      });
    }
  }

  for (let i = 0; i < strikesCount; i++) {
    const strikeDelay = getRandomIntInclusive(
      LIGHTNING_PROPERTIES.MIN_STRIKE_DELAY,
      LIGHTNING_PROPERTIES.MAX_STRIKE_DELAY,
    );

    system.runTimeout(() => {
      const currentPlayer = getActivePlayerById(player.id);
      if (!currentPlayer || !isInEndStormZone(currentPlayer)) return;

      const lightningPos = calculateLightningPosition(
        currentPlayer,
        dimension,
        canBeStruck,
      );
      if (lightningPos) {
        dimension.spawnEntity("minecraft:lightning_bolt", lightningPos);
      }
    }, secondsToTicks(strikeDelay));
  }
}

function calculateLightningPosition(
  player: Player,
  dimension: Dimension,
  canBeStruck: boolean,
) {
  const minY = dimension.heightRange.min;
  const maxY = dimension.heightRange.max;

  const clampY = (y: number) => Math.min(Math.max(y, minY), maxY);

  const playerY = player.getHeadLocation().y;
  const groundY =
    dimension.getTopmostBlock(player.location)?.location.y ?? minY;
  const aboveGround = playerY - groundY;

  // Direct hit case
  if (
    aboveGround > LIGHTNING_PROPERTIES.HIT_HEIGHT &&
    Math.random() < LIGHTNING_PROPERTIES.HIT_CHANCE &&
    canBeStruck &&
    player.location.y <= maxY &&
    player.location.y >= minY
  ) {
    return {
      x: player.location.x,
      y: clampY(player.location.y),
      z: player.location.z,
    };
  }

  // Strike near player
  const randomPos = addVector3(
    player.getHeadLocation(),
    randomVector3(LIGHTNING_PROPERTIES.MAX_DISTANCE),
  );
  const topmostBlock = dimension.getTopmostBlock(randomPos);
  if (topmostBlock) {
    return {
      x: topmostBlock.location.x,
      y: clampY(topmostBlock.location.y),
      z: topmostBlock.location.z,
    };
  }

  // Fallback to safe Y
  return {
    x: randomPos.x,
    y: clampY(minY), // use min height if nothing found
    z: randomPos.z,
  };
}

function runEndFlak(
  player: Player,
  dimension: Dimension,
  canBeStruck: boolean,
) {
  let canBeHit = (): boolean => {
    return (
      canBeStruck &&
      isInEndStormZone(player) &&
      (player.location.y < END_FLAK_PROPERTIES.START_BOTTOM ||
        player.location.y > END_FLAK_PROPERTIES.START_TOP)
    );
  };

  const strikes = getRandomIntInclusive(
    END_FLAK_PROPERTIES.MIN,
    END_FLAK_PROPERTIES.MAX,
  );
  for (let i = 0; i < strikes; i++) {
    const delay = getRandomIntInclusive(
      LIGHTNING_PROPERTIES.MIN_STRIKE_DELAY,
      LIGHTNING_PROPERTIES.MAX_STRIKE_DELAY,
    );
    system.runTimeout(() => {
      if (!canBeHit()) {
        return;
      }
      const targetPos = addVector3(
        player.location,
        randomVector3(END_FLAK_PROPERTIES.MAX_DISTANCE),
      );
      spawnParticleCloud(
        "minecraft:end_chest",
        targetPos,
        END_FLAK_PROPERTIES.PARTICLE_DISTANCE,
        END_FLAK_PROPERTIES.PARTICLE_COUNT,
        dimension,
      );
      spawnParticleCloud(
        "minecraft:explosion_manual",
        targetPos,
        END_FLAK_PROPERTIES.PARTICLE_DISTANCE,
        END_FLAK_PROPERTIES.PARTICLE_COUNT,
        dimension,
      );
      dimension.playSound("mob.endermen.portal", targetPos, {
        volume: 5.0,
        pitch: 0.75,
      });
      dimension.playSound("random.explode", targetPos, {
        volume: 5.0,
        pitch: 0.75,
      });
      const dist = distVector3(player.location, targetPos);
      if (dist < END_FLAK_PROPERTIES.DAMAGE_DIST) {
        const flakDamage = Math.min(
          END_FLAK_PROPERTIES.DAMAGE_MULT *
            (END_FLAK_PROPERTIES.DAMAGE_DIST +
              1 -
              END_FLAK_PROPERTIES.DAMAGE_DIST),
          END_FLAK_PROPERTIES.DAMAGE_CAP,
        );
        player.applyDamage(flakDamage, {
          cause: EntityDamageCause.blockExplosion,
        });
      }
    }, secondsToTicks(delay));
  }
}

function isInEndStormZone(player: Player): boolean {
  if (!player) {
    return false;
  }

  if (!world?.getDynamicProperty(END_STORMS)?.valueOf()) {
    return false;
  }

  // Check if player is in "the_end" dimension
  if (player.dimension.id !== "minecraft:the_end") return false;

  const pos = player.getHeadLocation();
  const distance = Math.sqrt(pos.x ** 2 + pos.z ** 2); // Ignore y-axis

  // Check minimum distance from origin
  if (distance < STORM_PROPERTIES.MIN_DISTANCE) return false;

  // Determine if the player is in a no-storm band
  const band = Math.floor(distance / STORM_PROPERTIES.BAND_DISTANCE);
  const bandStart = band * STORM_PROPERTIES.BAND_DISTANCE;
  const bandEnd = bandStart + STORM_PROPERTIES.BAND_SIZE;

  // If in a no-storm band, return false
  if (distance >= bandStart && distance < bandEnd) return false;

  return true; // ✅ Player is eligible for storm
}
