# Scope And Rules

Use this reference as the working contract for the `Cocoa's_Monsters` subset.

## Source Root

- `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock`

## Destination Root

- `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock\subpacks\Cocoa's_Monsters`

## Versioned Pack Naming

When creating a new extracted release, use versioned standalone folder names:

- `Cocoa's_Monsters_BP [<version>]`
- `Cocoa's_Monsters_RP [<version>]`

Examples:

- `Cocoa's_Monsters_BP [1.0.0]`
- `Cocoa's_Monsters_RP [1.0.0]`

When updating an existing extracted release, copy into the exact versioned folder the user names.
Before extracting or updating, ask whether the standalone version should be incremented.
If the user wants the version incremented, ask whether to create a new major or minor version.

## Reset Rule

When updating `Cocoa's_Monsters`:

1. Preserve the existing `manifest.json` and `pack_icon.png` files in the standalone BP and RP if they are already present.
2. Delete or overwrite everything else in the standalone pack folders.
3. Copy the desired content from MineRe into the clean standalone pack folders.
4. Re-apply the standalone-specific modifications and validations.

## Include

- All monsters
- All bosses
- Any entity with family type `monster`
- Any projectile entities used by those monsters
- Any trap or support entities referenced by those monsters
- Glacier uses the summoned `minere:ice_spike` entity; do not pull in cave icicle blocks or the `minere:icicle_break` block component unless the user explicitly expands the scope to ice-cave content
- Any loot table referenced in a monster's `behavior.json`
- Any item present in a monster's loot table
- Any item present in an included monster entity loot table even if the standalone loot table needs to be refreshed from MineRe
- All bombs and their recipes
- All magic swords
- All magic tools
- Use the item catalog as the source of truth for these sets; examples include `minere:darkheart`, `minere:fire_axe`, `minere:ice_pick`, `minere:wind_shovel`, and `minere:shadow_scythe`
- Specifically read `MineRe_BP\item_catalog\crafting_item_catalog.json` and use its `magic_sword` and `magic_tools` groups as the authoritative Goblin-trade source
- All magic staves, their recipes, and the items required in those recipes
- `minere:phased_ender_pearl`
- `minere:ice_charge`
- `minere:ice_crown`
- `minere:jump_boots`
- `minere:royal_jelly`
- `minere:elixir_of_experience`
- `minere:venom_spear`
- `minere:ghost_pot` and its scripts
- Queen Bee content needed by the standalone pack
- The `giant_beehive` structure
- `functions/small_bee_hive.mcfunction`
- All features and feature rules stemming from `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`
- All scripts for included entities and items
- All required item custom component registrations
- Magic staff script setup and supporting files
- Monster-related spawn rules, spawn scripts, and placeholder entities
- Blocks created or used by included entities and items
- Associated RP assets and registrations for the included content

Known examples called out by the user:

- `minere:freeze_ice`
- `minere:amethyst_shield`
- Ice Bomb
- Wind Bomb
- Fire Bomb
- Poison Bomb
- Ice Spike

## Exclude

- Any structures
- Any terrain features
- Except for the Queen Bee exception rooted at `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`
- Any animals
- Any animal-related items
- Animal armor
- Enderon and Indigon spears
- Enderon-only item components such as `minere:ender_strike` when their matching standalone items are not included
- Any modifications to vanilla `minecraft:` behavior JSONs
- Any modifications to vanilla `minecraft:` loot tables
- Any `replacePlaceholderEntities` logic that targets or replaces vanilla `minecraft:` entities
- Broad game-modifying scripts
- Weather scripts and helpers
- Player systems such as `armorWeight`, `healFromItem`, and `playerHungerHeal`
- The standalone `settings` system
- The Settings book

Known examples to exclude:

- `minere:venison`
- `minere:blubber`
- Elephant armor
- Bear armor
- Armor Weight
- Armor Curve
- End Storms
- Player Hunger Heal
- Settings book

## Discovery Order

Use this order when deciding what to copy:

1. Start with monster and boss `behavior.json` files.
2. Include any entity whose family contains `monster`.
3. Follow referenced loot tables, equipment tables, trade tables, barter tables, projectile/support entities, spawn rules, spawn scripts, and placeholder entities.
4. Gather every custom item referenced by those files.
5. Copy the required item files, item scripts, recipes, item component registrations, and RP support for those items.
6. Copy blocks used or created by the included entities and items, along with their scripts and RP support.
7. Stop the walk when it enters excluded categories such as animals, structures, terrain features, or vanilla behavior/loot modifications.
8. The one allowed structure/feature exception is the Queen Bee content chain rooted at `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`.

## Registry Rules

- Treat the registries as wiring for included standalone content, not as a blind copy from MineRe.
- Keep a registry entry when an included BP file still references it.
- Remove a registry entry when the standalone pack no longer contains the content that references it.
- Audit not only the registry files, but also direct startup wiring in files such as `src/main.ts` and any other standalone source that subscribes directly to `world.beforeEvents` or `world.afterEvents`.
- In `itemRegistry`, item custom components connect directly to included item JSON files.
- Keep the item file itself when included monster loot tables, recipes, trades, or other included content reference that item, even if the item does not need a custom component.
- Keep an item component registration when an included item uses either:
  - `"minecraft:custom_components": ["minere:some_component"]`
  - or the newer form `"minere:some_component": {}`
- Example: keep `minere:royal_jelly` registered because `royal_jelly.json` references it directly.
- Example: keep `elixir_of_experience` in the pack because included Inferno and Glacier loot tables reference it, but only keep its custom component registration if the included item behavior still needs that component.
- In `blockRegistry`, keep block component registrations only when included block JSON files still reference them.
- In `customEntityRegistry`, keep registrations only for included monster, boss, projectile, support, or required player-linked support entities.
- Every `customEntityRegistry` registration should map to an included BP entity definition or to a justified support case such as `CustomPlayer` for included crowns.
- In `eventRegistry`, keep registrations only when the event source file still exists and the standalone pack still needs that behavior.
- In `eventRegistry`, remove events that do not clearly support included monsters, included items, included boss mechanics, or the small set of allowed vanilla interactions kept by the standalone pack.
- Remove event registrations and event source files for excluded vanilla-modification behavior, such as `horseDieRemoveChest`, when the standalone pack no longer includes that vanilla hook.
- Remove event registrations, direct startup subscriptions, and event source files that only support excluded animals or breeding flows, such as `babySpawnMatchParent`.
- Remove direct item-use or item-release listeners for excluded or missing items, such as leftover startup hooks for excluded bows or tools.
- When removing a registry entry, also remove its dead import and linked source/setup code when that cleanup is safe.

## Required Modifications

- Add every magic sword from `MineRe_BP\item_catalog\crafting_item_catalog.json` to the last tier of Goblin trades if not already present.
- Add every magic tool from `MineRe_BP\item_catalog\crafting_item_catalog.json` to the last tier of Goblin trades if not already present.
- Add `minere:ghost_pot` to the last tier of Goblin trades if not already present.
- Change the `blaster_staff` recipe so it uses Enderon Gemstones instead of Enderon Blocks.
- Remove any Goblin trade item that is not vanilla `minecraft:` and is not present in `Cocoa's_Monsters`.
- Remove any Goblin `minecraft:shareables` or similar barter/shareable item entry that is not vanilla `minecraft:` and is not present in `Cocoa's_Monsters`.
- After overwriting from MineRe, delete any recipe file whose output item is excluded or missing from the standalone BP, especially excluded `enderon_*`, `indigon_*`, and `*treecapitator*` outputs.
- Delete furnace recipes whose input block or item is excluded or missing from the standalone pack, such as `amethyst_ore`, `deepslate_amethyst_ore`, `sulfur_ore`, `deepslate_sulfur_ore`, `ender_plasma_ore`, or `end_crystalline`.
- After overwriting from MineRe, delete leftover block loot tables for excluded or missing standalone blocks, such as `amethyst_ore` or `ender_plasma_ore`.
- Refresh the standalone `scripts/` output from the final `src/` tree so excluded source paths do not survive as stale runtime JS.
- When a block family is excluded, remove its block/component registrations as well.
- Ensure no excluded or broken entries remain in active registries such as `blockRegistry`, `itemRegistry`, `customEntityRegistry`, or `eventRegistry`.
- In `customEntityRegistry`, register only included monster, boss, projectile, and support entities. Remove excluded animal registrations such as Moose or Elephant, but keep player-linked support registrations like `CustomPlayer` when they are required by included items such as `minere:inferno_crown` or `minere:ice_crown`.
- When cleaning registry entries, also clean up the linked source files, imports, and setup code when that can be done safely.
- Audit `src/main.ts` and any other direct event subscription sites for leftover listeners that are not related to included monsters, items, boss mechanics, or allowed vanilla interactions.
- Remove direct item-use or item-release listeners for excluded or missing items.
- Delete excluded mob source files from `src/entities/mobs` when they are no longer included, registered, or referenced, such as `Elephant.ts` or `Moose.ts`.
- Remove lingering custom component source files and registrations for excluded content, such as `indigon_tool` or `indigon_apple`.
- Remove excluded block-component source files and registrations that no longer belong in the standalone pack, such as `teleporter.ts` or `icicleBreak.ts`.
- Update `src/mob/skeleton_strafe.ts` so `validTypes` only includes allowed `minere:` entities for the standalone pack.
- Ensure `replacePlaceholderEntities` only targets standalone `minere:` placeholder/entity flows and never replaces vanilla `minecraft:` entities such as drowned.
- Remove excluded vanilla-targeting event hooks such as horse-specific handlers when the standalone pack should not modify that `minecraft:` entity.
- Remove event handlers that do not appear to be related to included monsters, included items, included boss mechanics, or the small set of allowed vanilla interactions.
- Remove animal-only spawn helpers such as `babySpawnMatchParent` when the related animal entities are not part of the standalone pack.
- Delete the standalone settings system entirely when it is no longer needed, and remove any imports or startup dependencies that keep it alive.
- Remove residual `settings` imports or dynamic-property hooks from included source files after the standalone settings system is deleted, such as `Gremlin.ts`.
- Near the end, remove unused-but-harmless block and item component registrations that are no longer used by remaining standalone content.

## Validation Checklist

- BP and RP manifests exist and link correctly
- Existing standalone manifests were preserved unless the user explicitly asked for new ones
- Included entity scripts are present and registered
- Included item scripts are present and registered
- Required custom item components are registered
- Magic staff setup is complete
- Required recipes are present
- Loot-table-referenced items are present
- Stale standalone loot tables were checked against MineRe when an expected monster-drop item was missing, such as Netherzord -> `minere:nether_coal`
- Bomb variants and bomb recipes are present
- Monster spawn rules, spawn scripts, and placeholder entities are present
- Required blocks and block scripts are present
- Goblin trades include the required additions
- Goblin trades do not reference missing custom items
- Goblin `minecraft:shareables` and similar barter/shareable item lists do not reference missing custom items
- `blaster_staff` recipe uses Enderon Gemstones
- No structures are present
- No terrain features are present
- The Queen Bee exception is present, including the `giant_beehive` structure, `functions/small_bee_hive.mcfunction`, and the feature/feature-rule chain rooted at `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`
- No animal content is present
- No vanilla behavior or vanilla loot table modifications are present
- Existing standalone pack icon was preserved when present
- Furnace recipes for excluded or missing standalone inputs were removed
- Leftover block loot tables for excluded or missing standalone blocks were removed
- Standalone `scripts/` output was refreshed from the final `src/` tree
- RP `blocks.json` only contains entries for blocks that actually exist in the standalone BP
- Excluded block families do not leave behind block/component registrations
- No excluded or broken entries remain in active registries such as `blockRegistry`, `itemRegistry`, `customEntityRegistry`, or `eventRegistry`
- `customEntityRegistry` only registers included monster, boss, projectile, and support entities, with excluded animal entries removed and required player-linked support such as `CustomPlayer` preserved when needed by included items
- Every `customEntityRegistry` registration maps to an included BP entity definition or to a justified support case such as `CustomPlayer`
- Linked source files, imports, and setup code were cleaned up where registry entries were removed
- `itemRegistry` registrations were compared against actual included item JSON custom-component references, while item files required by loot, recipes, trades, or entity usage were preserved even if they did not need a custom component
- Excluded mob source files, such as `Elephant.ts` or `Moose.ts`, do not remain under `src/entities/mobs` when they are no longer included or registered
- Excluded weather scripts/helpers and player systems such as `armorWeight`, `healFromItem`, and `playerHungerHeal` are removed
- Excluded custom components such as `indigon_tool` and `indigon_apple` do not remain as source files or registrations
- Excluded block-component source files and registrations, such as `teleporter.ts` or `icicleBreak.ts`, do not remain active
- `src/mob/skeleton_strafe.ts` only allows the intended `minere:` entity types for the standalone pack
- `replacePlaceholderEntities` does not target or replace any vanilla `minecraft:` entities
- Excluded vanilla-targeting event hooks, such as `horseDieRemoveChest`, do not remain registered or present as source files
- Animal-only spawn helpers, such as `babySpawnMatchParent`, do not remain registered, directly subscribed in startup code, or present as source files when those animals are excluded
- `eventRegistry` does not keep stray events unrelated to included monsters, items, boss mechanics, or allowed vanilla interactions
- Direct startup listeners in `src/main.ts` or similar files do not keep excluded item-use, item-release, spawn, or other unrelated behavior alive
- The standalone settings system was deleted when not needed, including `src/settings.ts` and any startup/import dependency on it
- Residual `settings` imports or dynamic-property hooks do not remain in included source files such as `Gremlin.ts`
- Settings book giveaway and registration paths are removed from the standalone BP
- Unused-but-harmless block and item component registrations were removed near the end
- `tsc` and Prettier were run after finishing
