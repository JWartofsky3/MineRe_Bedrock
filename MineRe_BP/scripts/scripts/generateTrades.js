const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
// Read optional num_to_select parameter
let numToSelect = 1;
if (process.argv[2]) {
  const parsed = parseInt(process.argv[2], 10);
  if (!isNaN(parsed) && parsed > 0) {
    numToSelect = parsed;
  } else {
    console.warn(
      `Invalid num_to_select "${process.argv[2]}". Defaulting to 1.`,
    );
  }
}
const inputCsvPath = path.resolve(process.cwd(), "trades.csv");
const librarianFilePath = path.resolve(
  process.cwd(),
  "../../trading/economy_trades/librarian_trades.json",
);
// Helper to remove comments and parse JSON
function readJsonFileSafe(filePath, label) {
  try {
    let raw = fs.readFileSync(filePath, "utf8");
    raw = raw.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""); // Remove // and /* */ comments
    return JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to read or parse ${label} at ${filePath}`);
    console.error(err);
    process.exit(1);
  }
}
// Identify book enchantment trade
function isEnchantedBookTrade(trade) {
  return trade?.gives?.some(
    (give) =>
      give.item === "minecraft:book" &&
      give.functions?.some(
        (f) =>
          f.function === "specific_enchants" ||
          f.function === "enchant_book_for_trading",
      ),
  );
}
const generatedTrades = [];
fs.createReadStream(inputCsvPath)
  .pipe(csv({ separator: "\t" }))
  .on("data", (row) => {
    const enchantCell = row["Enchantment"];
    if (!enchantCell) return;
    const enchantments = enchantCell.split(",").map((e) => e.trim());
    const maxLevelCell = row["Max Level"];
    let maxLevels = [];
    if (maxLevelCell.includes(",")) {
      maxLevels = maxLevelCell.split(",").map((s) => parseInt(s.trim(), 10));
      if (maxLevels.length !== enchantments.length) return;
    } else {
      const singleMax = parseInt(maxLevelCell, 10);
      maxLevels = Array(enchantments.length).fill(singleMax);
    }
    const weight = parseInt(row["Weight"], 10);
    const item =
      (row["Item"].includes(":") ? "" : "minecraft:") + row["Item"].trim();
    const emeraldMin = parseInt(row["Min"], 10);
    const emeraldMax = parseInt(row["Max"], 10);
    const emeraldSep = parseInt(row["Separator"], 10);
    const itemMin = parseInt(row["Item Min"], 10);
    const itemMax = parseInt(row["Item Max"], 10);
    const itemSep = parseInt(row["Item Separator"], 10);
    const highestMaxLevel = Math.max(...maxLevels);
    const baseWeight = Math.floor(weight / highestMaxLevel);
    const remainder = weight % highestMaxLevel;
    let prevEmeraldMax = 0;
    let prevItemMax = 0;
    for (let level = 1; level <= highestMaxLevel; level++) {
      const emeraldRange =
        level > 1
          ? {
              min: prevEmeraldMax + emeraldSep + emeraldMin,
              max: prevEmeraldMax + emeraldSep + emeraldMax,
            }
          : { min: emeraldMin, max: emeraldMax };
      const itemRange =
        level > 1
          ? {
              min: prevItemMax + itemSep + itemMin,
              max: prevItemMax + itemSep + itemMax,
            }
          : { min: itemMin, max: itemMax };
      const emeraldQuantity =
        emeraldRange.min === emeraldRange.max ? emeraldRange.min : emeraldRange;
      const itemQuantity =
        itemRange.min === itemRange.max ? itemRange.min : itemRange;
      const enchants = enchantments.map((id, i) => ({
        id,
        level: Math.min(level, maxLevels[i]),
      }));
      const levelWeight = baseWeight + (level <= remainder ? 1 : 0);
      // Trader XP cost scaling
      const traderExp =
        highestMaxLevel === 1
          ? 3
          : Math.max(
              2,
              Math.round(1 + ((level - 1) * (5 - 1)) / (highestMaxLevel - 1)),
            );
      generatedTrades.push({
        weight: levelWeight,
        wants: [
          { item: "minecraft:emerald", quantity: emeraldQuantity },
          { item, quantity: itemQuantity },
        ],
        gives: [
          {
            item: "minecraft:book",
            quantity: 1,
            functions: [
              {
                function: "specific_enchants",
                enchants,
              },
            ],
          },
        ],
        trader_exp: traderExp,
        max_uses: 5,
        reward_exp: true,
      });
      prevEmeraldMax = emeraldRange.max;
      prevItemMax = itemRange.max;
    }
  })
  .on("end", () => {
    if (generatedTrades.length === 0) {
      console.error("❌ No valid trades generated from CSV.");
      process.exit(1);
    }
    const librarianJson = readJsonFileSafe(
      librarianFilePath,
      "librarian_trades.json",
    );
    if (!Array.isArray(librarianJson.tiers)) {
      console.error('❌ Expected "tiers" array in librarian_trades.json');
      process.exit(1);
    }
    librarianJson.tiers.forEach((tier) => {
      const newGroups = [];
      for (const group of tier.groups || []) {
        const bookTrades = group.trades?.filter(isEnchantedBookTrade) || [];
        const nonBookTrades =
          group.trades?.filter((t) => !isEnchantedBookTrade(t)) || [];
        // If the group had no enchanted books, keep it as-is
        if (bookTrades.length === 0) {
          newGroups.push(group);
          continue;
        }
        const removedWeight = bookTrades.reduce(
          (sum, t) => sum + (t.weight || 1),
          0,
        );
        const keptWeight = nonBookTrades.reduce(
          (sum, t) => sum + (t.weight || 1),
          0,
        );
        const newWeight = generatedTrades.reduce(
          (sum, t) => sum + (t.weight || 1),
          0,
        );
        // Scale preserved weights to maintain original ratio
        const scale = removedWeight > 0 ? newWeight / removedWeight : 1;
        for (const trade of nonBookTrades) {
          trade.weight = Math.round((trade.weight || 1) * scale);
        }
        newGroups.push({
          num_to_select: Math.min(
            numToSelect,
            nonBookTrades.length + generatedTrades.length,
          ),
          trades: [...nonBookTrades, ...generatedTrades],
        });
      }
      tier.groups = newGroups;
    });
    try {
      fs.writeFileSync(
        librarianFilePath,
        JSON.stringify(librarianJson, null, 2),
        "utf8",
      );
      console.log(`✅ Librarian trades updated at: ${librarianFilePath}`);
    } catch (err) {
      console.error("❌ Failed to write librarian_trades.json");
      console.error(err);
      process.exit(1);
    }
  });
