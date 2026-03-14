---
name: cocoas-monsters-pack-sync
description: Rebuild or update the standalone Cocoa's_Monsters behavior and resource packs from the MineRe megapack. Use when Codex needs to reset Cocoa's_Monsters, copy the monster-focused subset from MineRe, carry over all required monster entities/items/scripts/blocks/recipes/spawn content, exclude animals and vanilla modifications, and apply the Cocoa's_Monsters-specific trade and recipe adjustments.
---

# Cocoa's Monsters Pack Sync

Use this skill to rebuild or update `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock\subpacks\Cocoa's_Monsters` from the MineRe megapack at `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock`.

## Workflow

1. Read [references/scope-and-rules.md](references/scope-and-rules.md) before copying or deleting anything.
2. Treat `MineRe_BP` and `MineRe_RP` as the source of truth.
3. Before extracting or updating, ask whether the standalone version should be incremented.
4. If the user wants the version incremented, ask whether to create a new major or minor version.
5. If the user wants a new versioned extraction, confirm the target version number and use bracketed version naming:
   - `Cocoa's_Monsters_BP [<version>]`
   - `Cocoa's_Monsters_RP [<version>]`
6. If the user does not want the version incremented, update the existing target pack the user names in place.
7. When updating `Cocoa's_Monsters`, preserve the existing `manifest.json` and `pack_icon.png` files in the standalone BP and RP if they are already present.
8. Delete or overwrite everything else in the standalone pack folders, then copy the desired content from MineRe into the now-clean pack folders.
9. Keep the standalone pack names, manifest identity, and BP->RP dependency intact unless the user explicitly asks for new manifests.
10. Keep the existing standalone pack icon if one is already present. Copy the MineRe pack icon only when the standalone pack does not already have one.
11. Read `MineRe_BP\item_catalog\crafting_item_catalog.json` and treat it as authoritative for which items are magic staves, magic tools, and magic swords.

## Cocoa's Monsters Should Include

- All monsters.
- All bosses.
- Any entity with family type `monster`.
- Any projectile entities used by those monsters.
- Any trap or support entities referenced by those monsters, such as `minere:ice_spike`.
- Keep Glacier's summoned `minere:ice_spike` entity support, but do not include cave icicle blocks or the `minere:icicle_break` block component unless the user explicitly asks for ice-cave content.
- Any loot table referenced in a monster's `behavior.json`.
- Any item present in a monster's loot table.
- Any item present in an included monster entity loot table even if the standalone loot file has drifted and needs to be refreshed from MineRe, such as Netherzord loot using `minere:nether_coal`.
- All bombs and their recipes.
- All magic swords.
- All magic tools.
- Treat the item catalog as authoritative for the magic sword/tool lists; examples include `minere:darkheart`, `minere:fire_axe`, `minere:ice_pick`, `minere:wind_shovel`, and `minere:shadow_scythe`.
- All magic staves, their recipes, and the items required in those recipes.
- `minere:phased_ender_pearl`.
- `minere:ice_charge`.
- `minere:ice_crown`.
- `minere:jump_boots`.
- `minere:royal_jelly`.
- `minere:elixir_of_experience`.
- The `minere:ghost_pot` block and its scripts.
- All scripts for entities and items added to `Cocoa's_Monsters`.
- All item custom component registrations required by the included items.
- The script setup required by the magic staves.
- All monster-related spawn rules, spawn scripts, and placeholder entities.
- Any blocks created or used by the included items and entities, such as `minere:freeze_ice` and `minere:amethyst_shield`, plus any scripts associated with them.
- Include the boss totems, wards, and their related scripts, ex: `minere:inferno_totem`.
- Include any spawn egg textures for the monsters.
- Include the item_categories for included items.
- Include `minere:venom_spear`.
- Include the Queen Bee content needed by `Cocoa's_Monsters`.
- Include the `giant_beehive` structure.
- Include `functions/small_bee_hive.mcfunction`.
- Include all features and feature rules stemming from `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`.

## Cocoa's Monsters Should Not Include

- Any structures.
- Any terrain features.
- Except for the Queen Bee exception: keep the `giant_beehive` structure, `functions/small_bee_hive.mcfunction`, and the feature/feature-rule chain stemming from `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`.
- Any animals or their related items, such as `minere:venison`, `minere:blubber`, or animal armor like Iron Elephant Armor.
- Any modifications to vanilla `minecraft:` content such as vanilla behavior JSONs or vanilla loot tables.
- Any `replacePlaceholderEntities` logic that targets or replaces vanilla `minecraft:` entities.
- Any game-modifying scripts such as Armor Weight, Armor Curve, End Storms, Player Hunger Heal, or similar broad systems.
- Weather scripts and helpers.
- Player systems such as `armorWeight`, `healFromItem`, and `playerHungerHeal`.
- The standalone `settings` system. Do not keep `src/settings.ts` or any startup/import dependency on it.
- The Settings book.
- Treecapitators or any of their scripts.
- Enderon, Indigon, or Aetherial tools and armor.
- Enderon and Indigon spears.
- Enderon-only item components such as `minere:ender_strike` when their matching standalone items are not included.
- The Altar block.
- Recipes for items that are not included.
- Do not include the `minere:helper...` items.


## Dependency Walk

- Start from monster and boss `behavior.json` files.
- Also include any entity whose family contains `monster`.
- From those files, follow every referenced dependency, including:
  - loot tables
  - equipment tables
  - trade tables
  - barter tables
  - projectile/support entity identifiers
  - spawn rules
  - spawn scripts
  - placeholder entities
  - blocks used or created by included entities and items
- From those referenced files, include all required downstream assets and content:
  - items dropped by monsters
  - items used by monsters
  - item scripts
  - custom item component registrations
  - recipes for included items
  - recipe ingredients required by included items
  - RP textures, texts, sounds, particles, models, render controllers, and animation content for the included entities, items, projectiles, and blocks
- Do not expand the dependency walk into excluded categories such as animal content, structures, terrain features, or vanilla behavior/loot modifications.
- The one allowed structure/feature exception is the Queen Bee content chain rooted at `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`.

## How Registries Work

- Treat the registries as wiring for included standalone content, not as a blind copy from MineRe.
- Keep a registry entry when an included BP file still references it.
- Remove a registry entry when the standalone pack no longer contains the content that references it.
- Audit not only the registry files, but also direct startup wiring in files such as `src/main.ts` and any other standalone source that subscribes directly to `world.beforeEvents` or `world.afterEvents`.
- For `itemRegistry`, item custom components connect directly to included item JSON files.
- Keep the item file itself when included monster loot tables, recipes, trades, or other included content reference that item, even if the item does not need a custom component.
- Keep an item component registration when an included item uses either:
  - `"minecraft:custom_components": ["minere:some_component"]`
  - or the newer component form `"minere:some_component": {}`
- Example: keep `minere:royal_jelly` registered because `royal_jelly.json` references it directly.
- Example: keep `elixir_of_experience` in the pack because included Inferno and Glacier loot tables reference it, but only keep its custom component registration if the included item behavior still needs that component.
- For `blockRegistry`, keep block component registrations only when included block JSON files still reference them.
- For `customEntityRegistry`, keep registrations only for included monster, boss, projectile, support, or required player-linked support entities.
- Every `customEntityRegistry` registration should map to an included BP entity definition or to a justified support case such as `CustomPlayer` for included crowns.
- For `eventRegistry`, keep registrations only when the event source file still exists and the standalone pack still needs that behavior.
- In `eventRegistry`, remove events that do not clearly support included monsters, included items, included boss mechanics, or the small set of allowed vanilla interactions kept by the standalone pack.
- Remove event registrations and event source files for excluded vanilla-modification behavior, such as `horseDieRemoveChest`, when the standalone pack no longer includes that vanilla hook.
- Remove event registrations, direct startup subscriptions, and event source files that only support excluded animals or breeding flows, such as `babySpawnMatchParent`.
- Remove direct item-use or item-release listeners for excluded or missing items, such as leftover startup hooks for excluded bows or tools.
- When removing a registry entry, also remove its dead import and linked source/setup code when that cleanup is safe.

## Required Modifications

- Add every magic sword and every magic tool from `MineRe_BP\item_catalog\crafting_item_catalog.json`, plus `minere:ghost_pot`, to the last tier of Goblin trades if they are not already present.
- Change the `blaster_staff` recipe so it uses Enderon Gemstones instead of Enderon Blocks.
- Remove any item from Goblin trades that is not vanilla `minecraft:` and does not exist in `Cocoa's_Monsters`, such as `minere:venison`.
- Remove any item from Goblin `minecraft:shareables` or similar barter/shareable item lists that is not vanilla `minecraft:` and does not exist in `Cocoa's_Monsters`, such as `minere:blubber` or excluded Indigon gear.
- After overwriting from MineRe, delete any recipe file whose output item is excluded or missing from the standalone BP, especially excluded `enderon_*`, `indigon_*`, and `*treecapitator*` outputs.
- Delete furnace recipes whose input block or item is excluded or missing from the standalone pack, such as `amethyst_ore`, `deepslate_amethyst_ore`, `sulfur_ore`, `deepslate_sulfur_ore`, `ender_plasma_ore`, or `end_crystalline`.
- After overwriting from MineRe, delete leftover block loot tables for excluded or missing standalone blocks, such as `amethyst_ore` or `ender_plasma_ore`.
- Refresh the standalone `scripts/` output from the final `src/` tree so excluded source paths do not survive as stale runtime JS.
- When a block family is excluded, remove its block/component registrations as well so unused excluded registrations do not survive in startup code.
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
- Delete the standalone settings system entirely when it is no longer needed, and remove any imports or calls that keep it alive.
- Remove residual `settings` imports or dynamic-property hooks from included source files after the standalone settings system is deleted, such as `Gremlin.ts`.
- Near the end, remove unused-but-harmless block and item component registrations when they are not needed by any remaining standalone content.

## Validation

After syncing:

1. Confirm both pack folders exist.
2. Confirm the existing standalone manifests were preserved unless the user explicitly asked for new ones.
3. Confirm the BP manifest still depends on the RP header UUID.
4. Confirm all included items have had their scripts carried over.
5. Confirm all included entities have had their scripts carried over and registered.
6. Confirm all required item custom components are registered.
7. Confirm the magic staff scripts and related registrations are set up.
8. Confirm all crafting recipes related to included items are present.
9. Confirm all items referenced in entity loot tables have been carried over, including stale loot-table dependencies that may need a fresh copy from MineRe such as Netherzord -> `minere:nether_coal`.
10. Confirm all bomb variants and their recipes are present.
11. Confirm all monster-related spawn rules, spawn scripts, and placeholder entities are present.
12. Confirm required blocks such as `minere:freeze_ice`, `minere:amethyst_shield`, and `minere:ghost_pot` are present with their scripts.
13. Confirm the Queen Bee content is present, including the `giant_beehive` structure, `functions/small_bee_hive.mcfunction`, and the feature/feature-rule chain stemming from `MineRe_BP\feature_rules\giant_beehive_feature_rule.json`.
14. Confirm Goblin trades contain the required added entries and no broken custom-item references.
15. Confirm Goblin `minecraft:shareables` and similar barter/shareable item lists contain no broken custom-item references.
16. Confirm the `blaster_staff` recipe uses Enderon Gemstones instead of Enderon Blocks.
17. Confirm no structures or terrain features are present outside the explicit Queen Bee exception.
18. Confirm no animal content or animal-related items are present outside the explicit Queen Bee exception.
19. Confirm no vanilla behavior or vanilla loot table modifications are present.
20. Remove any recipes for any `minere:` items that are not included in "Cocoa's Monsters".
21. Confirm furnace recipes for excluded or missing standalone inputs were removed.
22. Confirm leftover block loot tables for excluded or missing standalone blocks were removed.
23. Confirm the standalone `scripts/` output was refreshed from the final `src/` tree and does not retain excluded runtime code.
24. Confirm `blocks.json` only contains entries for blocks that actually exist in the standalone BP.
25. Confirm excluded block families do not leave behind block/component registrations in startup code.
26. Confirm no excluded or broken entries remain in active registries such as `blockRegistry`, `itemRegistry`, `customEntityRegistry`, or `eventRegistry`.
27. Confirm `customEntityRegistry` only registers included monster, boss, projectile, and support entities, with excluded animal entries removed and required player-linked support such as `CustomPlayer` preserved when needed by included items.
28. Confirm every `customEntityRegistry` registration maps to an included BP entity definition or to a justified support case such as `CustomPlayer`.
29. Confirm linked source files, imports, and setup code were cleaned up where registry entries were removed.
30. Confirm `itemRegistry` registrations were compared against actual included item JSON custom-component references, while item files required by loot, recipes, trades, or entity usage were preserved even if they did not need a custom component.
31. Confirm excluded mob source files, such as `Elephant.ts` or `Moose.ts`, do not remain under `src/entities/mobs` when they are no longer included or registered.
32. Confirm excluded weather scripts/helpers and player systems such as `armorWeight`, `healFromItem`, and `playerHungerHeal` are removed from the standalone BP.
33. Confirm excluded custom components such as `indigon_tool` and `indigon_apple` do not remain as source files or registrations.
34. Confirm excluded block-component source files and registrations, such as `teleporter.ts` or `icicleBreak.ts`, do not remain active in the standalone pack.
35. Confirm `src/mob/skeleton_strafe.ts` only allows the intended `minere:` entity types for the standalone pack.
36. Confirm `replacePlaceholderEntities` does not target or replace any vanilla `minecraft:` entities.
37. Confirm excluded vanilla-targeting event hooks, such as `horseDieRemoveChest`, do not remain registered or present as source files.
38. Confirm animal-only spawn helpers, such as `babySpawnMatchParent`, do not remain registered, directly subscribed in startup code, or present as source files when those animals are excluded.
39. Confirm `eventRegistry` does not keep stray events that are unrelated to included monsters, items, boss mechanics, or allowed vanilla interactions.
40. Confirm direct startup listeners in `src/main.ts` or similar files do not keep excluded item-use, item-release, spawn, or other unrelated behavior alive.
41. Confirm the standalone settings system was deleted when not needed, including `src/settings.ts` and any startup/import dependency on it.
42. Confirm residual `settings` imports or dynamic-property hooks do not remain in included source files such as `Gremlin.ts`.
43. Confirm the Settings book is not given, registered, or referenced by startup scripts.
44. Near the end, remove unused-but-harmless block and item component registrations when they are not used by any remaining standalone content.
45. Run `tsc` and Prettier after finishing, and report whether they passed.

## Notes

- Prefer resetting the standalone pack and rebuilding it cleanly over incremental patching when the subset rules have changed.
- Keep the standalone pack minimal, but never at the cost of leaving broken references behind.
- When deciding whether an item belongs, prioritize monster behavior files, monster loot tables, monster trade data, monster projectile usage, and monster script references.
