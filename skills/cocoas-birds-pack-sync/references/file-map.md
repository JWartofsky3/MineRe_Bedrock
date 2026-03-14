# File Map

Use this reference as the allowlist for the current `Cocoa's_Birds` subset.

## Source Root

- `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock`

## Destination Root

- `C:\Users\Jacob\Desktop\Mine Re\MineRe_Bedrock\subpacks\Cocoa's_Birds`

## Versioned Pack Naming

When creating a new extracted release, use versioned standalone folder names:

- `Cocoa's_Birds_BP [<version>]`
- `Cocoa's_Birds_RP [<version>]`

Examples:

- `Cocoa's_Birds_BP [1.0.0]`
- `Cocoa's_Birds_RP [1.0.0]`

When updating an existing extracted release, copy into the exact versioned folder the user names.

## Behavior Pack

Source: `MineRe_BP`
Destination: `subpacks\Cocoa's_Birds\Cocoa's_Birds_BP [<version>]`

Copy these files:

- `entities/bird.behavior.json`
- `entities/eagle.behavior.json`
- `entities/owl.behavior.json`
- `loot_tables/entities/bird.json`
- `loot_tables/entities/eagle.json`
- `loot_tables/entities/owl.json`
- `spawn_rules/bird.json`
- `spawn_rules/eagle.json`
- `spawn_rules/owl.json`
- `pack_icon.png`

Create or maintain:

- `manifest.json`

## Resource Pack

Source: `MineRe_RP`
Destination: `subpacks\Cocoa's_Birds\Cocoa's_Birds_RP [<version>]`

Copy these files:

- `entity/bird.json`
- `entity/eagle.entity.json`
- `entity/owl.entity.json`
- `render_controllers/bird.render_controller.json`
- `render_controllers/eagle.render_controller.json`
- `render_controllers/owl.render_controller.json`
- `animations/bird.animation.json`
- `animations/eagle.animation.json`
- `animations/owl.animation.json`
- `animation_controllers/bird.controller.json`
- `animation_controllers/owl.controller.json`
- `models/entity/minere/bird.json`
- `models/entity/minere/eagle.geo.json`
- `models/entity/minere/owl.geo.json`
- `textures/entity/minere/birds/*`
- `textures/entity/minere/eagle/*`
- `textures/entity/minere/owl/*`
- `sounds/mob/bird/blue_jay/*`
- `sounds/mob/bird/cardinal/*`
- `sounds/mob/bird/crow/*`
- `sounds/mob/bird/goldfinch/*`
- `sounds/mob/bird/oropendola/*`
- `sounds/mob/bird/piha/*`
- `sounds/mob/bird/robin/*`
- `sounds/mob/bird/toucan/*` if present in MineRe
- `sounds/mob/bird/tropical/*`
- `sounds/mob/bird/tufted_titmouse/*`
- `sounds/mob/eagle/*`
- `sounds/mob/owl/*`
- `sounds/mob/biter/bite.wav`
- `pack_icon.png`

Create or maintain:

- `manifest.json`
- `sounds.json`
- `sounds/sound_definitions.json`
- `texts/languages.json`
- `texts/en_US.lang`

## Required Standalone Registrations

The standalone RP should carry the registrations needed by the subset:

- `sounds.json` entries for `minere:bird`, `minere:eagle`, and `minere:owl`
- `sound_definitions.json` entries referenced by those entities
- display names in `texts/en_US.lang` for:
  - `entity.minere:bird.name`
  - `item.spawn_egg.entity.minere:bird.name`
  - `entity.minere:eagle.name`
  - `item.spawn_egg.entity.minere:eagle.name`
  - `entity.minere:owl.name`
  - `item.spawn_egg.entity.minere:owl.name`

## Current Known Dependency Notes

- `minere:eagle` sound events reference `mob.biter.bite`, so the standalone RP needs `sounds/mob/biter/bite.wav` and the matching sound definition.
- `minere:bird` sound definitions reference `sounds/mob/bird/toucan/...` for the oropendola set, so include those files when available.
- Bird and Owl both rely on parrot-style built-in sounds for some events. Those do not need to be copied from MineRe.
