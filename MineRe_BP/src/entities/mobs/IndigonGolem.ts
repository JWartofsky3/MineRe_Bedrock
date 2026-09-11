import {
  Entity,
  EntityComponentTypes,
  EntityDamageCause,
  EntityHealthComponent,
  EntityHealthChangedAfterEvent,
  EntityHurtAfterEvent,
  EntityInventoryComponent,
  EntityTameableComponent,
  Player,
  PlayerInteractWithEntityAfterEvent,
  RawMessage,
  system,
  Vector3,
} from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import { BaseCustomEntity } from "entities/BaseCustomEntity";
import { createCompanionMessenger } from "entities/helpers/companionMessages";
import {
  getTameable,
  getTamedOwner,
  isTamed,
  isTamedBy,
  takeCommand,
} from "entities/helpers/commandableCompanion";
import { findValidLocation } from "functions/area/findValidLocation";
import { particleWave } from "particles/particleWave";

// Spell timing and friendly-support targeting.
const SUPERCHARGE_DURATION_TICKS = 30 * 20;
const RECOVERY_SPELL_DURATION_TICKS = 15 * 20;
const RECOVERY_FIRE_RESISTANCE_DURATION_TICKS = 10 * 20;
const SUMMON_ANIMATION_TICKS = 2 * 20;
const SUPERCHARGE_PARTICLE_DURATION_TICKS = 50;
const SELF_REPAIR_COOLDOWN_TICKS = 60 * 20;
const SELF_REPAIR_HEALTH = 25;
const SELF_REPAIR_MIN_MISSING_HEALTH = SELF_REPAIR_HEALTH * 0.8;
const SUPERCHARGE_COOLDOWN_TICKS = 45 * 20;
const SUPPORT_SCAN_INTERVAL_TICKS = 5 * 20;
const SUPPORT_SCAN_RADIUS = 10;
const SUPERCHARGE_THREAT_RADIUS = 16;

// Follow teleportation.
const FOLLOW_TELEPORT_COOLDOWN_TICKS = 10 * 20;
const FOLLOW_TELEPORT_MIN_DISTANCE = 20;
const FOLLOW_TELEPORT_MAX_DISTANCE = 64;
const FOLLOW_TELEPORT_DESTINATION_RADIUS = 8;
const FOLLOW_TELEPORT_ATTEMPTS = 6;
const FOLLOW_TELEPORT_CLEARANCE_HEIGHT = 3;
const FOLLOW_TELEPORT_CLEARANCE_RADIUS = 1;
const FOLLOW_TELEPORT_GROUND_SCAN_HEIGHT = 12;
const FOLLOW_TELEPORT_GROUND_SCAN_DEPTH = 16;
// Command range and health thresholds.
const COMMAND_RANGE = 32;
const DAMAGE_MESSAGE_COOLDOWN_TICKS = 30 * 20;
const CRITICAL_HEALTH_THRESHOLD = 0.5;
const RECOVERY_HEALTH_THRESHOLD = 0.75;
const DAMAGE_0_HEALTH_THRESHOLD = 160;
const DAMAGE_1_HEALTH_THRESHOLD = 120;
const DAMAGE_2_HEALTH_THRESHOLD = 80;
const DAMAGE_3_HEALTH_THRESHOLD = 40;

// Spell audiovisual effects.
const INDIGON_ARMOR_POWERUP_SOUND = "item.armor.powerup";
const INDIGON_MAGIC_SHORT_PARTICLE = "minere:indigon_magic_short";
const IRON_GOLEM_REPAIR_SOUND = "mob.irongolem.repair";
const END_TELEPORT_SOUND = "mob.endermen.portal";

const {
  send: sendIndigonGolemMessage,
  sendToOwner: sendIndigonGolemMessageToOwner,
} = createCompanionMessenger({
  commandRange: COMMAND_RANGE,
  nameColor: "§5",
  nameTranslationKey: "entity.minere:indigon_golem.name",
});

// Persistent golem state.
const SUPERCHARGE_COOLDOWN_PROPERTY =
  "minere:indigon_golem_supercharge_cooldown";
const SELF_REPAIR_COOLDOWN_PROPERTY =
  "minere:indigon_golem_self_repair_cooldown";
const FOLLOW_TELEPORT_COOLDOWN_PROPERTY =
  "minere:indigon_golem_follow_teleport_cooldown";
const AUTO_HEAL_ENABLED_PROPERTY = "minere:indigon_golem_auto_heal_enabled";
const PICKUP_ITEMS_ENABLED_PROPERTY =
  "minere:indigon_golem_pickup_items_enabled";
const PATROL_ENABLED_PROPERTY = "minere:indigon_golem_patrol_enabled";
const FOLLOW_OWNER_ENABLED_PROPERTY =
  "minere:indigon_golem_follow_owner_enabled";
const ATTACK_MODE_PROPERTY = "minere:indigon_golem_attack_mode";
const PLASMA_CANNON_ACTIVE_PROPERTY =
  "minere:indigon_golem_plasma_cannon_active";
const SONIC_BLASTER_ACTIVE_PROPERTY =
  "minere:indigon_golem_sonic_blaster_active";
const PLASMA_CANNON_DISABLED_TAG = "minere:indigon_plasma_cannon_disabled";
const HALF_HEALTH_MESSAGE_COOLDOWN_PROPERTY =
  "minere:indigon_golem_half_health_message_cooldown";
const CRITICAL_HEALTH_MESSAGE_COOLDOWN_PROPERTY =
  "minere:indigon_golem_critical_health_message_cooldown";
const RECOVERY_MESSAGE_COOLDOWN_PROPERTY =
  "minere:indigon_golem_recovery_message_cooldown";
const SPELLCASTING_PROPERTY = "minere:indigon_golem_spellcasting";

// Client-synced animation state.
const WEAPON_CHARGING_PROPERTY = "minere:is_weapon_charging";

// Sonic Blaster ammunition use.
const SONIC_AMMO_CONSUMPTION_CHANCE = 0.02;
const SONIC_AMMO_USE_TICK_PROPERTY = "minere:indigon_golem_sonic_ammo_use_tick";
const ECHO_SHARD_ITEM_TYPE_ID = "minecraft:echo_shard";

// Behavior-pack events.
const TAKE_COMMAND_EVENT = "minere:take_command";
const RELINQUISH_COMMAND_EVENT = "minere:relinquish_command";
const FOLLOW_OWNER_EVENT = "minere:follow_owner";
const STAY_HERE_EVENT = "minere:stay_here";
const AT_EASE_EVENT = "minere:at_ease";
const SUPERCHARGE_EVENT = "minere:supercharge";
const END_SUPERCHARGE_EVENT = "minere:end_supercharge";
const ENABLE_ATTACK_HOSTILE_EVENT = "minere:enable_attack_hostile";
const ENABLE_ATTACK_MONSTERS_EVENT = "minere:enable_attack_monsters";
const ENABLE_ATTACK_OTHER_PLAYERS_EVENT = "minere:enable_attack_other_players";
const ENABLE_ATTACK_EVERYTHING_EVENT = "minere:enable_attack_everything";
const ENABLE_ATTACK_ONLY_OWNER_TARGET_EVENT =
  "minere:enable_attack_only_owner_target";
const ACTIVATE_PLASMA_CANNON_EVENT = "minere:activate_plasma_cannon";
const DEACTIVATE_PLASMA_CANNON_EVENT = "minere:deactivate_plasma_cannon";
const ACTIVATE_SONIC_BLASTER_EVENT = "minere:activate_sonic_blaster";
const DEACTIVATE_SONIC_BLASTER_EVENT = "minere:deactivate_sonic_blaster";
const ENABLE_ITEM_PICKUP_EVENT = "minere:enable_item_pickup";
const DISABLE_ITEM_PICKUP_EVENT = "minere:disable_item_pickup";

type AttackMode =
  | "hostile"
  | "monsters"
  | "other_players"
  | "everything"
  | "only_owner_target";

// UI attack-mode options.
const ATTACK_MODE_LABELS: Record<AttackMode, RawMessage> = {
  hostile: { translate: "ui.minere.indigon_golem.attack_mode.hostile" },
  monsters: { translate: "ui.minere.indigon_golem.attack_mode.monsters" },
  other_players: {
    translate: "ui.minere.indigon_golem.attack_mode.other_players",
  },
  everything: {
    translate: "ui.minere.indigon_golem.attack_mode.everything",
  },
  only_owner_target: {
    translate: "ui.minere.indigon_golem.attack_mode.only_owner_target",
  },
};
const ATTACK_MODE_OPTIONS: AttackMode[] = [
  "hostile",
  "monsters",
  "other_players",
  "everything",
  "only_owner_target",
];
const COMMAND_GREETINGS = [
  "ui.minere.indigon_golem.command_greeting.protocols_active",
  "ui.minere.indigon_golem.command_greeting.defenses_updated",
  "ui.minere.indigon_golem.command_greeting.awaiting_command",
];

// Friendly entities eligible for support spells.
const SUPERCHARGE_TARGET_TYPE_IDS = new Set([
  "minecraft:iron_golem",
  "minecraft:player",
  "minecraft:villager",
  "minecraft:villager_v2",
  "minecraft:copper_golem",
  "minere:copper_golem",
  "minere:indigon_golem",
]);

// Owner alerts for golem health thresholds.
const HALF_HEALTH_MESSAGES = [
  "message.minere.indigon_golem.damage_heavy",
  "message.minere.indigon_golem.damage_integrity",
  "message.minere.indigon_golem.damage_assistance",
];
const CRITICAL_HEALTH_MESSAGES = [
  "message.minere.indigon_golem.damage_core_shutdown",
  "message.minere.indigon_golem.damage_critical",
  "message.minere.indigon_golem.damage_repair_required",
];
const RECOVERY_MESSAGES = [
  "message.minere.indigon_golem.recovery_nominal",
  "message.minere.indigon_golem.recovery_integrity_restored",
  "message.minere.indigon_golem.recovery_systems_restored",
];

export class IndigonGolem extends BaseCustomEntity {
  constructor() {
    super("minere:indigon_golem", { tick: 1 });
  }

  onPlayerInteractWithEntity = (
    data: PlayerInteractWithEntityAfterEvent,
  ): void => {
    if (data.beforeItemStack?.typeId === "minere:indigon_ingot") {
      return;
    }
    if (data.player.isSneaking) {
      return;
    }
    if (!canOpenGolemCommands(data.player, data.target)) {
      return;
    }
    showIndigonGolemCommands(data.player, data.target);
  };

  onEntityLoad = (data: { entity: Entity }): void => {
    data.entity.triggerEvent(END_SUPERCHARGE_EVENT);
    data.entity.setDynamicProperty(SPELLCASTING_PROPERTY, false);
    syncWeaponCharging(data.entity);
    syncAttackMode(data.entity);
    syncPlasmaCannon(data.entity);
    syncSonicBlaster(data.entity);
    syncItemPickup(data.entity);
    syncCommandMovement(data.entity);
  };

  onEntityHealthChanged = (data: EntityHealthChangedAfterEvent): void => {
    sendRecoveryStatusMessage(data);
    sendDamageStatusMessage(data.entity);
  };

  onLoad = (golem: Entity): void => {
    golem.triggerEvent("minere:end_supercharge");
  }

  onEntityHurtEntity = (data: EntityHurtAfterEvent): void => {
    if (data.damageSource.cause !== EntityDamageCause.sonicBoom) {
      return;
    }

    const golem = data.damageSource.damagingEntity;
    if (
      !golem?.isValid ||
      !isSonicBlasterActive(golem) ||
      getLastSonicAmmoUseTick(golem) === system.currentTick
    ) {
      return;
    }

    golem.setDynamicProperty(SONIC_AMMO_USE_TICK_PROPERTY, system.currentTick);
    if (Math.random() < SONIC_AMMO_CONSUMPTION_CHANCE) {
      consumeInventoryItem(golem, ECHO_SHARD_ITEM_TYPE_ID);
    }
    syncWeaponAmmo(golem);
  };

  onTick = (golem: Entity): void => {
    syncWeaponCharging(golem);
    trySelfRepair(golem);
    if (system.currentTick % SUPPORT_SCAN_INTERVAL_TICKS !== 0) {
      return;
    }

    syncWeaponAmmo(golem);
    tryTeleportToOwner(golem);
    if (
      !isAutoHealingEnabled(golem) ||
      !isSuperchargeReady(golem) ||
      isWeaponCharging(golem)
    ) {
      return;
    }

    let targets = golem.dimension
      .getEntities({
        location: golem.location,
        maxDistance: SUPPORT_SCAN_RADIUS,
      })
      .filter(isHealingNeeded)
      .filter((target) => hasLineOfSight(golem, target));
    if (isPlayerAttackMode(getAttackMode(golem))) {
      const ownerId = getTamedOwner(golem)?.id;
      targets = ownerId
        ? targets.filter((target) => target.id === ownerId)
        : [];
    } else if (
      isHealingNeeded(golem) &&
      !targets.some((target) => target.id === golem.id)
    ) {
      targets.push(golem);
    }
    if (targets.length === 0) {
      return;
    }
    if (
      targets.length > 1 ||
      targets.some(
        (target) =>
          getHealthRatio(target) < CRITICAL_HEALTH_THRESHOLD ||
          isOnFire(target),
      )
    ) {
      castRecoverySpell(golem, targets);
      return;
    }

    const threatenedTargets = targets.filter(hasNearbyMonster);
    if (threatenedTargets.length === 0) {
      return;
    }

    const players = threatenedTargets.filter(
      (target) => target instanceof Player,
    );
    const prioritizedTargets = players.length > 0 ? players : threatenedTargets;
    const target = prioritizedTargets.reduce(
      (lowestHealthTarget, candidate) => {
        return getHealthRatio(candidate) < getHealthRatio(lowestHealthTarget)
          ? candidate
          : lowestHealthTarget;
      },
    );
    superchargeTargets(golem, [target]);
  };
}

function takeIndigonGolemCommand(golem: Entity, player: Player): boolean {
  const wasTamed = isTamed(golem);
  if (!takeCommand(golem, player, TAKE_COMMAND_EVENT)) {
    return false;
  }
  if (wasTamed) {
    return true;
  }

  system.runTimeout(() => {
    if (!golem.isValid) {
      return;
    }
    const tameable = getTameable(golem);
    if (tameable?.isTamed) {
      tameable.tame(player);
    }
  }, 3);
  return true;
}

function showIndigonGolemCommands(player: Player, golem: Entity): void {
  if (!golem.isValid) {
    return;
  }

  const title = golem.nameTag || {
    translate: "entity.minere:indigon_golem.name",
  };
  const superchargeReady = isSuperchargeReady(golem);
  const isFollowing = isFollowingOwner(golem);
  const isPatrolling = isPatrolEnabled(golem);
  const isOwned = isTamed(golem);
  const isOwner = isTamedBy(golem, player);
  const plasmaCannonActive = isPlasmaCannonActive(golem);
  const sonicBlasterActive = isSonicBlasterActive(golem);
  const owner = getTamedOwner(golem);
  const commandGreeting = getRandomMessage(COMMAND_GREETINGS);
  const health = golem.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  const healthStatus = `${getHealthStatusColor(health)}${Math.ceil(
    health.currentValue,
  )}/${Math.ceil(health.effectiveMax)}§r`;
  const energyStatus: RawMessage[] = superchargeReady
    ? [
      { text: "§a" },
      { translate: "ui.minere.indigon_golem.energy_charged" },
      { text: "§r" },
    ]
    : [
      { text: "§c" },
      {
        translate: "ui.minere.indigon_golem.energy_recharging",
        with: [getSuperchargeRemainingSeconds(golem).toString()],
      },
      { text: "§r" },
    ];
  const form = new ActionFormData().title(title).body({
    rawtext: [
      { translate: "ui.minere.indigon_golem.health" },
      { text: ` ${healthStatus}\n` },
      { translate: "ui.minere.indigon_golem.energy" },
      { text: " " },
      ...energyStatus,
      ...(owner
        ? [
          { text: "\n" },
          { translate: "ui.minere.indigon_golem.owner" },
          { text: ` §e${owner.name}§r` },
        ]
        : []),
      { text: "\n\n" },
      { translate: commandGreeting },
    ],
  });
  if (isGuestCommander(player, golem)) {
    form.button(
      superchargeReady
        ? { translate: "ui.minere.indigon_golem.button.supercharge" }
        : {
          rawtext: [
            { text: "§0" },
            { translate: "ui.minere.indigon_golem.button.supercharge" },
            { text: "\n§c" },
            { translate: "ui.minere.indigon_golem.button.recharging" },
          ],
        },
      "textures/items/redstone_dust",
    );
    form
      .show(player)
      .then((response) => {
        if (response.canceled || response.selection === undefined) {
          return;
        }
        if (!golem.isValid) {
          return;
        }
        if (!isWithinCommandRange(player, golem)) {
          sendCommandTooFarMessage(player, golem);
          return;
        }
        if (!isSuperchargeReady(golem)) {
          sendIndigonGolemMessage(
            player,
            golem,
            "message.minere.indigon_golem.supercharge_unavailable",
          );
          return;
        }
        superchargeTargets(golem, [player]);
      })
      .catch((error) =>
        console.error("Failed to show Indigon Golem commands: " + error),
      );
    return;
  }
  form.button(
    {
      translate: isFollowing
        ? "ui.minere.indigon_golem.button.stop_following"
        : "ui.minere.indigon_golem.button.follow",
    },
    isFollowing ? "textures/blocks/barrier" : "textures/items/string",
  );
  form.button(
    {
      translate: isPatrolling
        ? "ui.minere.indigon_golem.button.hold_position"
        : "ui.minere.indigon_golem.button.patrol",
    },
    isPatrolling ? "textures/items/iron_ingot" : "textures/items/feather",
  );
  form.button(
    superchargeReady
      ? { translate: "ui.minere.indigon_golem.button.supercharge" }
      : {
        rawtext: [
          { text: "§0" },
          { translate: "ui.minere.indigon_golem.button.supercharge" },
          { text: "\n§c" },
          { translate: "ui.minere.indigon_golem.button.recharging" },
        ],
      },
    "textures/items/redstone_dust",
  );
  form.button(
    superchargeReady
      ? { translate: "ui.minere.indigon_golem.button.levitate" }
      : {
        rawtext: [
          { text: "§0" },
          { translate: "ui.minere.indigon_golem.button.levitate" },
          { text: "\n§c" },
          { translate: "ui.minere.indigon_golem.button.recharging" },
        ],
      },
    "textures/items/glowstone_dust",
  );
  form.button(
    {
      translate: plasmaCannonActive
        ? "ui.minere.indigon_golem.button.deactivate_plasma_cannon"
        : "ui.minere.indigon_golem.button.activate_plasma_cannon",
    },
    plasmaCannonActive
      ? "textures/blocks/barrier"
      : "textures/items/minere/ender_plasma",
  );
  form.button(
    {
      translate: sonicBlasterActive
        ? "ui.minere.indigon_golem.button.deactivate_sonic_blaster"
        : "ui.minere.indigon_golem.button.activate_sonic_blaster",
    },
    sonicBlasterActive
      ? "textures/blocks/barrier"
      : "textures/items/echo_shard",
  );
  if (isOwner) {
    form.button(
      { translate: "ui.minere.indigon_golem.button.settings" },
      "textures/items/repeater",
    );
  }
  form.button(
    {
      translate: isOwned
        ? "ui.minere.indigon_golem.button.relinquish_command"
        : "ui.minere.indigon_golem.button.take_command",
    },
    "textures/items/name_tag",
  );

  form
    .show(player)
    .then((response) => {
      if (response.canceled || response.selection === undefined) {
        return;
      }
      if (!golem.isValid) {
        return;
      }
      if (!isWithinCommandRange(player, golem)) {
        sendCommandTooFarMessage(player, golem);
        return;
      }
      switch (response.selection) {
        case 0:
          if (isFollowing) {
            setPatrolEnabled(golem, true);
            setFollowingOwner(golem, false);
            golem.triggerEvent(AT_EASE_EVENT);
            sendIndigonGolemMessage(
              player,
              golem,
              "message.minere.indigon_golem.stop_following",
            );
            return;
          }
          if (
            !isOwned &&
            !takeIndigonGolemCommand(golem, player)
          ) {
            return;
          }
          setPatrolEnabled(golem, false);
          setFollowingOwner(golem, true);
          golem.triggerEvent(FOLLOW_OWNER_EVENT);
          sendIndigonGolemMessage(
            player,
            golem,
            "message.minere.indigon_golem.following",
          );
          return;
        case 1:
          if (isPatrolling) {
            setPatrolEnabled(golem, false);
            setFollowingOwner(golem, false);
            golem.triggerEvent(STAY_HERE_EVENT);
            sendIndigonGolemMessage(
              player,
              golem,
              "message.minere.indigon_golem.holding_position",
            );
            return;
          }
          setPatrolEnabled(golem, true);
          setFollowingOwner(golem, false);
          golem.triggerEvent(AT_EASE_EVENT);
          sendIndigonGolemMessage(
            player,
            golem,
            "message.minere.indigon_golem.patrolling",
          );
          return;
        case 2:
          if (!isSuperchargeReady(golem)) {
            sendIndigonGolemMessage(
              player,
              golem,
              "message.minere.indigon_golem.supercharge_unavailable",
            );
            return;
          }
          superchargeTargets(golem, [player]);
          return;
        case 3:
          if (!isSuperchargeReady(golem)) {
            sendIndigonGolemMessage(
              player,
              golem,
              "message.minere.indigon_golem.levitate_unavailable",
            );
            return;
          }
          levitatePlayer(golem, player);
          return;
        case 4:
          if (!plasmaCannonActive && !hasEnderPlasma(golem)) {
            sendPlasmaRequirementMessage(player, golem);
            return;
          }
          setPlasmaCannonActive(golem, !plasmaCannonActive);
          sendIndigonGolemMessage(
            player,
            golem,
            plasmaCannonActive
              ? "message.minere.indigon_golem.plasma_cannon_deactivated"
              : "message.minere.indigon_golem.plasma_cannon_activated",
          );
          return;
        case 5:
          if (!sonicBlasterActive && !hasEchoShards(golem)) {
            sendSonicRequirementMessage(player, golem);
            return;
          }
          setSonicBlasterActive(golem, !sonicBlasterActive);
          sendIndigonGolemMessage(
            player,
            golem,
            sonicBlasterActive
              ? "message.minere.indigon_golem.sonic_blaster_deactivated"
              : "message.minere.indigon_golem.sonic_blaster_activated",
          );
          return;
        case 6:
          if (isOwner) {
            showIndigonGolemSettings(player, golem);
            return;
          }
          if (!takeIndigonGolemCommand(golem, player)) {
            return;
          }
          sendIndigonGolemMessage(
            player,
            golem,
            "message.minere.indigon_golem.command_taken",
          );
          return;
        case 7:
          showRelinquishCommandConfirmation(player, golem);
          return;
      }
    })
    .catch((error) =>
      console.error("Failed to show Indigon Golem commands: " + error),
    );
}

function showRelinquishCommandConfirmation(
  player: Player,
  golem: Entity,
): void {
  new MessageFormData()
    .title({ translate: "ui.minere.indigon_golem.relinquish_confirm.title" })
    .body({ translate: "ui.minere.indigon_golem.relinquish_confirm.body" })
    .button1({ translate: "ui.minere.indigon_golem.relinquish_confirm.yes" })
    .button2({ translate: "ui.minere.indigon_golem.relinquish_confirm.no" })
    .show(player)
    .then((response) => {
      if (response.canceled || response.selection !== 0) {
        return;
      }
      if (!golem.isValid || !isWithinCommandRange(player, golem)) {
        if (golem.isValid) {
          sendCommandTooFarMessage(player, golem);
        }
        return;
      }
      if (!isTamedBy(golem, player)) {
        return;
      }

      relinquishCommand(golem);
      sendIndigonGolemMessage(
        player,
        golem,
        "message.minere.indigon_golem.command_relinquished",
      );
    })
    .catch((error) =>
      console.error("Failed to show Indigon Golem confirmation: " + error),
    );
}

function showIndigonGolemSettings(player: Player, golem: Entity): void {
  if (!isTamedBy(golem, player)) {
    return;
  }

  const title = golem.nameTag || {
    translate: "entity.minere:indigon_golem.name",
  };
  const form = new ModalFormData().title(title);
  form.toggle("Heal Friendlies", {
    defaultValue: isAutoHealingEnabled(golem),
    tooltip: { translate: "ui.minere.indigon_golem.heal_friendlies_hint" },
  });
  form.toggle("Pickup Items", {
    defaultValue: isItemPickupEnabled(golem),
    tooltip: { translate: "ui.minere.indigon_golem.inventory_hint" },
  });
  const attackMode = getAttackMode(golem);
  form.dropdown(
    { translate: "ui.minere.indigon_golem.settings.attacks" },
    ATTACK_MODE_OPTIONS.map((mode) => ATTACK_MODE_LABELS[mode]),
    { defaultValueIndex: ATTACK_MODE_OPTIONS.indexOf(attackMode) },
  );
  form.submitButton("Save");

  form
    .show(player)
    .then((response) => {
      if (response.canceled || response.formValues?.length !== 3) {
        return;
      }
      if (!golem.isValid || !isWithinCommandRange(player, golem)) {
        if (golem.isValid) {
          sendCommandTooFarMessage(player, golem);
        }
        return;
      }

      const selectedAttackMode =
        ATTACK_MODE_OPTIONS[response.formValues[2] as number];
      if (!selectedAttackMode) {
        return;
      }

      golem.setDynamicProperty(
        AUTO_HEAL_ENABLED_PROPERTY,
        response.formValues[0] as boolean,
      );
      setItemPickupEnabled(golem, response.formValues[1] as boolean);
      setAttackMode(golem, selectedAttackMode);
      sendIndigonGolemMessage(
        player,
        golem,
        "message.minere.indigon_golem.commands_accepted",
      );
    })
    .catch((error) =>
      console.error("Failed to show Indigon Golem settings: " + error),
    );
}

function isAutoHealingEnabled(golem: Entity): boolean {
  return isToggleEnabled(golem, AUTO_HEAL_ENABLED_PROPERTY, true);
}

function isItemPickupEnabled(golem: Entity): boolean {
  return isToggleEnabled(golem, PICKUP_ITEMS_ENABLED_PROPERTY, false);
}

function isPatrolEnabled(golem: Entity): boolean {
  return isToggleEnabled(golem, PATROL_ENABLED_PROPERTY, true);
}

function setPatrolEnabled(golem: Entity, enabled: boolean): void {
  golem.setDynamicProperty(PATROL_ENABLED_PROPERTY, enabled);
}

function isFollowingOwnerEnabled(golem: Entity): boolean {
  return isToggleEnabled(golem, FOLLOW_OWNER_ENABLED_PROPERTY, false);
}

function setFollowingOwner(golem: Entity, enabled: boolean): void {
  golem.setDynamicProperty(FOLLOW_OWNER_ENABLED_PROPERTY, enabled);
}

function syncCommandMovement(golem: Entity): void {
  if (isFollowingOwner(golem)) {
    golem.triggerEvent(FOLLOW_OWNER_EVENT);
    return;
  }

  golem.triggerEvent(isPatrolEnabled(golem) ? AT_EASE_EVENT : STAY_HERE_EVENT);
}

function setItemPickupEnabled(golem: Entity, enabled: boolean): void {
  golem.setDynamicProperty(PICKUP_ITEMS_ENABLED_PROPERTY, enabled);
  golem.triggerEvent(
    enabled ? ENABLE_ITEM_PICKUP_EVENT : DISABLE_ITEM_PICKUP_EVENT,
  );
}

function syncItemPickup(golem: Entity): void {
  setItemPickupEnabled(golem, isItemPickupEnabled(golem));
}

function isWithinCommandRange(player: Player, golem: Entity): boolean {
  if (player.dimension !== golem.dimension) {
    return false;
  }

  const deltaX = player.location.x - golem.location.x;
  const deltaY = player.location.y - golem.location.y;
  const deltaZ = player.location.z - golem.location.z;
  return (
    deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ <= COMMAND_RANGE ** 2
  );
}

function sendCommandTooFarMessage(player: Player, golem: Entity): void {
  player.sendMessage({
    rawtext: [
      { text: "§5" },
      golem.nameTag
        ? { text: `§5${golem.nameTag}` }
        : { translate: "entity.minere:indigon_golem.name" },
      { text: "§r is too far away to receive commands." },
    ],
  });
}

function isToggleEnabled(
  golem: Entity,
  property: string,
  defaultValue: boolean,
): boolean {
  const value = golem.getDynamicProperty(property);
  return typeof value === "boolean" ? value : defaultValue;
}

function getAttackMode(golem: Entity): AttackMode {
  const mode = golem.getDynamicProperty(ATTACK_MODE_PROPERTY);
  return ATTACK_MODE_OPTIONS.includes(mode as AttackMode)
    ? (mode as AttackMode)
    : "hostile";
}

function setAttackMode(golem: Entity, mode: AttackMode): void {
  golem.setDynamicProperty(ATTACK_MODE_PROPERTY, mode);
  if (mode === "hostile") {
    golem.triggerEvent(ENABLE_ATTACK_HOSTILE_EVENT);
    return;
  }
  if (mode === "monsters") {
    golem.triggerEvent(ENABLE_ATTACK_MONSTERS_EVENT);
    return;
  }
  if (mode === "other_players") {
    golem.triggerEvent(ENABLE_ATTACK_OTHER_PLAYERS_EVENT);
    return;
  }
  if (mode === "only_owner_target") {
    golem.triggerEvent(ENABLE_ATTACK_ONLY_OWNER_TARGET_EVENT);
    return;
  }
  golem.triggerEvent(ENABLE_ATTACK_EVERYTHING_EVENT);
}

function syncAttackMode(golem: Entity): void {
  setAttackMode(golem, getAttackMode(golem));
}

function isPlasmaCannonActive(golem: Entity): boolean {
  return isToggleEnabled(golem, PLASMA_CANNON_ACTIVE_PROPERTY, false);
}

function isSonicBlasterActive(golem: Entity): boolean {
  return isToggleEnabled(golem, SONIC_BLASTER_ACTIVE_PROPERTY, false);
}

function hasEnderPlasma(golem: Entity): boolean {
  return hasInventoryItem(golem, "minere:ender_plasma");
}

function hasEchoShards(golem: Entity): boolean {
  return hasInventoryItem(golem, ECHO_SHARD_ITEM_TYPE_ID);
}

function hasInventoryItem(golem: Entity, itemTypeId: string): boolean {
  const inventory = golem.getComponent(EntityComponentTypes.Inventory) as
    | EntityInventoryComponent
    | undefined;
  const container = inventory?.container;
  if (!container) {
    return false;
  }

  for (let slot = 0; slot < container.size; slot++) {
    if (container.getItem(slot)?.typeId === itemTypeId) {
      return true;
    }
  }
  return false;
}

function consumeInventoryItem(golem: Entity, itemTypeId: string): boolean {
  const inventory = golem.getComponent(EntityComponentTypes.Inventory) as
    | EntityInventoryComponent
    | undefined;
  const container = inventory?.container;
  if (!container) {
    return false;
  }

  for (let slot = 0; slot < container.size; slot++) {
    const itemStack = container.getItem(slot);
    if (itemStack?.typeId !== itemTypeId) {
      continue;
    }

    if (itemStack.amount === 1) {
      container.setItem(slot);
    } else {
      itemStack.amount -= 1;
      container.setItem(slot, itemStack);
    }
    return true;
  }
  return false;
}

function trySelfRepair(golem: Entity): void {
  if (!isSelfRepairReady(golem)) {
    return;
  }
  const health = golem.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent | undefined;
  if (
    !health ||
    health.effectiveMax - health.currentValue < SELF_REPAIR_MIN_MISSING_HEALTH
  ) {
    return;
  }
  if (!consumeInventoryItem(golem, "minere:indigon_ingot")) {
    return;
  }

  health.setCurrentValue(
    Math.min(health.effectiveMax, health.currentValue + SELF_REPAIR_HEALTH),
  );
  golem.dimension.playSound(IRON_GOLEM_REPAIR_SOUND, golem.location);
  golem.setDynamicProperty(SELF_REPAIR_COOLDOWN_PROPERTY, system.currentTick);
}

function isSelfRepairReady(golem: Entity): boolean {
  const cooldownStartedAt = golem.getDynamicProperty(
    SELF_REPAIR_COOLDOWN_PROPERTY,
  );
  return (
    typeof cooldownStartedAt !== "number" ||
    system.currentTick - cooldownStartedAt >= SELF_REPAIR_COOLDOWN_TICKS
  );
}

function getLastSonicAmmoUseTick(golem: Entity): number | undefined {
  const tick = golem.getDynamicProperty(SONIC_AMMO_USE_TICK_PROPERTY);
  return typeof tick === "number" ? tick : undefined;
}

function syncWeaponAmmo(golem: Entity): void {
  if (isPlasmaCannonActive(golem) && !hasEnderPlasma(golem)) {
    setPlasmaCannonActive(golem, false);
    sendIndigonGolemMessageToOwner(
      golem,
      "message.minere.indigon_golem.out_of_ammunition",
    );
  }

  if (isSonicBlasterActive(golem) && !hasEchoShards(golem)) {
    setSonicBlasterActive(golem, false);
    sendIndigonGolemMessageToOwner(
      golem,
      "message.minere.indigon_golem.out_of_ammunition",
    );
  }
}

function sendPlasmaRequirementMessage(player: Player, golem: Entity): void {
  sendWeaponRequirementMessage(
    player,
    golem,
    "message.minere.indigon_golem.plasma_required",
    "§dEnder Plasma§7",
  );
}

function sendSonicRequirementMessage(player: Player, golem: Entity): void {
  sendWeaponRequirementMessage(
    player,
    golem,
    "message.minere.indigon_golem.sonic_required",
    "§bEcho Shards§7",
  );
}

function sendWeaponRequirementMessage(
  player: Player,
  golem: Entity,
  messageKey: string,
  itemName: string,
): void {
  player.sendMessage({
    rawtext: [
      { text: "§7[§5" },
      golem.nameTag
        ? { text: `§5${golem.nameTag}` }
        : { translate: "entity.minere:indigon_golem.name" },
      { text: "§7]: " },
      {
        translate: messageKey,
        with: [itemName],
      },
    ],
  });
}

export function setPlasmaCannonActive(golem: Entity, active: boolean): void {
  golem.setDynamicProperty(PLASMA_CANNON_ACTIVE_PROPERTY, active);
  if (active) {
    if (isSonicBlasterActive(golem)) {
      setSonicBlasterActive(golem, false);
    }
    golem.removeTag(PLASMA_CANNON_DISABLED_TAG);
    golem.triggerEvent(ACTIVATE_PLASMA_CANNON_EVENT);
    return;
  }
  golem.addTag(PLASMA_CANNON_DISABLED_TAG);
  golem.triggerEvent(DEACTIVATE_PLASMA_CANNON_EVENT);
}

function syncPlasmaCannon(golem: Entity): void {
  setPlasmaCannonActive(golem, isPlasmaCannonActive(golem));
}

function setSonicBlasterActive(golem: Entity, active: boolean): void {
  golem.setDynamicProperty(SONIC_BLASTER_ACTIVE_PROPERTY, active);
  if (active) {
    if (isPlasmaCannonActive(golem)) {
      setPlasmaCannonActive(golem, false);
    }
    golem.triggerEvent(ACTIVATE_SONIC_BLASTER_EVENT);
    return;
  }
  golem.triggerEvent(DEACTIVATE_SONIC_BLASTER_EVENT);
}

function syncSonicBlaster(golem: Entity): void {
  setSonicBlasterActive(golem, isSonicBlasterActive(golem));
}

function canOpenGolemCommands(player: Player, golem: Entity): boolean {
  if (!isPlayerAttackMode(getAttackMode(golem))) {
    return true;
  }

  return canSetTargets(player, golem);
}

function isGuestCommander(player: Player, golem: Entity): boolean {
  return isTamed(golem) && !canSetTargets(player, golem);
}

function isPlayerAttackMode(mode: AttackMode): boolean {
  return mode === "other_players" || mode === "everything";
}

function canSetTargets(player: Player, golem: Entity): boolean {
  return !isTamed(golem) || isTamedBy(golem, player);
}

function isFollowingOwner(golem: Entity): boolean {
  return isTamed(golem) && isFollowingOwnerEnabled(golem);
}

function sendDamageStatusMessage(golem: Entity): void {
  const healthRatio = getHealthRatio(golem);
  if (healthRatio <= 0.25) {
    if (
      !isDamageMessageReady(golem, CRITICAL_HEALTH_MESSAGE_COOLDOWN_PROPERTY)
    ) {
      return;
    }
    if (
      sendIndigonGolemMessageToOwner(
        golem,
        getRandomMessage(CRITICAL_HEALTH_MESSAGES),
      )
    ) {
      startDamageMessageCooldown(
        golem,
        CRITICAL_HEALTH_MESSAGE_COOLDOWN_PROPERTY,
      );
    }
    return;
  }

  if (healthRatio <= 0.5) {
    if (!isDamageMessageReady(golem, HALF_HEALTH_MESSAGE_COOLDOWN_PROPERTY)) {
      return;
    }
    if (
      sendIndigonGolemMessageToOwner(
        golem,
        getRandomMessage(HALF_HEALTH_MESSAGES),
      )
    ) {
      startDamageMessageCooldown(golem, HALF_HEALTH_MESSAGE_COOLDOWN_PROPERTY);
    }
    return;
  }
}

function sendRecoveryStatusMessage(data: EntityHealthChangedAfterEvent): void {
  if (data.newValue <= data.oldValue) {
    return;
  }

  const health = data.entity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  const previousHealthRatio = data.oldValue / health.effectiveMax;
  const newHealthRatio = data.newValue / health.effectiveMax;
  if (
    previousHealthRatio >= RECOVERY_HEALTH_THRESHOLD ||
    newHealthRatio < RECOVERY_HEALTH_THRESHOLD ||
    !isDamageMessageReady(data.entity, RECOVERY_MESSAGE_COOLDOWN_PROPERTY)
  ) {
    return;
  }

  if (
    sendIndigonGolemMessageToOwner(
      data.entity,
      getRandomMessage(RECOVERY_MESSAGES),
    )
  ) {
    startDamageMessageCooldown(data.entity, RECOVERY_MESSAGE_COOLDOWN_PROPERTY);
  }
}

function isDamageMessageReady(golem: Entity, property: string): boolean {
  const cooldownStartedAt = golem.getDynamicProperty(property);
  return (
    typeof cooldownStartedAt !== "number" ||
    system.currentTick - cooldownStartedAt >= DAMAGE_MESSAGE_COOLDOWN_TICKS
  );
}

function startDamageMessageCooldown(golem: Entity, property: string): void {
  golem.setDynamicProperty(property, system.currentTick);
}

function getRandomMessage(messages: readonly string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function relinquishCommand(golem: Entity): void {
  setPatrolEnabled(golem, true);
  setFollowingOwner(golem, false);
  golem.triggerEvent(RELINQUISH_COMMAND_EVENT);
  golem.triggerEvent(AT_EASE_EVENT);
  golem.triggerEvent(END_SUPERCHARGE_EVENT);
  setAttackMode(golem, "hostile");
}

function tryTeleportToOwner(golem: Entity): void {
  const owner = getTamedOwner(golem);
  if (
    !isFollowingOwner(golem) ||
    !owner ||
    golem.dimension.id !== owner.dimension.id
  ) {
    return;
  }

  const distance = distanceBetween(golem.location, owner.location);
  if (
    distance <= FOLLOW_TELEPORT_MIN_DISTANCE ||
    distance > FOLLOW_TELEPORT_MAX_DISTANCE ||
    !isFollowTeleportReady(golem)
  ) {
    return;
  }

  const destination = findFollowTeleportDestination(golem, owner);
  if (!destination) {
    return;
  }

  const origin = { ...golem.location };
  const particleOrigin = { ...origin, y: origin.y + 2 };
  const particleDestination = { ...destination, y: destination.y + 2 };
  particleWave({
    dimension: golem.dimension,
    particle: INDIGON_MAGIC_SHORT_PARTICLE,
    startLocation: particleOrigin,
    endLocation: particleDestination,
    stepDistance: 1,
    ticksPerStep: 0,
  });
  golem.dimension.playSound(END_TELEPORT_SOUND, origin, { volume: 2 });
  golem.teleport(destination, {
    facingLocation: owner.location,
    keepVelocity: false,
  });
  golem.clearVelocity();
  golem.dimension.playSound(END_TELEPORT_SOUND, destination, { volume: 2 });
  golem.setDynamicProperty(
    FOLLOW_TELEPORT_COOLDOWN_PROPERTY,
    system.currentTick,
  );
}

function isFollowTeleportReady(golem: Entity): boolean {
  const cooldownStartedAt = golem.getDynamicProperty(
    FOLLOW_TELEPORT_COOLDOWN_PROPERTY,
  );
  if (typeof cooldownStartedAt !== "number") {
    return true;
  }
  return (
    system.currentTick - cooldownStartedAt >= FOLLOW_TELEPORT_COOLDOWN_TICKS
  );
}

function findFollowTeleportDestination(
  golem: Entity,
  followee: Player,
): Vector3 | undefined {
  return findValidLocation({
    dimension: golem.dimension,
    origin: followee.location,
    attempts: FOLLOW_TELEPORT_ATTEMPTS,
    maxHorizontalDistance: FOLLOW_TELEPORT_DESTINATION_RADIUS,
    centerOnBlock: true,
    groundSearch: {
      minOffset: -FOLLOW_TELEPORT_GROUND_SCAN_DEPTH,
      maxOffset: FOLLOW_TELEPORT_GROUND_SCAN_HEIGHT,
    },
    clearance: {
      width: FOLLOW_TELEPORT_CLEARANCE_RADIUS * 2 + 1,
      height: FOLLOW_TELEPORT_CLEARANCE_HEIGHT,
      requireGround: true,
    },
  });
}

function distanceBetween(first: Vector3, second: Vector3): number {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

function superchargeTargets(golem: Entity, targets: Entity[]): void {
  castGolemAbility(
    golem,
    targets,
    "message.minere.indigon_golem.supercharging",
    applySupercharge,
  );
}

function levitatePlayer(golem: Entity, player: Player): void {
  castGolemAbility(
    golem,
    [player],
    "message.minere.indigon_golem.levitating",
    applyLevitation,
  );
}

function castRecoverySpell(golem: Entity, targets: Entity[]): void {
  castGolemAbility(
    golem,
    targets,
    "message.minere.indigon_golem.healing",
    applyRecoverySpell,
  );
}

function castGolemAbility(
  golem: Entity,
  targets: Entity[],
  playerMessageKey: string,
  applyEffects: (target: Entity, caster: Entity) => void,
): void {
  if (!castSpell(golem, targets, applyEffects)) {
    return;
  }
  for (const target of targets) {
    if (target instanceof Player) {
      sendIndigonGolemMessage(target, golem, playerMessageKey);
    }
  }
}

function castSpell(
  golem: Entity,
  targets: Entity[],
  applyEffects: (target: Entity, caster: Entity) => void,
): boolean {
  const target = targets[0];
  if (!target) {
    return false;
  }
  if (isWeaponCharging(golem)) {
    return false;
  }

  faceTarget(golem, target);
  golem.setDynamicProperty(SPELLCASTING_PROPERTY, true);
  setWeaponCharging(golem, false);
  golem.setDynamicProperty(SUPERCHARGE_COOLDOWN_PROPERTY, system.currentTick);
  golem.playAnimation("animation.minere.indigon_golem.summon");
  golem.triggerEvent(DEACTIVATE_PLASMA_CANNON_EVENT);
  golem.triggerEvent(SUPERCHARGE_EVENT);
  system.runTimeout(() => {
    if (golem.isValid) {
      golem.setDynamicProperty(SPELLCASTING_PROPERTY, false);
      golem.triggerEvent(END_SUPERCHARGE_EVENT);
      syncPlasmaCannon(golem);
      syncWeaponCharging(golem);
    }
    for (const target of targets) {
      if (!target.isValid) {
        continue;
      }
      applyEffects(target, golem);
    }
  }, SUMMON_ANIMATION_TICKS);
  return true;
}

function applySupercharge(target: Entity, golem: Entity): void {
  if (usesRecoveryEffects(target)) {
    applyRecoverySpell(target, golem);
    return;
  }

  // defensive
  target.addEffect("absorption", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  target.addEffect("speed", RECOVERY_SPELL_DURATION_TICKS, {
    showParticles: false,
  });
  target.addEffect("regeneration", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });

  // offensive
  target.addEffect("haste", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  target.addEffect("strength", SUPERCHARGE_DURATION_TICKS, {
    showParticles: true,
  });
  target.addEffect("jump_boost", SUPERCHARGE_DURATION_TICKS, {
    showParticles: false,
  });
  finishSpellEffects(target);
}

function applyRecoverySpell(target: Entity, _golem: Entity): void {
  target.addEffect("absorption", RECOVERY_SPELL_DURATION_TICKS, {
    amplifier: 1,
    showParticles: false,
  });
  target.addEffect("speed", RECOVERY_SPELL_DURATION_TICKS, {
    amplifier: 1,
    showParticles: false,
  });
  target.addEffect("regeneration", RECOVERY_SPELL_DURATION_TICKS, {
    amplifier: 1,
    showParticles: true,
  });
  target.addEffect("fire_resistance", RECOVERY_FIRE_RESISTANCE_DURATION_TICKS, {
    showParticles: false,
  });
  finishSpellEffects(target);
}

function applyLevitation(target: Entity, _golem: Entity): void {
  target.addEffect("levitation", 10 * 20, {
    showParticles: false,
    amplifier: 1,
  });
  target.addEffect("slow_falling", 20 * 20, {
    showParticles: false,
  });
  finishSpellEffects(target);
}

function finishSpellEffects(target: Entity): void {
  target.dimension.playSound(INDIGON_ARMOR_POWERUP_SOUND, target.location);
  startSuperchargeParticleRunner(target);
}

function startSuperchargeParticleRunner(target: Entity): void {
  let remainingTicks = SUPERCHARGE_PARTICLE_DURATION_TICKS;
  const runner = system.runInterval(() => {
    if (!target.isValid || remainingTicks <= 0) {
      system.clearRun(runner);
      return;
    }

    target.dimension.spawnParticle(
      INDIGON_MAGIC_SHORT_PARTICLE,
      target.getHeadLocation(),
    );
    remainingTicks--;
  }, 1);
}

function isSuperchargeReady(golem: Entity): boolean {
  const cooldownStartedAt = golem.getDynamicProperty(
    SUPERCHARGE_COOLDOWN_PROPERTY,
  );
  if (typeof cooldownStartedAt !== "number") {
    return true;
  }
  return system.currentTick - cooldownStartedAt >= SUPERCHARGE_COOLDOWN_TICKS;
}

function isWeaponCharging(golem: Entity): boolean {
  return golem.getProperty(WEAPON_CHARGING_PROPERTY) === true;
}

function syncWeaponCharging(golem: Entity): void {
  const isSpellcasting =
    golem.getDynamicProperty(SPELLCASTING_PROPERTY) === true;
  const isCharging =
    !isSpellcasting &&
    isPlasmaCannonActive(golem) &&
    golem.getComponent("minecraft:is_charged") !== undefined;

  setWeaponCharging(golem, isCharging);
}

function setWeaponCharging(golem: Entity, isCharging: boolean): void {
  if (golem.getProperty(WEAPON_CHARGING_PROPERTY) === isCharging) {
    return;
  }

  golem.setProperty(WEAPON_CHARGING_PROPERTY, isCharging);
}

function getSuperchargeRemainingSeconds(golem: Entity): number {
  const cooldownStartedAt = golem.getDynamicProperty(
    SUPERCHARGE_COOLDOWN_PROPERTY,
  );
  if (typeof cooldownStartedAt !== "number") {
    return 0;
  }
  const remainingTicks =
    SUPERCHARGE_COOLDOWN_TICKS - (system.currentTick - cooldownStartedAt);
  return Math.max(0, Math.ceil(remainingTicks / 20));
}

function getHealthStatusColor(health: EntityHealthComponent): string {
  if (health.currentValue < DAMAGE_3_HEALTH_THRESHOLD) {
    return "§4";
  }
  if (health.currentValue < DAMAGE_2_HEALTH_THRESHOLD) {
    return "§c";
  }
  if (health.currentValue < DAMAGE_1_HEALTH_THRESHOLD) {
    return "§6";
  }
  if (health.currentValue < DAMAGE_0_HEALTH_THRESHOLD) {
    return "§e";
  }
  return "§a";
}

function isHealingNeeded(entity: Entity): boolean {
  if (entity.getEffect("regeneration")) {
    return false;
  }

  const tameable = entity.getComponent(
    EntityComponentTypes.Tameable,
  ) as EntityTameableComponent;
  if (!SUPERCHARGE_TARGET_TYPE_IDS.has(entity.typeId) && !tameable?.isTamed) {
    return false;
  }
  return getHealthRatio(entity) < RECOVERY_HEALTH_THRESHOLD || isOnFire(entity);
}

function isOnFire(entity: Entity): boolean {
  return entity.getComponent(EntityComponentTypes.OnFire) !== undefined;
}

function hasNearbyMonster(entity: Entity): boolean {
  return (
    entity.dimension.getEntities({
      location: entity.location,
      maxDistance: SUPERCHARGE_THREAT_RADIUS,
      families: ["monster"],
    }).length > 0
  );
}

function usesRecoveryEffects(target: Entity): boolean {
  return (
    target.typeId === "minecraft:villager" ||
    target.typeId === "minecraft:villager_v2" ||
    target.typeId === "minecraft:copper_golem" ||
    target.typeId === "minere:copper_golem"
  );
}

function getHealthRatio(entity: Entity): number {
  const health = entity.getComponent(
    EntityComponentTypes.Health,
  ) as EntityHealthComponent;
  if (!health || health.effectiveMax <= 0) {
    return 1;
  }
  return health.currentValue / health.effectiveMax;
}

function hasLineOfSight(source: Entity, target: Entity): boolean {
  if (source.id === target.id) {
    return true;
  }

  const sourceLocation = source.getHeadLocation();
  const targetLocation = target.getHeadLocation();
  const direction = {
    x: targetLocation.x - sourceLocation.x,
    y: targetLocation.y - sourceLocation.y,
    z: targetLocation.z - sourceLocation.z,
  };
  const distance = Math.hypot(direction.x, direction.y, direction.z);
  if (distance <= 0) {
    return true;
  }

  const blockHit = source.dimension.getBlockFromRay(
    sourceLocation,
    {
      x: direction.x / distance,
      y: direction.y / distance,
      z: direction.z / distance,
    },
    {
      maxDistance: distance,
      includeLiquidBlocks: false,
      includePassableBlocks: false,
    },
  );
  return !blockHit;
}

function faceTarget(golem: Entity, target: Entity): void {
  if (golem.id === target.id) {
    return;
  }

  const xDifference = target.location.x - golem.location.x;
  const zDifference = target.location.z - golem.location.z;
  if (xDifference === 0 && zDifference === 0) {
    return;
  }

  golem.setRotation({
    x: 0,
    y: (Math.atan2(-xDifference, zDifference) * 180) / Math.PI,
  });
}
