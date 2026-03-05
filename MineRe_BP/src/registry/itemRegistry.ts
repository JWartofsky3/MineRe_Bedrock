import { StartupEvent } from "@minecraft/server";
import { PhasedEnderPearl } from "items/components/phased_ender_pearl";
import { EnderStrike } from "items/components/ender_strike";
import { IceDagger } from "items/components/ice_dagger";
import { VenomShank } from "items/components/venom_shank";
import { Treecapitator } from "items/components/treecapitator";
import {
  CustomAxe,
  CustomSword,
  CustomShovel,
  CustomPickaxe,
  CustomHoe,
} from "items/components/custom_tools";
import { RoyalJelly } from "items/components/royal_jelly";
import { Illumina } from "items/components/illumina";
import { PlatformPath } from "items/components/platform_path";
import { Windforce } from "items/components/windforce";
import { Firebrand } from "items/components/firebrand";
import { Darkheart } from "items/components/darkheart";
import { ElixirOfExperience } from "items/components/elixir_of_experience";
import { SettingsBook } from "items/components/settings_book";
import { Helper0 } from "items/components/helpers/helper0";
import { Helper1 } from "items/components/helpers/helper1";
import { Helper2 } from "items/components/helpers/helper2";
import { Ghostwalker } from "items/components/ghostwalker";
import { IndigonApple } from "items/components/indigon_apple";

export function registerItems(data: StartupEvent) {
  data.itemComponentRegistry.registerCustomComponent(
    "minere:elixir_of_experience",
    ElixirOfExperience,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:ender_strike",
    EnderStrike,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:illumina",
    Illumina,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:ice_dagger",
    IceDagger,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:venom_shank",
    VenomShank,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:windforce",
    Windforce,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:firebrand",
    Firebrand,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:darkheart",
    Darkheart,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:ghostwalker",
    Ghostwalker,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:royal_jelly",
    RoyalJelly,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:indigon_apple",
    IndigonApple,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:custom_sword",
    CustomSword,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:custom_axe",
    CustomAxe,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:custom_hoe",
    CustomHoe,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:custom_shovel",
    CustomShovel,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:custom_pickaxe",
    CustomPickaxe,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:treecapitator",
    Treecapitator,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:path",
    PlatformPath,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:phased_ender_pearl",
    PhasedEnderPearl,
  );
  data.itemComponentRegistry.registerCustomComponent(
    "minere:settings_book",
    SettingsBook,
  );
  data.itemComponentRegistry.registerCustomComponent("minere:helper0", Helper0);
  data.itemComponentRegistry.registerCustomComponent("minere:helper1", Helper1);
  data.itemComponentRegistry.registerCustomComponent("minere:helper2", Helper2);
}
