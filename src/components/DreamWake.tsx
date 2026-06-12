"use client";
import { useEffect, useState } from "react";
import { DaemonState, formatFlux } from "@/lib/daemon";
import { decodeGenome, getHue } from "@/lib/genome";

const FALLBACK_HUE = 200;
function hueFromState(state: DaemonState): number {
  if (!state.genome) return FALLBACK_HUE;
  try { return getHue(decodeGenome(state.genome)); } catch { return FALLBACK_HUE; }
}

interface Props {
  state: DaemonState;
  onDismiss: () => void;
}

export default function DreamWake({ state, onDismiss }: Props) {
  const [phase, setPhase] = useState<"dream" | "shard" | "ready">("dream");
  const hue = hueFromState(state);

  useEffect(() => {
    const t1 = setTimeout(() => {
      if (state.pendingShard) {
        setPhase("shard");
        setTimeout(() => setPhase("ready"), 2000);
      } else {
        setPhase("ready");
      }
    }, 1800);
    return () => clearTimeout(t1);
  }, [state.pendingShard]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(2,2,6,0.97)", backdropFilter: "blur(8px)" }}
      onClick={phase === "ready" ? onDismiss : undefined}
    >
      {phase === "dream" && (
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6" style={{ filter: `hue-rotate(${hue - 180}deg)` }}>
            ◉
          </div>
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: `hsl(${hue}, 70%, 60%)` }}>
            daemon waking
          </p>
          <p className="font-mono text-[10px] text-gray-600 tracking-widest">dreamed while you were gone</p>
        </div>
      )}

      {phase === "shard" && state.pendingShard && (
        <div className="text-center animate-fade-in">
          <div
            className="text-5xl mb-4"
            style={{
              filter: state.pendingShard.rarity === "legendary"
                ? "drop-shadow(0 0 12px gold)"
                : state.pendingShard.rarity === "rare"
                ? `drop-shadow(0 0 8px hsl(${hue}, 100%, 60%))`
                : "none",
            }}
          >
            {state.pendingShard.emoji}
          </div>
          <p
            className="font-mono text-xs tracking-widest mb-1"
            style={{
              color: state.pendingShard.rarity === "legendary"
                ? "#ffcc00"
                : state.pendingShard.rarity === "rare"
                ? `hsl(${hue}, 80%, 65%)`
                : "#888",
            }}
          >
            {state.pendingShard.rarity} shard
          </p>
          <p className="font-mono text-sm font-bold tracking-widest text-white">
            {state.pendingShard.name}
          </p>
        </div>
      )}

      {phase === "ready" && (
        <div className="text-center animate-fade-in px-8">
          <div
            className="font-mono text-3xl font-bold mb-3 tracking-widest"
            style={{ color: `hsl(${hue}, 80%, 65%)` }}
          >
            +{formatFlux(state.dreamFluxPending)} flux
          </div>
          <p className="font-mono text-[10px] text-gray-500 tracking-widest mb-1">
            accumulated while agent slept
          </p>
          {state.pendingShard && (
            <p className="font-mono text-[10px] tracking-widest mb-6" style={{ color: `hsl(${hue}, 60%, 55%)` }}>
              + {state.pendingShard.name} collected
            </p>
          )}
          {!state.pendingShard && <div className="mb-6" />}
          <button
            onClick={onDismiss}
            className="font-mono text-xs tracking-widest px-6 py-2.5 rounded-xl"
            style={{
              background: `hsl(${hue}, 60%, 12%)`,
              border: `1px solid hsl(${hue}, 60%, 30%)`,
              color: `hsl(${hue}, 70%, 65%)`,
            }}
          >
            collect ↓
          </button>
        </div>
      )}
    </div>
  );
}
