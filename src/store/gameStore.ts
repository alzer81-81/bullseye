import { create } from "zustand";
import type { Match, Player, GamePhase, GameMode, Leg, Set } from "../types";
import { createPlayer, isBust, calculateWinner, getSetWinner } from "../lib/gamelogic";

type UndoSnap = {
  match: Match;
};

interface GameState {
  match: Match | null;
  phase: GamePhase;
  currentThrowInput: string;
  undoStack: UndoSnap[];

  setupMatch: (
    gameMode: GameMode,
    playerNames: string[],
    setsToWin: number,
    legsPerSet: number,
    mustFinishOnDouble: boolean
  ) => void;

  setThrowInput: (value: string) => void;
  recordScore: (score: number, isDouble: boolean) => boolean;
  recordBust: () => void;
  undo: () => void;
  nextLeg: () => void;
  nextSet: () => void;
  newMatch: () => void;
}

function cloneMatch(match: Match): Match {
  // Simple deep-ish clone (good enough for our current shape)
  return JSON.parse(JSON.stringify(match)) as Match;
}

export const useGameStore = create<GameState>((set, get) => ({
  match: null,
  phase: "setup",
  currentThrowInput: "",
  undoStack: [],

  setupMatch: (gameMode, playerNames, setsToWin, legsPerSet, mustFinishOnDouble) => {
    const players: Player[] = playerNames.map((name, i) => createPlayer(`p${i}`, name, gameMode));

    const initialLeg: Leg = { id: "leg-0-0", winnerId: null, isComplete: false };
    const initialSet: Set = { id: "set-0", legs: [initialLeg], winnerId: null, isComplete: false };

    const match: Match = {
      id: `match-${Date.now()}`,
      gameMode,
      players,
      sets: [initialSet],
      legsPerSet,
      setsToWin,
      mustFinishOnDouble,
      winnerId: null,
      currentPlayerIndex: 0,
      currentSetIndex: 0,
      currentLegIndex: 0,
    };

    set({ match, phase: "playing", currentThrowInput: "", undoStack: [] });
  },

  setThrowInput: (value) => set({ currentThrowInput: value }),

  recordScore: (score, isDouble) => {
    const state = get();
    if (!state.match) return false;

    // Save undo snapshot first
    const undoStack = [...state.undoStack, { match: cloneMatch(state.match) }];

    const match = cloneMatch(state.match);
    const currentPlayer = match.players[match.currentPlayerIndex];

    // Bust? -> revert score to start of turn (we didn’t apply anything), rotate player
    if (isBust(currentPlayer.currentScore, score, match.mustFinishOnDouble, isDouble)) {
      match.currentPlayerIndex = (match.currentPlayerIndex + 1) % match.players.length;
      set({ match, undoStack, currentThrowInput: "" });
      return true;
    }

    const newScore = currentPlayer.currentScore - score;
    currentPlayer.currentScore = newScore;
    currentPlayer.throwHistory.push([score]);

    // Leg won?
    if (newScore === 0) {
      const currentSet = match.sets[match.currentSetIndex];
      const currentLeg = currentSet.legs[match.currentLegIndex];

      currentLeg.winnerId = currentPlayer.id;
      currentLeg.isComplete = true;
      currentPlayer.legsWon++;

      // Set won?
      const setWinnerId = getSetWinner(match, match.currentSetIndex);
      if (setWinnerId) {
        currentSet.winnerId = setWinnerId;
        currentSet.isComplete = true;

        const setWinner = match.players.find((p) => p.id === setWinnerId);
        if (setWinner) setWinner.setsWon++;

        // Match won?
        match.winnerId = calculateWinner(match);
        if (match.winnerId) {
          set({ match, undoStack, phase: "match-won", currentThrowInput: "" });
          return false;
        }

        set({ match, undoStack, phase: "set-won", currentThrowInput: "" });
        return false;
      }

      set({ match, undoStack, phase: "leg-won", currentThrowInput: "" });
      return false;
    }

    // Normal turn -> next player
    match.currentPlayerIndex = (match.currentPlayerIndex + 1) % match.players.length;
    set({ match, undoStack, phase: "playing", currentThrowInput: "" });
    return false;
  },

  recordBust: () => {
    const state = get();
    if (!state.match) return;

    const undoStack = [...state.undoStack, { match: cloneMatch(state.match) }];
    const match = cloneMatch(state.match);

    match.currentPlayerIndex = (match.currentPlayerIndex + 1) % match.players.length;
    set({ match, undoStack, currentThrowInput: "" });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;

    const undoStack = [...state.undoStack];
    const previous = undoStack.pop()!;
    set({ match: previous.match, undoStack, phase: "playing", currentThrowInput: "" });
  },

  nextLeg: () => {
    const state = get();
    if (!state.match) return;

    const match = cloneMatch(state.match);
    const currentSet = match.sets[match.currentSetIndex];

    // Reset scores for new leg
    match.players.forEach((p) => {
      p.currentScore = match.gameMode;
      p.legStartIndex = p.throwHistory.length;
    });

    const newLeg: Leg = {
      id: `leg-${match.currentSetIndex}-${currentSet.legs.length}`,
      winnerId: null,
      isComplete: false,
    };

    currentSet.legs.push(newLeg);
    match.currentLegIndex = currentSet.legs.length - 1;

    set({ match, phase: "playing", currentThrowInput: "" });
  },

  nextSet: () => {
    const state = get();
    if (!state.match) return;

    const match = cloneMatch(state.match);

    // Reset scores for new set (and legsWon for display)
    match.players.forEach((p) => {
      p.currentScore = match.gameMode;
      p.legsWon = 0;
      p.legStartIndex = p.throwHistory.length;
    });

    const newLeg: Leg = { id: `leg-${match.sets.length}-0`, winnerId: null, isComplete: false };
    const newSet: Set = { id: `set-${match.sets.length}`, legs: [newLeg], winnerId: null, isComplete: false };

    match.sets.push(newSet);
    match.currentSetIndex = match.sets.length - 1;
    match.currentLegIndex = 0;

    set({ match, phase: "playing", currentThrowInput: "" });
  },

  newMatch: () => set({ match: null, phase: "setup", currentThrowInput: "", undoStack: [] }),
}));
