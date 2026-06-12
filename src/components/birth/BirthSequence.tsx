"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { MiniGameResult, buildGenome, decodeGenome } from "@/lib/genome";
import DaemonCreature from "@/components/DaemonCreature";

const SparkTap = dynamic(() => import("./SparkTap"), { ssr: false });
const ThreadCurrent = dynamic(() => import("./ThreadCurrent"), { ssr: false });
const PulseSync = dynamic(() => import("./PulseSync"), { ssr: false });
const CatchMotes = dynamic(() => import("./CatchMotes"), { ssr: false });
const RevealSequence = dynamic(() => import("./RevealSequence"), { ssr: false });

interface Props {
  parentGenome?: string;
  luckTokens?: number;
  onComplete: (genome: string) => void;
}

type GameId = "spark" | "thread" | "pulse" | "motes";

const GAMES: GameId[] = ["spark", "thread", "pulse", "motes"];
const GAME_LABELS: Record<GameId, string> = {
  spark:  "signal feed",
  thread: "current trace",
  pulse:  "rhythm sync",
  motes:  "mote catch",
};

// Embryo grows from nothing through each mini-game
const EMBRYO_STAGES = ["egg", "egg", "larva", "larva"] as const;

export default function BirthSequence({ parentGenome, luckTokens = 0, onComplete }: Props) {
  const [gameIndex, setGameIndex] = useState(0);
  const [results, setResults] = useState<MiniGameResult[]>([]);
  const [transitionPhase, setTransitionPhase] = useState<"playing" | "transition" | "reveal">("playing");
  const [embryoFlux, setEmbryoFlux] = useState(0);
  const [finalGenome, setFinalGenome] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState(0.2);
  const resultsRef = useRef<MiniGameResult[]>([]);

  const currentGame = GAMES[gameIndex];
  const embryoStage = EMBRYO_STAGES[Math.min(gameIndex, EMBRYO_STAGES.length - 1)];

  // Build a partial genome from results so far (for embryo preview)
  const partialDna = useRef(
    decodeGenome(parentGenome ?? "000000000000000000000000")
  );

  const handleGameComplete = useCallback((result: MiniGameResult) => {
    const newResults = [...resultsRef.current, result];
    resultsRef.current = newResults;
    setResults(newResults);

    // Update difficulty (adaptive curve)
    const avgScore = newResults.reduce((a, r) => a + r.score, 0) / newResults.length;
    setDifficulty(Math.min(0.95, 0.2 + avgScore * 0.7));

    const flux = newResults.length / GAMES.length;
    setEmbryoFlux(flux);

    setTransitionPhase("transition");

    setTimeout(() => {
      if (gameIndex + 1 >= GAMES.length) {
        // All games done — build final genome and go to reveal
        const genome = buildGenome(newResults, parentGenome, luckTokens);
        setFinalGenome(genome);
        partialDna.current = decodeGenome(genome);
        setTransitionPhase("reveal");
      } else {
        setGameIndex(gi => gi + 1);
        setTransitionPhase("playing");
      }
    }, 1400);
  }, [gameIndex, parentGenome, luckTokens]);

  if (transitionPhase === "reveal" && finalGenome) {
    return (
      <RevealSequence
        genome={finalGenome}
        onComplete={() => onComplete(finalGenome)}
      />
    );
  }

  const progressBars = GAMES.map((g, i) => {
    const filled = i < gameIndex || transitionPhase === "transition" && i === gameIndex;
    const active = i === gameIndex && transitionPhase === "playing";
    return { g, filled, active };
  });

  return (
    <div className="flex flex-col h-full w-full items-center px-4 py-6 gap-4"
      style={{ background: "#020206" }}>

      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <span className="font-mono text-[9px] tracking-widest" style={{ color: "#2a2a3a" }}>
          birth sequence
        </span>
        <div className="flex gap-1">
          {progressBars.map(({ g, filled, active }) => (
            <div
              key={g}
              style={{
                width: 18,
                height: 4,
                borderRadius: 2,
                background: filled
                  ? `hsl(${40 + embryoFlux * 120}, 70%, 50%)`
                  : active
                  ? `hsl(${40 + embryoFlux * 120}, 40%, 30%)`
                  : "#0e0e1e",
                border: active ? `1px solid hsl(${40 + embryoFlux * 120}, 60%, 40%)` : "1px solid #0e0e1e",
                transition: "background 0.5s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Embryo (grows with each game) */}
      <div className="relative flex items-center justify-center" style={{ height: 110 }}>
        <div
          style={{
            opacity: transitionPhase === "transition" ? 0 : 1,
            transform: transitionPhase === "transition" ? "scale(1.15)" : "scale(1)",
            transition: "all 0.6s ease",
          }}
        >
          <DaemonCreature
            dna={partialDna.current}
            stage={embryoStage}
            width={100}
            height={100}
          />
        </div>

        {/* Transition pulse */}
        {transitionPhase === "transition" && (
          <div
            className="absolute rounded-full"
            style={{
              width: 100, height: 100,
              border: `2px solid hsl(${40 + embryoFlux * 120}, 80%, 55%)`,
              animation: "pulseBig 0.8s ease-out forwards",
            }}
          />
        )}

        {/* Gene flash during transition */}
        {transitionPhase === "transition" && (
          <div
            className="absolute font-mono text-[8px] tracking-widest"
            style={{
              color: `hsl(${40 + embryoFlux * 120}, 70%, 55%)`,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "fadeIn 0.3s ease forwards",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {GAME_LABELS[currentGame]} locked ✓
          </div>
        )}
      </div>

      {/* Game label */}
      {transitionPhase === "playing" && (
        <div
          className="font-mono text-[10px] tracking-widest"
          style={{ color: `hsl(${40 + embryoFlux * 120}, 60%, 50%)` }}
        >
          ▸ {GAME_LABELS[currentGame]}
        </div>
      )}

      {/* Mini-game area */}
      <div
        className="w-full flex-1 flex flex-col"
        style={{
          opacity: transitionPhase === "playing" ? 1 : 0,
          transition: "opacity 0.4s ease",
          minHeight: 200,
        }}
      >
        {currentGame === "spark" && transitionPhase === "playing" && (
          <SparkTap difficulty={difficulty} embryoFlux={embryoFlux} onComplete={handleGameComplete} />
        )}
        {currentGame === "thread" && transitionPhase === "playing" && (
          <ThreadCurrent difficulty={difficulty} embryoFlux={embryoFlux} onComplete={handleGameComplete} />
        )}
        {currentGame === "pulse" && transitionPhase === "playing" && (
          <PulseSync difficulty={difficulty} embryoFlux={embryoFlux} onComplete={handleGameComplete} />
        )}
        {currentGame === "motes" && transitionPhase === "playing" && (
          <CatchMotes difficulty={difficulty} embryoFlux={embryoFlux} onComplete={handleGameComplete} />
        )}
      </div>

      <style>{`
        @keyframes pulseBig {
          from { opacity: 0.9; transform: scale(0.8); }
          to   { opacity: 0; transform: scale(2.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
