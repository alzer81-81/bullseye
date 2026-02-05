import SetupScreen from "./components/SetupScreen";
import GameScreen from "./components/GameScreen";
import { useGameStore } from "./store/gameStore";

export type GameConfig = {
  startScore: 301 | 501;
  legsPerSet: number;
  setsToWin: number;
  finishOnDouble: boolean;
  players: string[];
};

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const setupMatch = useGameStore((s) => s.setupMatch);

  return (
    <>
      {phase === "setup" && (
        <SetupScreen
          onStart={(cfg) => {
            setupMatch(
              cfg.startScore,
              cfg.players,
              cfg.setsToWin,
              cfg.legsPerSet,
              cfg.finishOnDouble
            );
          }}
        />
      )}

      {phase !== "setup" && <GameScreen />}
    </>
  );
}
