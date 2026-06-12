"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useHaptics } from "@/hooks/useHaptics";

const ChargeSpin = dynamic(() => import("@/components/ChargeSpin"), { ssr: false });
const PopCascade = dynamic(() => import("@/components/PopCascade"), { ssr: false });
const LiquidScrub = dynamic(() => import("@/components/LiquidScrub"), { ssr: false });
const WorryBeads  = dynamic(() => import("@/components/WorryBeads"),  { ssr: false });

const MECHANICS = [
  {
    id: "spin",
    label: "Spin",
    color: "#00D4FF",
    icon: "◎",
    component: ChargeSpin,
    hint: "drag to flick the disc",
  },
  {
    id: "pop",
    label: "Pop",
    color: "#00FF88",
    icon: "⬡",
    component: PopCascade,
    hint: "tap bubbles to pop",
  },
  {
    id: "flow",
    label: "Flow",
    color: "#B44FFF",
    icon: "∿",
    component: LiquidScrub,
    hint: "drag through the field",
  },
  {
    id: "beads",
    label: "Beads",
    color: "#FF9500",
    icon: "⬤",
    component: WorryBeads,
    hint: "tap each bead",
  },
] as const;

type SimState = "idle" | "running" | "done";

export default function Page() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [simState, setSimState] = useState<SimState>("idle");
  const [progress, setProgress] = useState(0);
  const [hapticSupported, setHapticSupported] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { complete } = useHaptics();

  useEffect(() => {
    setHapticSupported("vibrate" in navigator);
  }, []);

  const startSim = useCallback(() => {
    setSimState("running");
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        // Simulate realistic LLM generation: fast start, slower middle, burst at end
        const remaining = 100 - p;
        const increment = remaining > 30
          ? 1.4 + Math.random() * 2.2
          : remaining > 8
          ? 0.4 + Math.random() * 0.9
          : 0.15 + Math.random() * 0.3;
        const next = p + increment;
        if (next >= 100) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setTimeout(() => {
            complete();
            setSimState("done");
          }, 200);
          return 100;
        }
        return next;
      });
    }, 160);
  }, [complete]);

  const resetSim = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSimState("idle");
    setProgress(0);
  }, []);

  const active = MECHANICS[activeIdx];
  const ActiveComponent = active.component;

  return (
    <main
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* ── Header ── */}
      <header className="flex items-start justify-between px-6 pt-5 pb-3 shrink-0">
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-widest" style={{ color: "var(--text)" }}>
            spinwait
          </h1>
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "var(--muted)" }}>
            fidget while you wait
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {hapticSupported ? (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full tracking-wider"
              style={{
                color: active.color,
                border: `1px solid ${active.color}44`,
                background: `${active.color}0e`,
              }}
            >
              ◉ haptic
            </span>
          ) : (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full tracking-wider"
              style={{ color: "#444", border: "1px solid #222" }}
            >
              ○ no haptic
            </span>
          )}
        </div>
      </header>

      {/* ── Agent status strip ── */}
      <div className="px-6 pb-3 shrink-0">
        {simState === "idle" && (
          <button
            onClick={startSim}
            className="w-full font-mono text-xs py-2.5 rounded-xl tracking-widest transition-all duration-200 animate-fade-in"
            style={{
              background: `${active.color}14`,
              border: `1px solid ${active.color}33`,
              color: active.color,
            }}
          >
            ▶ simulate a wait
          </button>
        )}

        {simState === "running" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] tracking-widest" style={{ color: active.color }}>
                agent coding…
              </span>
              <span className="font-mono text-[10px]" style={{ color: active.color }}>
                {Math.round(progress)}%
              </span>
            </div>
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{ background: "#1a1a2a" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: active.color,
                  boxShadow: `0 0 8px ${active.color}88`,
                }}
              />
            </div>
          </div>
        )}

        {simState === "done" && (
          <button
            onClick={resetSim}
            className="w-full font-mono text-xs py-2.5 rounded-xl tracking-widest animate-fade-in"
            style={{
              background: `${active.color}20`,
              border: `1px solid ${active.color}55`,
              color: active.color,
            }}
          >
            ✓ done — tap to reset
          </button>
        )}
      </div>

      {/* ── Mechanic area ── */}
      <div className="flex-1 min-h-0 relative">
        {/* Mechanic hint */}
        <p
          className="absolute top-0 left-0 right-0 text-center font-mono text-[10px] tracking-widest pointer-events-none z-10 pt-1"
          style={{ color: "#2a2a3a" }}
        >
          {active.hint}
        </p>

        <ActiveComponent
          progress={progress}
          color={active.color}
          isActive={simState === "running"}
        />
      </div>

      {/* ── Bottom nav ── */}
      <nav
        className="shrink-0 flex items-center justify-around px-4 py-3"
        style={{ borderTop: "1px solid #1a1a26" }}
      >
        {MECHANICS.map((m, i) => {
          const isSelected = i === activeIdx;
          return (
            <button
              key={m.id}
              onClick={() => setActiveIdx(i)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200"
              style={{
                background: isSelected ? `${m.color}14` : "transparent",
                border: isSelected ? `1px solid ${m.color}33` : "1px solid transparent",
              }}
              aria-label={m.label}
            >
              <span
                className="text-base leading-none"
                style={{ color: isSelected ? m.color : "#333344" }}
              >
                {m.icon}
              </span>
              <span
                className="font-mono text-[9px] tracking-widest"
                style={{ color: isSelected ? m.color : "#333344" }}
              >
                {m.label}
              </span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}
