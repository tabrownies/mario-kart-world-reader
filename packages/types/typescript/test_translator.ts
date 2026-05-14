import { enumTranslator } from "./translateEnums";
import { RacePhase, Item, NumCoins } from "./generated/data";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("Running TypeScript Translator Tests...");

// Test RacePhase
assert(enumTranslator.racePhaseEnumToString(RacePhase.RACING) === "racing", "RacePhase to String");
assert(enumTranslator.racePhaseStringToEnum("racing") === RacePhase.RACING, "String to RacePhase");
assert(
  enumTranslator.racePhaseStringToEnum("RACING") === RacePhase.RACING,
  "Case insensitive RacePhase"
);

// Test Item
assert(enumTranslator.itemEnumToString(Item.GREEN_SHELL) === "green_shell", "Item to String");
assert(enumTranslator.itemStringToEnum("green_shell") === Item.GREEN_SHELL, "String to Item");
assert(
  enumTranslator.itemStringToEnum("triple_red_shells") === Item.TRIPLE_RED_SHELLS,
  "Triple shells"
);

// Test NumCoins
assert(enumTranslator.numCoinsEnumToString(NumCoins.COIN_10) === "coin_10", "Coins to String");
assert(enumTranslator.numCoinsStringToEnum("coin_10") === NumCoins.COIN_10, "String to Coins");

console.log("✅ All TypeScript tests passed!");
