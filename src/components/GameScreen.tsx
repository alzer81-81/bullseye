import { useEffect, useMemo, useRef, useState } from "react";
import { getCheckoutSuggestions } from "../lib/checkouts";
import { useGameStore } from "../store/gameStore";

/* ------------------ Helpers ------------------ */
const avg = (scored: number, darts: number) =>
  darts === 0 ? 0 : scored / (darts / 3);

function totalScored(throws: number[][]) {
  return throws.reduce((sum, visit) => {
    const visitTotal = visit.reduce((s, v) => s + v, 0);
    return sum + visitTotal;
  }, 0);
}

function dartsThrown(throws: number[][]) {
  return throws.length * 3;
}

function dartsThisLeg(player: { throwHistory: number[][]; legStartIndex: number }) {
  return (player.throwHistory.length - player.legStartIndex) * 3;
}

function topVisits(throws: number[][]) {
  const visits = throws.map((visit) => visit.reduce((s, v) => s + v, 0));
  return visits.sort((a, b) => b - a).slice(0, 3);
}

/* ------------------ Component ------------------ */
export default function GameScreen() {
  const match = useGameStore((s) => s.match);
  const phase = useGameStore((s) => s.phase);
  const currentThrowInput = useGameStore((s) => s.currentThrowInput);
  const setThrowInput = useGameStore((s) => s.setThrowInput);
  const recordScore = useGameStore((s) => s.recordScore);
  const undo = useGameStore((s) => s.undo);
  const undoStackSize = useGameStore((s) => s.undoStack.length);
  const nextLeg = useGameStore((s) => s.nextLeg);
  const nextSet = useGameStore((s) => s.nextSet);
  const newMatch = useGameStore((s) => s.newMatch);

  const inputRef = useRef<HTMLInputElement>(null);
  const bustTimerRef = useRef<number | null>(null);
  const [bustFlash, setBustFlash] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const lastAnnouncementRef = useRef<string>("");
  const speakRetryRef = useRef(0);
  const [voiceUnlocked, setVoiceUnlocked] = useState(false);

  function speak(text: string, attempt = 0, forceFallback = false) {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    if (!voiceEnabled) return;
    const synth = window.speechSynthesis;
    const available = voices.length ? voices : synth.getVoices();
    if (!available.length && speakRetryRef.current < 3) {
      speakRetryRef.current += 1;
      window.setTimeout(() => speak(text, attempt, forceFallback), 250);
      return;
    }
    speakRetryRef.current = 0;

    const isChrome =
      typeof navigator !== "undefined" &&
      /Chrome/.test(navigator.userAgent) &&
      !/Edg|OPR/.test(navigator.userAgent);

    const pickVoice = () => {
      if (!forceFallback && selectedVoice) {
        const sel = available.find((v) => v.name === selectedVoice) || null;
        if (sel) return sel;
      }
      if (isChrome) {
        const googleEn = available.find(
          (v) =>
            /google/i.test(v.name) &&
            (v.lang?.toLowerCase().startsWith("en") ?? false)
        );
        if (googleEn) return googleEn;
      }
      const def = available.find((v) => v.default) || null;
      return def || available[0] || null;
    };

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      if (voice.lang) utterance.lang = voice.lang;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onerror = () => {
      if (attempt < 2) {
        speak(text, attempt + 1, true);
      }
    };

    const enqueue = () => {
      if (synth.paused) synth.resume();
      synth.speak(utterance);
      window.setTimeout(() => {
        if (!synth.speaking && attempt < 2) {
          speak(text, attempt + 1, true);
        }
      }, 200);
    };

    if (synth.speaking || synth.pending) {
      synth.cancel();
      window.setTimeout(enqueue, 50);
      return;
    }
    enqueue();
  }

  function unlockVoice() {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const available = voices.length ? voices : synth.getVoices();
    const voice = available.find((v) => v.default) || available[0] || null;
    const utterance = new SpeechSynthesisUtterance("ready");
    if (voice) {
      utterance.voice = voice;
      if (voice.lang) utterance.lang = voice.lang;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 0.15;
    if (synth.speaking || synth.pending) synth.cancel();
    synth.speak(utterance);
    window.setTimeout(() => {
      if (synth.speaking) synth.cancel();
      setVoiceUnlocked(true);
    }, 300);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, [match?.currentPlayerIndex, phase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const voices = synth.getVoices();
      if (!voices.length) return;
      setVoices(voices);
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    try {
      const savedEnabled = localStorage.getItem("darts.voice.enabled");
      const savedVoice = localStorage.getItem("darts.voice.name");
      if (savedEnabled !== null) setVoiceEnabled(savedEnabled === "true");
      if (savedVoice) setSelectedVoice(savedVoice);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("darts.voice.enabled", String(voiceEnabled));
      localStorage.setItem("darts.voice.name", selectedVoice);
    } catch {
      // ignore storage errors
    }
  }, [voiceEnabled, selectedVoice]);

  // Keep an effect for persistence-driven updates, but prefer user-gesture calls below.
  useEffect(() => {
    if (!voiceEnabled) return;
    if (!selectedVoice) return;
    speak("180");
  }, [voiceEnabled, selectedVoice]);

  useEffect(() => {
    if (!bustFlash) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setBustFlash(false);
        if (bustTimerRef.current) {
          window.clearTimeout(bustTimerRef.current);
          bustTimerRef.current = null;
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [bustFlash]);

  if (!match) return null;

  const active = match.currentPlayerIndex;
  const modal =
    phase === "leg-won"
      ? "leg"
      : phase === "set-won"
      ? "set"
      : phase === "match-won"
      ? "match"
      : null;

  const currentSet = match.sets[match.currentSetIndex];
  const lastCompletedLeg =
    currentSet.legs
      .slice()
      .reverse()
      .find((leg) => leg.winnerId !== null) || null;

  const winnerId =
    modal === "leg"
      ? lastCompletedLeg?.winnerId || null
      : modal === "set"
      ? currentSet.winnerId
      : modal === "match"
      ? match.winnerId
      : null;

  const winnerIndex = winnerId
    ? match.players.findIndex((p) => p.id === winnerId)
    : -1;

  const winner = winnerIndex >= 0 ? match.players[winnerIndex] : null;

  const winnerStats = winner
    ? {
        avg: avg(
          totalScored(winner.throwHistory),
          dartsThrown(winner.throwHistory)
        ),
        top: topVisits(winner.throwHistory),
      }
    : { avg: 0, top: [] as number[] };

  const otherPlayers = match.players
    .filter((_, idx) => idx !== winnerIndex)
    .sort(
      (a, b) =>
        avg(totalScored(b.throwHistory), dartsThrown(b.throwHistory)) -
        avg(totalScored(a.throwHistory), dartsThrown(a.throwHistory))
    );
  const comparison = otherPlayers[0] || null;
  const comparisonStats = comparison
    ? {
        avg: avg(
          totalScored(comparison.throwHistory),
          dartsThrown(comparison.throwHistory)
        ),
        top: topVisits(comparison.throwHistory),
      }
    : { avg: 0, top: [] as number[] };

  const checkout = useMemo(() => {
    const suggestions = getCheckoutSuggestions(
      match.players[active].currentScore
    );
    return suggestions.length > 0 ? suggestions[0] : null;
  }, [match.players, active]);

  const activeDarts = dartsThrown(match.players[active].throwHistory);
  const maxPossible = (9 - activeDarts) * 60;
  const nineDarterOn =
    match.gameMode === 501 &&
    activeDarts <= 6 &&
    match.players[active].currentScore <= maxPossible;

  useEffect(() => {
    if (!modal || !winner) return;
    const label =
      modal === "match"
        ? "Match"
        : modal === "set"
        ? "Set"
        : "Leg";
    const winnerLegDarts = dartsThisLeg(winner);
    const isNineDarter = modal === "leg" && winnerLegDarts === 9;
    const announcement = isNineDarter
      ? `${winner.name} wins the leg, what a bloody legend`
      : `${winner.name} wins the ${label}`;
    const key = `${modal}:${winner.id}`;
    if (lastAnnouncementRef.current === key) return;
    lastAnnouncementRef.current = key;
    speak(announcement);
  }, [modal, winner, speak]);

  function score() {
    if (modal || bustFlash) return;

    const n = Number(currentThrowInput);
    if (!Number.isFinite(n) || n < 0 || n > 180) return;

    const wasBust = recordScore(n, false);
    if (wasBust) {
      speak("Bust");
      setBustFlash(true);
      if (bustTimerRef.current) {
        window.clearTimeout(bustTimerRef.current);
      }
      bustTimerRef.current = window.setTimeout(() => {
        setBustFlash(false);
        bustTimerRef.current = null;
      }, 2000);
    } else {
      speak(String(n));
    }
  }

  function handleContinue() {
    if (modal === "match") {
      newMatch();
      return;
    }

    if (modal === "set") {
      nextSet();
      return;
    }

    if (modal === "leg") {
      nextLeg();
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-black flex flex-col">
      {/* Top bar */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/70">
        <span>SET {match.currentSetIndex + 1}</span>
        <button
          onClick={() => setSettingsOpen(true)}
          className="uppercase text-xs tracking-[0.3em] text-yellow-300 hover:text-yellow-400 flex items-center gap-2"
          aria-label="Open voice settings"
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 9v6h4l5 4V5L9 9H5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M16 8c1.5 1 2.5 2.6 2.5 4s-1 3-2.5 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          Voice Settings
        </button>
        <span>LEG {match.currentLegIndex + 1}</span>
      </div>

      {/* Players */}
      <div className="flex-1 flex flex-col md:flex-row divide-y-2 md:divide-y-0 md:divide-x-2 divide-white/40">
        {match.players.map((p, i) => {
          const scored = totalScored(p.throwHistory);
          const darts = dartsThrown(p.throwHistory);

          return (
            <div
              key={p.id}
              className={`px-6 py-8 md:flex-1 transition-all duration-300 flex flex-col ${
                i === active
                  ? "scale-[1.02]"
                  : "opacity-40 scale-[0.92]"
              }`}
            >
              <div className="flex items-start justify-between text-xs uppercase text-white/60 tracking-widest">
                <div>
                  <div className="text-lg text-white">{p.name}</div>
                  <div className="mt-1 text-[10px] text-white/40">
                    SETS {p.setsWon} · LEGS {p.legsWon}
                  </div>
                </div>
                <span>AVG {avg(scored, darts).toFixed(1)}</span>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div
                  className={`text-center leading-none ${
                    i === active ? "text-[140px]" : "text-[100px]"
                  }`}
                >
                  {p.currentScore}
                </div>

                {i === active && (
                  <>
                    <input
                      ref={inputRef}
                      value={currentThrowInput}
                      onChange={(e) =>
                        setThrowInput(
                          e.target.value.replace(/\D/g, "").slice(0, 3)
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (bustFlash) {
                            e.preventDefault();
                            setBustFlash(false);
                            if (bustTimerRef.current) {
                              window.clearTimeout(bustTimerRef.current);
                              bustTimerRef.current = null;
                            }
                            return;
                          }
                          score();
                        }
                      }}
                      onBlur={() => inputRef.current?.focus()}
                      className="w-full mt-6 text-center text-5xl bg-transparent border-0 outline-none py-4 text-yellow-300 caret-yellow-300 animate-pulse"
                    />

                    {checkout && (
                      <div className="mt-4 text-center text-white">
                        {nineDarterOn && (
                          <div className="mb-2 text-xs uppercase tracking-[0.3em] text-white">
                            9 DARTER ON
                          </div>
                        )}
                        CHECK OUT
                        <div className="text-xl mt-1">
                          {checkout.replace(/-/g, " · ")}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t-2 border-white/40 px-6 py-4 flex justify-between">
        <button
          onClick={undo}
          disabled={undoStackSize === 0}
          className="uppercase text-xs tracking-[0.3em] text-white/70 disabled:opacity-30"
        >
          UNDO
        </button>
        <button
          onClick={score}
          className="border border-white/40 btn-primary px-8 py-3 uppercase tracking-[0.3em]"
        >
          SCORE
        </button>
        <button
          onClick={newMatch}
          className="uppercase text-xs tracking-[0.3em] text-white/70"
        >
          QUIT
        </button>
      </div>

      {/* Modals */}
      {bustFlash && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="border border-white/40 bg-black px-10 py-6 text-yellow-300 text-5xl md:text-6xl tracking-[0.3em]">
            BUST
          </div>
        </div>
      )}

      {modal && winnerIndex !== -1 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-black border border-white/40 p-6 text-center min-w-[320px]">
            <div className="text-3xl text-yellow-300 uppercase">
              {modal === "match"
                ? `MATCH TO ${match.players[winnerIndex].name}`
                : `${modal.toUpperCase()} TO ${match.players[winnerIndex].name}`}
            </div>

            {(modal === "leg" || modal === "set" || modal === "match") && (
              <div className="mt-6 grid grid-cols-2 gap-4 text-left">
                <div className="border border-white/40 p-3">
                  <div className="text-xs uppercase tracking-widest text-white/60">
                    Winner
                  </div>
                  <div className="text-lg text-yellow-300 uppercase">
                    {winner?.name || "-"}
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-widest text-white/60">
                    Avg
                  </div>
                  <div className="text-xl">{winnerStats.avg.toFixed(1)}</div>
                  <div className="mt-3 text-xs uppercase tracking-widest text-white/60">
                    Top 3
                  </div>
                  <div className="text-sm">
                    {winnerStats.top.length
                      ? winnerStats.top.join(" • ")
                      : "-"}
                  </div>
                </div>

                <div className="border border-white/40 p-3">
                  <div className="text-xs uppercase tracking-widest text-white/60">
                    Opponent
                  </div>
                  <div className="text-lg uppercase">
                    {comparison?.name || "-"}
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-widest text-white/60">
                    Avg
                  </div>
                  <div className="text-xl">
                    {comparisonStats.avg.toFixed(1)}
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-widest text-white/60">
                    Top 3
                  </div>
                  <div className="text-sm">
                    {comparisonStats.top.length
                      ? comparisonStats.top.join(" • ")
                      : "-"}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="mt-6 border border-white/40 btn-primary px-6 py-3 uppercase tracking-[0.3em]"
            >
              {modal === "match" ? "BACK TO HOME" : "CONTINUE"}
            </button>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-white/40 p-6 w-full max-w-[560px] rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-yellow-300 uppercase tracking-[0.3em] text-sm">
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 9v6h4l5 4V5L9 9H5z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 8c1.5 1 2.5 2.6 2.5 4s-1 3-2.5 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                Voice Settings
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-white/70 hover:text-white uppercase text-xs tracking-[0.3em]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 border border-white/40 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-white uppercase text-xs tracking-[0.3em]">
                  Voice
                </div>
                <button
                  onClick={() => setVoiceEnabled((v) => !v)}
                  className={`px-3 py-1 text-xs uppercase tracking-[0.3em] border ${
                    voiceEnabled
                      ? "btn-primary border-white/40"
                      : "bg-black text-white/70 border-white/40 hover:text-white"
                  }`}
                >
                  {voiceEnabled ? "On" : "Off"}
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-xs uppercase tracking-[0.3em] text-white/60">
                  Voice Select
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSelectedVoice(next);
                    // Chrome often requires a user gesture to speak.
                    if (voiceEnabled) {
                      unlockVoice();
                      window.setTimeout(() => speak("180"), 0);
                    }
                  }}
                  className="mt-2 w-full bg-black border border-white/40 text-white px-5 py-8 text-lg rounded-lg"
                  disabled={!voiceEnabled}
                >
                  <option value="">System Default</option>
                  {voices.map((v) => (
                    <option key={`${v.name}-${v.lang}`} value={v.name}>
                      {v.name} ({v.lang}){v.default ? " • Default" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4" />
            </div>

            <div className="mt-4 text-white/40 text-xs uppercase tracking-[0.3em]">
              Voices loaded: {voices.length || 0}
            </div>
            {voices.length === 0 && (
              <div className="mt-2 text-white/40 text-xs uppercase tracking-[0.3em]">
                Tip: interact once (click) to load voices.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
