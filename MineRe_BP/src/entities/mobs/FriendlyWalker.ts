import {
  Entity,
  Player,
  PlayerInteractWithEntityAfterEvent,
} from "@minecraft/server";
import {
  ActionFormData,
  MessageFormData,
  ModalFormData,
} from "@minecraft/server-ui";
import {
  isTamed,
  isTamedBy,
  takeCommand,
} from "entities/helpers/commandableCompanion";
import { createCompanionMessenger } from "entities/helpers/companionMessages";
import { Walker } from "entities/mobs/Walker";

const COMMAND_RANGE = 32;
const AUTO_TAME_RANGE = 16;
const TAKE_COMMAND_EVENT = "minere:take_command";
const RELINQUISH_COMMAND_EVENT = "minere:relinquish_command";
const FOLLOW_OWNER_EVENT = "minere:follow_owner";
const STAY_HERE_EVENT = "minere:stay_here";
const PATROL_EVENT = "minere:patrol";
const PATROL_ENABLED_PROPERTY = "minere:friendly_walker_patrol_enabled";
const FOLLOW_OWNER_ENABLED_PROPERTY = "minere:friendly_walker_follow_owner_enabled";
const ATTACK_MODE_PROPERTY = "minere:friendly_walker_attack_mode";
const { send: sendFriendlyWalkerMessage } = createCompanionMessenger({
  commandRange: COMMAND_RANGE,
  nameColor: "§d",
  nameTranslationKey: "entity.minere:friendly_walker.name",
});

type AttackMode = "only_owner_target" | "hostile" | "monsters";

const ATTACK_MODE_OPTIONS: AttackMode[] = [
  "only_owner_target",
  "hostile",
  "monsters",
];
const COMMAND_GREETINGS = [
  "ui.minere.friendly_walker.command_greeting.guardians",
  "ui.minere.friendly_walker.command_greeting.endures",
  "ui.minere.friendly_walker.command_greeting.watch",
];

export class FriendlyWalker extends Walker {
  constructor() {
    super("minere:friendly_walker");
  }

  onEntitySpawn = (data: { entity: Entity }): void => {
    const players = data.entity.dimension.getPlayers({
      location: data.entity.location,
      maxDistance: AUTO_TAME_RANGE,
    });
    if (players.length === 1) {
      takeCommand(data.entity, players[0], TAKE_COMMAND_EVENT);
    }
    syncCommandState(data.entity);
    syncAttackMode(data.entity);
  };

  onEntityLoad = (data: { entity: Entity }): void => {
    syncCommandState(data.entity);
    syncAttackMode(data.entity);
  };

  onPlayerInteractWithEntity = (
    data: PlayerInteractWithEntityAfterEvent,
  ): void => {
    if (
      data.player.isSneaking ||
      data.beforeItemStack?.typeId === "minecraft:end_stone" ||
      data.beforeItemStack?.typeId === "minecraft:end_bricks"
    ) {
      return;
    }
    showCommands(data.player, data.target);
  };
}

function showCommands(player: Player, walker: Entity): void {
  if (!walker.isValid) {
    return;
  }

  const isFollowing = isFollowingOwner(walker);
  const isPatrolling = isPatrolEnabled(walker);
  const isOwner = isTamedBy(walker, player);
  const owned = isTamed(walker);
  const commandGreeting =
    COMMAND_GREETINGS[Math.floor(Math.random() * COMMAND_GREETINGS.length)];
  const form = new ActionFormData()
    .title(
      walker.nameTag || { translate: "entity.minere:friendly_walker.name" },
    )
    .body({ translate: commandGreeting });

  form.button({
    translate: isFollowing
      ? "ui.minere.friendly_walker.button.stop_following"
      : "ui.minere.friendly_walker.button.follow",
  }, isFollowing ? "textures/blocks/barrier" : "textures/items/string");
  form.button({
    translate: isPatrolling
      ? "ui.minere.friendly_walker.button.hold_position"
      : "ui.minere.friendly_walker.button.patrol",
  }, isPatrolling ? "textures/items/iron_ingot" : "textures/items/feather");
  if (isOwner) {
    form.button(
      { translate: "ui.minere.friendly_walker.button.settings" },
      "textures/items/repeater",
    );
  }
  form.button({
    translate: owned
      ? "ui.minere.friendly_walker.button.relinquish_command"
      : "ui.minere.friendly_walker.button.take_command",
  }, "textures/items/name_tag");

  form
    .show(player)
    .then((response) => {
      if (
        response.canceled ||
        response.selection === undefined ||
        !walker.isValid
      ) {
        return;
      }
      if (!isWithinCommandRange(player, walker)) {
        sendFriendlyWalkerMessage(
          player,
          walker,
          "message.minere.friendly_walker.too_far",
        );
        return;
      }

      if (response.selection === 0) {
        if (isFollowing) {
          setPatrolEnabled(walker, true);
          setFollowingOwner(walker, false);
          walker.triggerEvent(PATROL_EVENT);
          sendFriendlyWalkerMessage(
            player,
            walker,
            "message.minere.friendly_walker.stop_following",
          );
          return;
        }
        if (!takeCommand(walker, player, TAKE_COMMAND_EVENT)) {
          return;
        }
        setPatrolEnabled(walker, false);
        setFollowingOwner(walker, true);
        walker.triggerEvent(FOLLOW_OWNER_EVENT);
        sendFriendlyWalkerMessage(
          player,
          walker,
          "message.minere.friendly_walker.following",
        );
        return;
      }

      if (response.selection === 1) {
        if (isPatrolling) {
          setPatrolEnabled(walker, false);
          setFollowingOwner(walker, false);
          walker.triggerEvent(STAY_HERE_EVENT);
          sendFriendlyWalkerMessage(
            player,
            walker,
            "message.minere.friendly_walker.holding_position",
          );
          return;
        }
        setPatrolEnabled(walker, true);
        setFollowingOwner(walker, false);
        walker.triggerEvent(PATROL_EVENT);
        sendFriendlyWalkerMessage(
          player,
          walker,
          "message.minere.friendly_walker.patrolling",
        );
        return;
      }

      if (isOwner && response.selection === 2) {
        showSettings(player, walker);
        return;
      }

      if (!owned) {
        if (takeCommand(walker, player, TAKE_COMMAND_EVENT)) {
          sendFriendlyWalkerMessage(
            player,
            walker,
            "message.minere.friendly_walker.command_taken",
          );
        }
        return;
      }
      showRelinquishConfirmation(player, walker);
    })
    .catch((error) =>
      console.error("Failed to show Friendly Walker commands: " + error),
    );
}

function showSettings(player: Player, walker: Entity): void {
  if (!isTamedBy(walker, player)) {
    return;
  }

  new ModalFormData()
    .title(
      walker.nameTag || { translate: "entity.minere:friendly_walker.name" },
    )
    .dropdown(
      { translate: "ui.minere.friendly_walker.settings.attacks" },
      ATTACK_MODE_OPTIONS.map((mode) => ({
        translate: `ui.minere.friendly_walker.attack_mode.${mode}`,
      })),
      { defaultValueIndex: ATTACK_MODE_OPTIONS.indexOf(getAttackMode(walker)) },
    )
    .submitButton({ translate: "ui.minere.friendly_walker.button.save" })
    .show(player)
    .then((response) => {
      if (
        response.canceled ||
        response.formValues?.length !== 1 ||
        !walker.isValid
      ) {
        return;
      }
      if (!isWithinCommandRange(player, walker) || !isTamedBy(walker, player)) {
        return;
      }
      const mode = ATTACK_MODE_OPTIONS[response.formValues[0] as number];
      if (!mode) {
        return;
      }
      setAttackMode(walker, mode);
      sendFriendlyWalkerMessage(
        player,
        walker,
        "message.minere.friendly_walker.commands_accepted",
      );
    })
    .catch((error) =>
      console.error("Failed to show Friendly Walker settings: " + error),
    );
}

function showRelinquishConfirmation(player: Player, walker: Entity): void {
  new MessageFormData()
    .title({ translate: "ui.minere.friendly_walker.relinquish_confirm.title" })
    .body({ translate: "ui.minere.friendly_walker.relinquish_confirm.body" })
    .button1({ translate: "ui.minere.friendly_walker.relinquish_confirm.yes" })
    .button2({ translate: "ui.minere.friendly_walker.relinquish_confirm.no" })
    .show(player)
    .then((response) => {
      if (response.canceled || response.selection !== 0 || !walker.isValid) {
        return;
      }
      if (!isWithinCommandRange(player, walker) || !isTamedBy(walker, player)) {
        return;
      }
      setPatrolEnabled(walker, true);
      setFollowingOwner(walker, false);
      walker.triggerEvent(RELINQUISH_COMMAND_EVENT);
      walker.triggerEvent(PATROL_EVENT);
      setAttackMode(walker, "hostile");
      sendFriendlyWalkerMessage(
        player,
        walker,
        "message.minere.friendly_walker.command_relinquished",
      );
    })
    .catch((error) =>
      console.error("Failed to show Friendly Walker confirmation: " + error),
    );
}

function isWithinCommandRange(player: Player, walker: Entity): boolean {
  if (player.dimension !== walker.dimension) {
    return false;
  }
  const x = player.location.x - walker.location.x;
  const y = player.location.y - walker.location.y;
  const z = player.location.z - walker.location.z;
  return x * x + y * y + z * z <= COMMAND_RANGE ** 2;
}

function isToggleEnabled(
  entity: Entity,
  property: string,
  defaultValue: boolean,
): boolean {
  const value = entity.getDynamicProperty(property);
  return typeof value === "boolean" ? value : defaultValue;
}

function isPatrolEnabled(walker: Entity): boolean {
  return isToggleEnabled(walker, PATROL_ENABLED_PROPERTY, true);
}

function setPatrolEnabled(walker: Entity, enabled: boolean): void {
  walker.setDynamicProperty(PATROL_ENABLED_PROPERTY, enabled);
}

function isFollowingOwner(walker: Entity): boolean {
  return (
    isTamed(walker) &&
    isToggleEnabled(walker, FOLLOW_OWNER_ENABLED_PROPERTY, false)
  );
}

function setFollowingOwner(walker: Entity, enabled: boolean): void {
  walker.setDynamicProperty(FOLLOW_OWNER_ENABLED_PROPERTY, enabled);
}

function getAttackMode(walker: Entity): AttackMode {
  const mode = walker.getDynamicProperty(ATTACK_MODE_PROPERTY);
  return ATTACK_MODE_OPTIONS.includes(mode as AttackMode)
    ? (mode as AttackMode)
    : "hostile";
}

function setAttackMode(walker: Entity, mode: AttackMode): void {
  walker.setDynamicProperty(ATTACK_MODE_PROPERTY, mode);
  if (mode === "only_owner_target") {
    walker.triggerEvent("minere:enable_attack_only_owner_target");
    return;
  }
  walker.triggerEvent(
    mode === "hostile"
      ? "minere:enable_attack_hostile"
      : "minere:enable_attack_monsters",
  );
}

function syncCommandState(walker: Entity): void {
  if (isFollowingOwner(walker)) {
    walker.triggerEvent(FOLLOW_OWNER_EVENT);
    return;
  }
  walker.triggerEvent(isPatrolEnabled(walker) ? PATROL_EVENT : STAY_HERE_EVENT);
}

function syncAttackMode(walker: Entity): void {
  setAttackMode(walker, getAttackMode(walker));
}
