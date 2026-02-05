import type { Player, Match, GameMode } from '../types';

export function createPlayer(id: string, name: string, startingScore: number): Player {
  return {
    id,
    name,
    currentScore: startingScore,
    legsWon: 0,
    setsWon: 0,
    throwHistory: [],
    legStartIndex: 0,
  };
}

export function isBust(
  currentScore: number,
  scoreThrown: number,
  mustFinishOnDouble: boolean,
  isDouble: boolean
): boolean {
  const newScore = currentScore - scoreThrown;
  
  if (newScore < 0) return true;
  if (newScore === 1) return true;
  if (newScore === 0 && mustFinishOnDouble && !isDouble) return true;
  
  return false;
}

export function scoreIsValid(score: number): boolean {
  if (score < 0 || score > 180) return false;
  return true;
}

export function calculateWinner(match: Match): string | null {
  const playerSetWins = match.players.map(p => p.setsWon);
  const maxWins = Math.max(...playerSetWins);
  
  if (maxWins >= match.setsToWin) {
    const winnerIndex = playerSetWins.indexOf(maxWins);
    return match.players[winnerIndex].id;
  }
  
  return null;
}

export function getCurrentSet(match: Match) {
  return match.sets[match.currentSetIndex];
}

export function getCurrentLeg(match: Match) {
  const currentSet = getCurrentSet(match);
  return currentSet.legs[match.currentLegIndex];
}

export function getSetWinner(match: Match, setIndex: number): string | null {
  const set = match.sets[setIndex];
  const legsNeeded = Math.ceil(match.legsPerSet / 2);
  
  for (const player of match.players) {
    const legsWonInSet = set.legs.filter(leg => leg.winnerId === player.id).length;
    if (legsWonInSet >= legsNeeded) {
      return player.id;
    }
  }
  
  return null;
}
