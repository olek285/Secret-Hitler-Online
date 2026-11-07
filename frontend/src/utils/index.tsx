import { GameState, LobbyState } from "../types";
import { fascistPower, powerHint } from "../strings";

export const isVictoryState = (lobbyState: LobbyState): boolean => {
  return (
    lobbyState === LobbyState.FASCIST_VICTORY_ELECTION ||
    lobbyState === LobbyState.FASCIST_VICTORY_POLICY ||
    lobbyState === LobbyState.LIBERAL_VICTORY_EXECUTION ||
    lobbyState === LobbyState.LIBERAL_VICTORY_POLICY
  );
};

/**
 * Returns true if players with the Hitler role should know which players have
 * the Fascist role.
 */
export const doesHitlerKnowFascists = (gameState: GameState): boolean => {
  return gameState.playerOrder.length <= 6;
};

export type FascistPower =
  "NONE" | "INVESTIGATE" | "ELECTION" | "PEEK" | "EXECUTION" | "VICTORY";

/** Fascist policies needed for the Fascists to win outright. */
export const FASCIST_POLICIES_TO_WIN = 6;
/** From this many Fascist policies on, electing Hitler chancellor wins. */
export const HITLER_CHANCELLOR_THRESHOLD = 3;
/** From this many Fascist policies on, the chancellor can propose a veto. */
export const VETO_THRESHOLD = 5;

/**
 * The presidential power granted when the given Fascist policy is enacted.
 * Mirrors the backend boards (FiveToSixPlayerBoard, SevenToEightPlayerBoard,
 * NineToTenPlayerBoard); keep them in sync.
 * @param numPlayers players in the game, 5 to 10.
 * @param policyNumber which Fascist policy, counting from 1.
 */
export const getFascistPower = (
  numPlayers: number,
  policyNumber: number
): FascistPower => {
  if (policyNumber >= FASCIST_POLICIES_TO_WIN) {
    return "VICTORY";
  }
  if (policyNumber === 4 || policyNumber === 5) {
    return "EXECUTION";
  }
  if (numPlayers <= 6) {
    return policyNumber === 3 ? "PEEK" : "NONE";
  }
  if (policyNumber === 3) {
    return "ELECTION";
  }
  if (policyNumber === 2 || (policyNumber === 1 && numPlayers >= 9)) {
    return "INVESTIGATE";
  }
  return "NONE";
};

const FASCIST_POWER_TEXT: Record<FascistPower, string> = fascistPower;

/**
 * One short line (it has to fit a 360px phone) telling players what the next
 * Fascist policy does, plus the standing Hitler-chancellor and veto rules
 * once they apply.
 */
export const getFascistPowerHint = (
  numPlayers: number,
  numFascistPolicies: number
): string => {
  const next =
    FASCIST_POWER_TEXT[getFascistPower(numPlayers, numFascistPolicies + 1)];
  if (numFascistPolicies >= VETO_THRESHOLD) {
    return powerHint.nextHitlerVeto(next);
  }
  if (numFascistPolicies >= HITLER_CHANCELLOR_THRESHOLD) {
    return powerHint.nextHitler(next);
  }
  return powerHint.next(next);
};
