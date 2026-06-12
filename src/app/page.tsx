"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useDaemon } from "@/hooks/useDaemon";
import { formatFlux, progressToNextStage, STAGE_LABELS, shipDaemon } from "@/lib/daemon";
import { useHaptics } from "@/hooks/useHaptics";

const DaemonCreature = dynamic(() => import("@/components/DaemonCreature"), { ssr: false });
const DreamWake      = dynamic(() => import("@/components/DreamWake"),      { ssr: false });
const ChargeSpin     = dynamic(() => import("@/components/ChargeSpin"),     { ssr: false });
const PopCascade     = dynamic(() => import("@/components/PopCascade"),     { ssr: false });
const LiquidScrub    = dynamic(() => import("@/components/LiquidScrub"),    { ssr: false });
const WorryBeads     = dynamic(() => import("@/components/WorryBeads"),     { ssr: false });

type MechanicId = "spin" | "pop" | "flow" | "beads";
type SimState = "idle" | "running" | "done";
type AppMode = "idle" | "charging";

const MECHANICS: { id: MechanicId; label: string; icon: string }[] = [
  { id: "spin",  label: "spin",  icon: "◎" },
  { id: "pop",   label: "pop",   icon: "⬡" },
  { id: "flow",  label: "flow",  icon: "∿" },
  { id: "beads", label: "beads", icon: "⬤" },
];

export default function Page() {
  const { state, showDreamWake, dismissDream, recordCharge, ship } = useDaemon();
  const { complete, vibrate } = useHaptics();

  const [mode, setMode] = useState<AppMode>("idle");
  const [mechanic, setMechanic] = useState<MechanicId>("spin");
  const [simState, setSimState] = useState<SimState>("idle");
  const [agentProgress, setAgentProgress] = useState(0);
  const [resonanceLevel, setResonanceLevel] = useState(0);
  const [showCleanExit, setShowCleanExit] = useState(false);
  const [showShelf, setShowShelf] = useState(false);
  const [fluxThisSession, setFluxThisSession] = useState(0);
  const [showShipConfirm, setShowShipConfirm] = useState(false);

  const sessionStartRef = useRef<number>(0);
  const resonanceSecondsRef = useRef(0);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const agentDoneTimeRef = useRef<number | null>(null);

  const hueColor = `hsl(${state.hue}, 80%, 60%)`;
  const hueColorDim = `hsl(${state.hue}, 60%, 45%)`;
  const stagePct = progressToNextStage(state.totalFluxEarned);

  // --- Agent simulation ---
  const startAgent = useCallback(() => {
    setSimState("running");
    setAgentProgress(0);
    agentDoneTimeRef.current = null;

    simIntervalRef.current = setInterval(() => {
      setAgentProgress((p) => {
        const remaining = 100 - p;
        const inc = remaining > 30
          ? 1.4 + Math.random() * 2.2
          : remaining > 8
          ? 0.4 + Math.random() * 0.9
          : 0.15 + Math.random() * 0.3;
        const next = p + inc;
        if (next >= 100) {
          clearInterval(simIntervalRef.current!);
          agentDoneTimeRef.current = Date.now();
          setTimeout(() => {
            complete();
            setSimState("done");
            // Auto-trigger clean exit check if still charging
            setShowCleanExit(true);
            setTimeout(() => setShowCleanExit(false), 3000);
          }, 200);
          return 100;
        }
        return next;
      });
    }, 160);
  }, [complete]);

  const resetAgent = useCallback(() => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    setSimState("idle");
    setAgentProgress(0);
    agentDoneTimeRef.current = null;
  }, []);

  // --- Charge session management ---
  const startCharging = useCallback(() => {
    setMode("charging");
    sessionStartRef.current = Date.now();
    resonanceSecondsRef.current = 0;
    setFluxThisSession(0);
  }, []);

  const endCharging = useCallback((isCleanExit: boolean) => {
    const durationMs = Date.now() - sessionStartRef.current;
    const durationSeconds = Math.max(durationMs / 1000, 0.5);

    recordCharge({
      durationSeconds,
      resonanceSeconds: resonanceSecondsRef.current,
      isCleanExit,
    });

    if (isCleanExit) vibrate([25, 15, 45, 15, 80]);
    setMode("idle");
    setFluxThisSession(0);
    resonanceSecondsRef.current = 0;
  }, [recordCharge, vibrate]);

  // Resonance seconds accumulator
  useEffect(() => {
    if (mode !== "charging") return;
    const interval = setInterval(() => {
      if (resonanceLevel > 0.5) {
        resonanceSecondsRef.current += 0.5;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [mode, resonanceLevel]);

  // Flux tick callback from mechanics
  const onFluxTick = useCallback((resonanceActive: boolean) => {
    if (mode !== "charging") return;
    const base = 10 * state.lineageMultiplier;
    const bonus = resonanceActive ? base * 1.5 : 0;
    setFluxThisSession((f) => f + Math.round(base + bonus));
  }, [mode, state.lineageMultiplier]);

  // Detect clean exit: user manually stops charging within 5s of agent done
  const handleStopCharging = useCallback(() => {
    const agentDone = agentDoneTimeRef.current;
    const isClean = agentDone !== null && Date.now() - agentDone < 5000;
    endCharging(isClean);
  }, [endCharging]);

  // Ship confirm
  const handleShipAttempt = useCallback(() => {
    if (state.stage === "shipping") setShowShipConfirm(true);
  }, [state.stage]);

  const confirmShip = useCallback(() => {
    ship();
    setShowShipConfirm(false);
    setMode("idle");
    vibrate([50, 30, 80, 30, 150]);
  }, [ship, vibrate]);

  // Format uptime
  const uptimeLabel = state.uptime === 0
    ? "up 0d"
    : `up ${state.uptime}d`;

  return (
    <main className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Dream Wake overlay ── */}
      {showDreamWake && <DreamWake state={state} onDismiss={dismissDream} />}

      {/* ── Shelf modal ── */}
      {showShelf && (
        <div
          className="fixed inset-0 z-40 flex flex-col"
          style={{ background: "rgba(2,2,6,0.97)" }}
          onClick={() => setShowShelf(false)}
        >
          <div className="px-6 pt-8 pb-4">
            <p className="font-mono text-xs tracking-widest" style={{ color: hueColor }}>shelf</p>
            <p className="font-mono text-[9px] text-gray-600 tracking-widest mt-1">compiled daemons</p>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-8">
            {state.shelf.length === 0 ? (
              <p className="font-mono text-[10px] text-gray-700 tracking-widest mt-8">
                no compiled daemons yet.<br />
                ship your first to start a lineage.
              </p>
            ) : (
              state.shelf.map((entry) => (
                <div
                  key={entry.generation}
                  className="mb-4 p-4 rounded-xl"
                  style={{ background: `hsla(${entry.hue}, 40%, 8%, 0.8)`, border: `1px solid hsla(${entry.hue}, 40%, 20%, 0.4)` }}
                >
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: `hsl(${entry.hue}, 70%, 60%)` }}>
                    gen {entry.generation} · grade {entry.resonanceGrade}
                  </p>
                  <p className="font-mono text-[9px] text-gray-500 tracking-widest mt-1">
                    {formatFlux(entry.totalFlux)} flux · {entry.uptime}d uptime
                    {entry.traits.nocturnal && " · nocturnal"}
                    {entry.traits.quicksilver && " · quicksilver"}
                    {entry.traits.resonant && " · resonant"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Ship confirm ── */}
      {showShipConfirm && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center px-8"
          style={{ background: "rgba(2,2,6,0.97)" }}>
          <p className="font-mono text-sm tracking-widest text-white mb-2">compile daemon?</p>
          <p className="font-mono text-[10px] text-gray-500 tracking-widest mb-6 text-center">
            your daemon crystallizes to the shelf.<br/>a new egg inherits your lineage.
          </p>
          <div className="flex gap-4">
            <button onClick={() => setShowShipConfirm(false)}
              className="font-mono text-xs px-5 py-2 rounded-xl"
              style={{ background: "#0d0d1a", border: "1px solid #1a1a2a", color: "#555" }}>
              cancel
            </button>
            <button onClick={confirmShip}
              className="font-mono text-xs px-5 py-2 rounded-xl"
              style={{ background: `hsl(${state.hue}, 50%, 12%)`, border: `1px solid hsl(${state.hue}, 50%, 30%)`, color: hueColor }}>
              ship it ◉
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="shrink-0 flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <p className="font-mono text-[10px] tracking-widest" style={{ color: hueColorDim }}>
            flux: {formatFlux(state.flux)}
            {fluxThisSession > 0 && (
              <span className="ml-1.5 animate-fade-in" style={{ color: hueColor }}>
                +{formatFlux(fluxThisSession)}
              </span>
            )}
          </p>
          <p className="font-mono text-[9px] tracking-widest mt-0.5" style={{ color: "#2a2a40" }}>
            {state.isHibernating ? "hibernating" : uptimeLabel}
            {state.consecutiveCleanExits > 1 && (
              <span className="ml-2" style={{ color: hueColorDim }}>
                ↗ {state.consecutiveCleanExits} clean
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Shard count */}
          {state.shards.length > 0 && (
            <span className="font-mono text-[9px] tracking-widest" style={{ color: "#33334a" }}>
              {state.shards.length} shards
            </span>
          )}
          {/* Shelf button */}
          <button
            onClick={() => setShowShelf(true)}
            className="font-mono text-[10px] tracking-widest px-2.5 py-1 rounded-lg"
            style={{ color: "#33334a", border: "1px solid #141422", background: "transparent" }}
          >
            ≡
          </button>
        </div>
      </header>

      {/* ── Stage progress bar ── */}
      <div className="px-5 mb-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#1e1e2e" }}>
            {STAGE_LABELS[state.stage]}
          </p>
          {state.stage === "shipping" && (
            <button
              onClick={handleShipAttempt}
              className="font-mono text-[9px] tracking-widest"
              style={{ color: hueColor }}
            >
              compile ↑
            </button>
          )}
        </div>
        <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "#0c0c1a" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${stagePct * 100}%`,
              background: hueColor,
              boxShadow: `0 0 6px ${hueColor}88`,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* ── DAEMON CREATURE ── */}
      <div
        className="shrink-0 relative"
        style={{
          height: mode === "charging" ? "35vh" : "48vh",
          transition: "height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <DaemonCreature
          stage={state.stage}
          hue={state.hue}
          isCharging={mode === "charging"}
          resonanceLevel={resonanceLevel}
          flux={state.totalFluxEarned}
          isHibernating={state.isHibernating}
          onClick={mode === "idle" ? startCharging : handleStopCharging}
        />

        {/* Clean exit flash */}
        {showCleanExit && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none animate-clean-exit"
          >
            <p className="font-mono text-xs tracking-widest" style={{ color: hueColor }}>
              ↗ clean exit
            </p>
          </div>
        )}

        {/* Gen / lineage badge */}
        <div className="absolute top-2 right-4 text-right">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#1c1c2c" }}>
            gen {state.generation}
            {state.generation > 1 && ` ×${state.lineageMultiplier.toFixed(2)}`}
          </p>
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#1c1c2c" }}>
            grade {state.resonanceGrade}
          </p>
        </div>
      </div>

      {/* ── CHARGE ZONE ── */}
      <div
        className="flex-1 min-h-0 flex flex-col"
        style={{ transition: "opacity 0.3s ease", opacity: mode === "charging" ? 1 : 0.5 }}
      >
        {/* Agent sim / session control */}
        <div className="px-5 mb-2 shrink-0">
          {mode === "idle" && (
            <button
              onClick={startCharging}
              className="w-full font-mono text-[10px] py-2 rounded-xl tracking-widest"
              style={{
                background: `hsl(${state.hue}, 40%, 8%)`,
                border: `1px solid hsl(${state.hue}, 40%, 16%)`,
                color: hueColorDim,
              }}
            >
              ▶ tap daemon or here to charge
            </button>
          )}

          {mode === "charging" && (
            <div className="animate-slide-up">
              {simState === "idle" && (
                <div className="flex gap-2">
                  <button
                    onClick={startAgent}
                    className="flex-1 font-mono text-[10px] py-2 rounded-xl tracking-widest"
                    style={{ background: `hsl(${state.hue}, 40%, 8%)`, border: `1px solid hsl(${state.hue}, 40%, 16%)`, color: hueColorDim }}
                  >
                    ▶ simulate agent
                  </button>
                  <button
                    onClick={handleStopCharging}
                    className="font-mono text-[10px] py-2 px-4 rounded-xl tracking-widest"
                    style={{ background: "#0a0a14", border: "1px solid #1a1a24", color: "#33334a" }}
                  >
                    stop
                  </button>
                </div>
              )}

              {simState === "running" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-mono text-[9px] tracking-widest" style={{ color: hueColorDim }}>
                      agent coding…
                    </p>
                    <p className="font-mono text-[9px]" style={{ color: hueColor }}>
                      {Math.round(agentProgress)}%
                    </p>
                  </div>
                  <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "#0d0d1a" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${agentProgress}%`,
                        background: hueColor,
                        boxShadow: `0 0 8px ${hueColor}88`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              {simState === "done" && (
                <button
                  onClick={() => { handleStopCharging(); resetAgent(); }}
                  className="w-full font-mono text-[10px] py-2 rounded-xl tracking-widest animate-fade-in"
                  style={{ background: `hsl(${state.hue}, 40%, 8%)`, border: `1px solid hsl(${state.hue}, 40%, 22%)`, color: hueColor }}
                >
                  ✓ done — stop charging (clean exit)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mechanic selector tabs */}
        <div className="px-5 flex gap-1.5 mb-3 shrink-0">
          {MECHANICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMechanic(m.id)}
              className="flex-1 font-mono text-[9px] py-1.5 rounded-lg tracking-widest"
              style={{
                background: mechanic === m.id ? `hsl(${state.hue}, 40%, 9%)` : "transparent",
                border: mechanic === m.id
                  ? `1px solid hsl(${state.hue}, 40%, 18%)`
                  : "1px solid #0d0d18",
                color: mechanic === m.id ? hueColor : "#1e1e30",
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {/* Active mechanic */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          {mechanic === "spin" && (
            <ChargeSpin
              color={hueColor}
              onFluxTick={onFluxTick}
              onResonanceChange={setResonanceLevel}
              agentProgress={agentProgress}
            />
          )}
          {mechanic === "pop" && (
            <PopCascade
              progress={agentProgress}
              color={hueColor}
              isActive={mode === "charging"}
            />
          )}
          {mechanic === "flow" && (
            <LiquidScrub
              progress={agentProgress}
              color={hueColor}
              isActive={mode === "charging"}
            />
          )}
          {mechanic === "beads" && (
            <WorryBeads
              progress={agentProgress}
              color={hueColor}
              isActive={mode === "charging"}
            />
          )}
        </div>
      </div>

      {/* ── FOOTER STATUS ── */}
      <div
        className="shrink-0 px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid #0c0c18" }}
      >
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#1c1c2c" }}>
          {state.chargeSessions} sessions · {state.cleanExits} clean exits
        </p>
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#1c1c2c" }}>
          {state.shards.length > 0
            ? state.shards[state.shards.length - 1].emoji + " " + state.shards[state.shards.length - 1].name
            : "no shards yet"}
        </p>
      </div>
    </main>
  );
}
