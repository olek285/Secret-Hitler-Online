import { getFascistPower, getFascistPowerHint } from "./index";

// Mirrors backend/src/main/java/game/datastructures/board/*PlayerBoard.java.
const POWERS_BY_POLICY: Record<string, string[]> = {
  "5-6": ["NONE", "NONE", "PEEK", "EXECUTION", "EXECUTION", "VICTORY"],
  "7-8": [
    "NONE",
    "INVESTIGATE",
    "ELECTION",
    "EXECUTION",
    "EXECUTION",
    "VICTORY",
  ],
  "9-10": [
    "INVESTIGATE",
    "INVESTIGATE",
    "ELECTION",
    "EXECUTION",
    "EXECUTION",
    "VICTORY",
  ],
};

test.each([
  [5, "5-6"],
  [6, "5-6"],
  [7, "7-8"],
  [8, "7-8"],
  [9, "9-10"],
  [10, "9-10"],
])(
  "fascist powers for %i players match the %s board",
  (players: number, board: string) => {
    const powers = [1, 2, 3, 4, 5, 6].map((n) => getFascistPower(players, n));
    expect(powers).toEqual(POWERS_BY_POLICY[board]);
  }
);

test("hint adds the Hitler and veto rules once they apply", () => {
  expect(getFascistPowerHint(10, 0)).toBe(
    "Następna ustawa faszystowska: sprawdzenie lojalności"
  );
  expect(getFascistPowerHint(5, 1)).toBe(
    "Następna ustawa faszystowska: brak mocy"
  );
  expect(getFascistPowerHint(5, 2)).toBe(
    "Następna ustawa faszystowska: podgląd ustaw"
  );
  expect(getFascistPowerHint(7, 3)).toBe(
    "Dalej: egzekucja · Hitler kanclerzem wygrywa"
  );
  expect(getFascistPowerHint(7, 5)).toBe(
    "Dalej: wygrana · weto · Hitler kanclerzem wygrywa"
  );
});
