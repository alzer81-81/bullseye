import { useEffect, useState } from "react";
import type { GameConfig } from "../App";

export default function SetupScreen({
  onStart,
}: {
  onStart: (cfg: GameConfig) => void;
}) {
  const [startScore, setStartScore] = useState<301 | 501>(501);
  const [legsPerSet, setLegsPerSet] = useState(3);
  const [setsToWin, setSetsToWin] = useState(1);
  const [finishOnDouble] = useState(false);
  const [players, setPlayers] = useState<string[]>(["LEGEND 1", "LEGEND 2"]);
  const [titleIndex, setTitleIndex] = useState(0);

  const canAdd = players.length < 4;
  const baseBg = "bg-black";
  const baseText = "text-white";
  const borderColor = "border-white/40";
  const mutedText = "text-white/60";
  const mutedTextStrong = "text-white/70";

  const titleOptions = ["BUST", "NOTHING", "BRAG", "BEER"];

  useEffect(() => {
    const id = window.setInterval(() => {
      setTitleIndex((i) => (i + 1) % titleOptions.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const storedPlayers = localStorage.getItem("darts.players");
      const storedStart = localStorage.getItem("darts.startScore");
      const storedLegs = localStorage.getItem("darts.legsPerSet");
      const storedSets = localStorage.getItem("darts.setsToWin");

      if (storedPlayers) {
        const parsed = JSON.parse(storedPlayers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlayers(parsed as string[]);
        }
      }
      if (storedStart === "301" || storedStart === "501") {
        setStartScore(Number(storedStart) as 301 | 501);
      }
      if (storedLegs) {
        const n = Number(storedLegs);
        if (Number.isFinite(n) && n > 0) setLegsPerSet(n);
      }
      if (storedSets) {
        const n = Number(storedSets);
        if (Number.isFinite(n) && n > 0) setSetsToWin(n);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("darts.players", JSON.stringify(players));
    } catch {
      // ignore storage errors
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem("darts.startScore", String(startScore));
      localStorage.setItem("darts.legsPerSet", String(legsPerSet));
      localStorage.setItem("darts.setsToWin", String(setsToWin));
    } catch {
      // ignore storage errors
    }
  }, [startScore, legsPerSet, setsToWin]);

  return (
    <div className={`min-h-screen px-6 pb-12 ${baseBg} ${baseText}`}>
      <div className="ticker -mx-6">
        <div className="tickerTrack">
          STAND UP IF YOU LOVE THE DARTS • LAST ONE BUYING • AIM SMALL, MISS
          SMALL • BULL OR BOOZE • NO CALC NEEDED • BUSTS CALLED LOUDLY •
          BRAGGING RIGHTS ONLY • STAND UP IF YOU LOVE THE DARTS • LAST ONE
          BUYING • AIM SMALL, MISS SMALL • BULL OR BOOZE • NO CALC NEEDED •
          BUSTS CALLED LOUDLY • BRAGGING RIGHTS ONLY •
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1280px] font-black">
        <div className={`flex items-center justify-between border-b ${borderColor} pb-4 mb-8`}>
          <img
            src="/bullseye-logo.png"
            alt="Bullseye Darts"
            className="w-28 h-auto"
          />
          <a
            href="mailto:alpower242@gmail.com"
            className="text-xs uppercase tracking-[0.3em] text-white/60 hover:text-white"
          >
            Contact
          </a>
        </div>

        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div className="md:self-stretch flex flex-col justify-center pr-2">
          <h1 className={`mt-0 titleFont ${baseText}`}>
            <div
              className="font-black leading-[0.9] whitespace-nowrap"
              style={{ fontSize: "clamp(52px, 8vw, 118px)" }}
            >
              BULL
            </div>
            <div className="flex items-start gap-4 mt-2">
              <span
                className="inline-block leading-none"
                style={{
                  fontFamily: "inherit",
                  transform: "rotate(-6deg)",
                  textDecoration: "underline",
                  fontSize: "clamp(24px, 3vw, 40px)",
                }}
              >
                OR
              </span>
              <span
                className="font-black text-yellow-300 leading-[0.9] whitespace-nowrap"
                style={{ fontSize: "clamp(56px, 8vw, 126px)" }}
              >
                {titleOptions[titleIndex]}
              </span>
            </div>
          </h1>
          <p className={`mt-8 text-lg font-light max-w-xl ${mutedTextStrong}`}>
            Big darts, bigger mouths, and bragging rights on the line. Winner
            gets the first round, loser pretends they meant it.
          </p>
          </div>

          <div className={`w-full border ${borderColor} ${baseBg} p-6`}>
          <h2 className="titleFont text-xl font-black tracking-[0.2em] mb-6 text-center text-yellow-300">
            SETUP
          </h2>

        {/* 301 / 501 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[301, 501].map((v) => (
            <button
              key={v}
              onClick={() => setStartScore(v as 301 | 501)}
              className={`py-3 border ${borderColor} text-lg font-black ${
                startScore === v
                  ? "btn-primary border-white/40"
                  : `${baseBg} ${baseText}`
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Players */}
        <div className="space-y-3 mb-4">
          {players.map((p, i) => (
            <div key={i} className="relative">
              <input
                value={p}
                onFocus={() => {
                  if (p.toUpperCase().startsWith("LEGEND")) {
                    const next = [...players];
                    next[i] = "";
                    setPlayers(next);
                  }
                }}
                onChange={(e) => {
                  const next = [...players];
                  next[i] = e.target.value;
                  setPlayers(next);
                }}
                className={`w-full border ${borderColor} ${baseBg} px-4 py-3 pr-12 text-base font-bold`}
              />
              <button
                type="button"
                disabled={players.length <= 1}
                onClick={() => {
                  if (players.length <= 1) return;
                  const next = players.filter((_, idx) => idx !== i);
                  setPlayers(next);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold text-white/60 hover:text-white disabled:opacity-30"
                aria-label={`Remove ${p}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="mb-5 text-right">
          <button
            disabled={!canAdd}
            onClick={() =>
              canAdd && setPlayers([...players, `LEGEND ${players.length + 1}`])
            }
            className="text-sm font-black uppercase tracking-[0.3em] text-yellow-300/80 hover:text-yellow-300 disabled:opacity-30"
          >
            Add player
          </button>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={`block text-xs font-bold tracking-widest uppercase mb-2 ${mutedText}`}>
              Legs per set
            </label>
            <div className={`flex border ${borderColor} ${baseBg}`}>
              <div className="flex-1 px-4 py-4 text-xl font-black">
                {legsPerSet}
              </div>
              <div className={`flex flex-col border-l ${borderColor}`}>
                <button
                  type="button"
                  onClick={() => setLegsPerSet((v) => v + 1)}
                  className={`w-10 flex-1 border-b ${borderColor} text-xs font-black hover:bg-white hover:text-black`}
                  aria-label="Increase legs per set"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => setLegsPerSet((v) => Math.max(1, v - 1))}
                  className="w-10 flex-1 text-xs font-black hover:bg-white hover:text-black"
                  aria-label="Decrease legs per set"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold tracking-widest uppercase mb-2 ${mutedText}`}>
              Sets to win
            </label>
            <div className={`flex border ${borderColor} ${baseBg}`}>
              <div className="flex-1 px-4 py-4 text-xl font-black">
                {setsToWin}
              </div>
              <div className={`flex flex-col border-l ${borderColor}`}>
                <button
                  type="button"
                  onClick={() => setSetsToWin((v) => v + 1)}
                  className={`w-10 flex-1 border-b ${borderColor} text-xs font-black hover:bg-white hover:text-black`}
                  aria-label="Increase sets to win"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => setSetsToWin((v) => Math.max(1, v - 1))}
                  className="w-10 flex-1 text-xs font-black hover:bg-white hover:text-black"
                  aria-label="Decrease sets to win"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>

          <button
            onClick={() =>
              onStart({
                startScore,
                legsPerSet,
                setsToWin,
                finishOnDouble,
                players: players.map((p, i) => p || `LEGEND ${i + 1}`),
              })
            }
            className={`w-full mt-6 py-4 border ${borderColor} btn-primary text-lg font-black tracking-[0.2em]`}
          >
            LET’S HAVE IT
          </button>
          </div>
        </div>

        {/* Landing content */}
        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <div className={`border ${borderColor} p-6`}>
            <h3 className="text-xl text-yellow-300 tracking-[0.2em] uppercase">
              Why It Slaps
            </h3>
            <ul className={`mt-4 text-sm space-y-3 list-none ${mutedTextStrong}`}>
              <li>Zero fuss setup. Name the legends, hit play.</li>
              <li>Auto checkout tips for any score. No maths meltdown.</li>
              <li>Busts call themselves out. Loudly.</li>
              <li>Leg, set, match stats so you can humble your mates.</li>
              <li>Pixel‑clean, pub‑proof, and easy on the thumbs.</li>
            </ul>
          </div>

          <div className={`border ${borderColor} p-6`}>
            <h3 className="text-xl text-yellow-300 tracking-[0.2em] uppercase">
              For The Lads
            </h3>
            <ul className={`mt-4 text-sm space-y-3 list-none ${mutedTextStrong}`}>
              <li>Winner picks the playlist. Loser buys the next round.</li>
              <li>Bragging rights baked in.</li>
              <li>No ads, no faff, just darts.</li>
              <li>Start in seconds. Finish in style.</li>
              <li>Designed for shouts, not spreadsheets.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className={`border ${borderColor} p-5 text-sm ${mutedTextStrong}`}>
            <div className="text-yellow-300 tracking-[0.2em] uppercase text-xs">
              Auto Checkouts
            </div>
            <div className="mt-2">
              Always a finish line. Even when you’re two pints deep.
            </div>
          </div>
          <div className={`border ${borderColor} p-5 text-sm ${mutedTextStrong}`}>
            <div className="text-yellow-300 tracking-[0.2em] uppercase text-xs">
              Instant Undo
            </div>
            <div className="mt-2">
              Mis‑keyed a score? Pretend it never happened.
            </div>
          </div>
          <div className={`border ${borderColor} p-5 text-sm ${mutedTextStrong}`}>
            <div className="text-yellow-300 tracking-[0.2em] uppercase text-xs">
              Match Stats
            </div>
            <div className="mt-2">
              Averages and top visits. For receipts and bragging.
            </div>
          </div>
        </div>

        <div className={`mt-12 border ${borderColor} p-6 text-center`}>
          <div className={`text-sm uppercase tracking-[0.3em] ${mutedTextStrong}`}>
            Ready?
          </div>
          <div className="mt-3 text-2xl">
            Set it up. Shut it down.
          </div>
          <div className="mt-6">
            <button
              onClick={() =>
                onStart({
                  startScore,
                  legsPerSet,
                  setsToWin,
                  finishOnDouble,
                  players: players.map((p, i) => p || `LEGEND ${i + 1}`),
                })
              }
              className={`px-10 py-4 border ${borderColor} btn-primary text-lg font-black tracking-[0.2em]`}
            >
              START THE MATCH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
