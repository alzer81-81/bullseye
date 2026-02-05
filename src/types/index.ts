export type GameMode = 301 | 501;

export type Player = {
  id: string;
  name: string;
  currentScore: number;
  legsWon: number;
  setsWon: number;
  throwHistory: number[][];
  legStartIndex: number;
};

export type Leg = {
  id: string;
  winnerId: string | null;
  isComplete: boolean;
};

export type Set = {
  id: string;
  legs: Leg[];
  winnerId: string | null;
  isComplete: boolean;
};

export type Match = {
  id: string;
  gameMode: GameMode;
  players: Player[];
  sets: Set[];
  legsPerSet: number;
  setsToWin: number;
  mustFinishOnDouble: boolean;
  winnerId: string | null;
  currentPlayerIndex: number;
  currentSetIndex: number;
  currentLegIndex: number;
};

export type GamePhase = 'setup' | 'playing' | 'leg-won' | 'set-won' | 'match-won';
