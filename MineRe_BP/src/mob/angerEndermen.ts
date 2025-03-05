import {
  system,
  Entity,
  world,
  EntityRemoveBeforeEvent,
  Dimension,
  VectorXZ,
} from "@minecraft/server";

const VERTICAL_OFFSET = 24;
const LIGHTNING_OFFSET = 5;
const LIGHTNING_BASE_DELAY = 5;
const LIGHTNING_DELAY = 30;

function spawnLightning(dimension: Dimension, pos: VectorXZ, delay: number) {
  system.runTimeout(
    () => {
      dimension.spawnEntity("lightning_bolt", {
        x: pos.x,
        y: dimension.getTopmostBlock(pos)?.location?.y ?? 0,
        z: pos.z,
      });
    },
    LIGHTNING_BASE_DELAY + Math.random() * delay,
  );
}

export const angerEndermen = (data: EntityRemoveBeforeEvent) => {
  const target = data.removedEntity;
  if (!target || target.typeId !== "minecraft:ender_crystal") {
    return;
  }
  const typeId = target.typeId;
  const dimension = world.getDimension(data.removedEntity.dimension.id);
  if (!dimension) {
    return;
  }

  const location = target.location;
  system.run(() => {
    if (
      typeId === "minecraft:ender_crystal" &&
      dimension.id == "minecraft:the_end"
    ) {
      dimension.runCommand(
        `summon minere:ender_phantom ${location.x} ${location.y + VERTICAL_OFFSET} ${location.z} 90 0 minere:spawn_persistent`,
      );
      const endermen = dimension.getEntities({
        type: "enderman",
        closest: 4,
        location: location,
        maxDistance: 100,
      }) as Entity[];
      endermen.forEach((enderman: Entity) => {
        enderman.triggerEvent("minere:start_search");
        world.playSound("mob.endermen.scream", enderman.location, {
          volume: 10.0,
        });
      });

      spawnLightning(
        dimension,
        {
          x: location.x + LIGHTNING_OFFSET,
          z: location.z + LIGHTNING_OFFSET,
        },
        LIGHTNING_DELAY,
      );

      spawnLightning(
        dimension,
        {
          x: location.x - LIGHTNING_OFFSET,
          z: location.z + LIGHTNING_OFFSET,
        },
        LIGHTNING_DELAY,
      );

      spawnLightning(
        dimension,
        {
          x: location.x + LIGHTNING_OFFSET,
          z: location.z - LIGHTNING_OFFSET,
        },
        LIGHTNING_DELAY,
      );

      spawnLightning(
        dimension,
        {
          x: location.x - LIGHTNING_OFFSET,
          z: location.z - LIGHTNING_OFFSET,
        },
        LIGHTNING_DELAY,
      );
    }
  });
};
