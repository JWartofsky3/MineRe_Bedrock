import { system, world, ItemUseBeforeEvent, EntityDamageCause, ItemComponentTypes } from "@minecraft/server";
import { consumeXp } from "entities/functions/consumeXp";
import { addVector3, distVector3, multiplyVector3Number } from "util/vector3Functions";
import { isAlive } from "mob/mob_utils";
import { reduceDurability } from "../components/reduce_durability";
import { showHint } from "./staffHints";

const RANGE = 40;
const DAMAGE = 16;
const XP_COST = 6;
const AREA_OF_EFFECT = 2.5;
const SHADOW_TIME = 8 * 20;

export const useShadowStaff = (data: ItemUseBeforeEvent) => {
  if (!data.source || data.itemStack.typeId !== "minere:shadow_staff") return;
  const source = data.source;
  const item = data.itemStack;
  const cooldown = item.getComponent(ItemComponentTypes.Cooldown);
  system.run(() => {
    if (cooldown?.getCooldownTicksRemaining(source)) return;
    if (source.isSneaking) {
      if (!consumeXp(source, 10)) { source.playSound("item.amethyst_staff.error"); showHint(source, "hint.minere:staff.shadow.shadow_xp"); return; }
      cooldown?.startCooldown(source);
      source.addEffect("blindness", SHADOW_TIME, { showParticles: false });
      source.addEffect("invisibility", SHADOW_TIME, { showParticles: false });
      source.addEffect("speed", SHADOW_TIME, { showParticles: false, amplifier: 2 });
      source.addEffect("jump_boost", SHADOW_TIME, { showParticles: false, amplifier: 3 });
      source.addEffect("slow_falling", SHADOW_TIME, { showParticles: false });
      source.addEffect("regeneration", SHADOW_TIME, { showParticles: false });
      source.addEffect("weakness", SHADOW_TIME, { showParticles: false });
      source.dimension.playSound("item.echo_staff.whoosh", source.location);
      reduceDurability(source, item, 5);
      return;
    }
    if (!consumeXp(source, XP_COST)) { source.playSound("item.amethyst_staff.error"); showHint(source, "hint.minere:staff.shadow.xp"); return; }
    cooldown?.startCooldown(source);
    reduceDurability(source, item, 1);
    const dimension = world.getDimension(source.dimension.id);
    const start = source.getHeadLocation();
    const direction = source.getViewDirection();
    const target = source.getBlockFromViewDirection({ maxDistance: RANGE, includeLiquidBlocks: false, includePassableBlocks: false })?.block?.location ?? addVector3(start, multiplyVector3Number(direction, RANGE));
    const distance = distVector3(start, target);
    const hit = new Set<string>();
    for (let i = 1; i <= distance; i++) {
      system.runTimeout(() => {
        const pos = addVector3(start, multiplyVector3Number(direction, i));
        pos.y -= 0.008 * i * i;
        dimension.spawnParticle("minere:dark_wave", pos);
        dimension.playSound("item.shadow_staff.wave", pos);
        system.runTimeout(() => {
          for (const entity of dimension.getEntities({ location: pos, maxDistance: AREA_OF_EFFECT })) {
            if (entity.id === source.id || hit.has(entity.id) || !isAlive(entity)) continue;
            hit.add(entity.id);
            entity.applyDamage(DAMAGE, { damagingEntity: source, cause: EntityDamageCause.magic });
          }
          const block = dimension.getBlock(pos);
          if (block?.typeId === "minecraft:grass_block") block.setType("minecraft:dirt");
          else if (block?.typeId?.endsWith("_leaves") || block?.typeId?.endsWith("_leaves2")) block.setType("minecraft:air");
        }, 1);
      }, i);
    }
  });
};
