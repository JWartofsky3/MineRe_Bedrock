---
name: cocoas-birds-pack-sync
description: Extract, rebuild, or update the standalone Cocoa's_Birds behavior and resource packs from the MineRe megapack. Use when Codex needs to sync Bird, Eagle, and Owl content from MineRe into Cocoa's_Birds, refresh manifests and pack links, copy required support assets such as sounds and texts, or keep the subset pack aligned with MineRe without bringing over unrelated content.
---

# Cocoa's Birds Pack Sync

Use this skill to keep `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock\subpacks\Cocoa's_Birds` in sync with the Bird, Eagle, and Owl subset from the MineRe megapack at `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock`.

## Workflow

1. Read [references/file-map.md](references/file-map.md) before copying or deleting anything.
2. Treat `MineRe_BP` and `MineRe_RP` as the source of truth.
3. Before extracting into a new standalone pack, ask whether to create a new major or minor version.
4. If the user wants a new versioned extraction, confirm the target version number and use bracketed version naming:
   - `Cocoa's_Birds_BP [<version>]`
   - `Cocoa's_Birds_RP [<version>]`
5. If the user wants an in-place sync instead, update the existing target pack the user names.
6. Sync only the files listed in the file map unless the user explicitly expands the scope.
7. Generate fresh manifest UUIDs only when creating a new standalone pack or when the user asks to rotate them.
8. Ensure the BP manifest depends on the RP header UUID.
9. Keep the copied entity identifiers as `minere:bird`, `minere:eagle`, and `minere:owl` unless the user explicitly asks to rename namespaces.
10. Copy the pack icon from MineRe unless the user provides a dedicated icon.

## Sync Rules

- Copy the listed BP and RP files from MineRe into their matching standalone locations.
- Include support files referenced by the subset, especially sounds, sound definitions, textures, render controllers, animations, animation controllers, texts, and loot/spawn files.
- Keep the standalone RP minimal. Do not bring over unrelated MineRe entities, sounds, or language entries.
- When `sounds.json` or `sound_definitions.json` are updated, keep only the entries needed by Bird, Eagle, and Owl plus any directly referenced support sounds.
- When localizing, `texts/en_US.lang` is the minimum required language file. Add more language files only if the user asks.

## Validation

After syncing:

1. Confirm both pack folders exist.
2. Confirm both manifests exist and have different UUIDs from MineRe.
3. Confirm the BP dependency UUID matches the RP header UUID.
4. Confirm the standalone RP contains the required files from the file map.
5. Call out any likely missing support assets instead of assuming the pack is complete.

## Notes

- Prefer small, auditable file copies over broad directory clones.
- When in doubt, inspect the entity JSON, client entity JSON, render controllers, and sound registrations to discover dependencies before copying more files.
- For this skill, do not generalize to `Cocoa's_Monsters` unless the user asks for a separate skill or an expanded one.
- When the user says "extract" and does not specify the version bump, pause and ask whether they want a major or minor version.
