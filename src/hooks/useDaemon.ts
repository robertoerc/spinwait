"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  DaemonState,
  loadState,
  saveState,
  processWakeUp,
  collectDream,
  applyCharge,
  shipDaemon,
  defaultState,
} from "@/lib/daemon";

export type DreamPhase = "sleeping" | "waking" | "awake";

export function useDaemon() {
  const [state, setState] = useState<DaemonState>(defaultState);
  const [dreamPhase, setDreamPhase] = useState<DreamPhase>("sleeping");
  const [showDreamWake, setShowDreamWake] = useState(false);
  const [lastCleanExit, setLastCleanExit] = useState(false);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load + wake up on mount
  useEffect(() => {
    const loaded = loadState();
    const woken = processWakeUp(loaded);
    setState(woken);

    if (woken.dreamFluxPending > 0 || woken.pendingShard) {
      setShowDreamWake(true);
    }
  }, []);

  // Debounced save
  const persistState = useCallback((s: DaemonState) => {
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => saveState(s), 800);
  }, []);

  const update = useCallback(
    (fn: (prev: DaemonState) => DaemonState) => {
      setState((prev) => {
        const next = fn(prev);
        persistState(next);
        return next;
      });
    },
    [persistState]
  );

  const dismissDream = useCallback(() => {
    update(collectDream);
    setShowDreamWake(false);
  }, [update]);

  const recordCharge = useCallback(
    (opts: {
      durationSeconds: number;
      resonanceSeconds: number;
      isCleanExit: boolean;
    }) => {
      setLastCleanExit(opts.isCleanExit);
      update((s) => applyCharge(s, opts));
    },
    [update]
  );

  const ship = useCallback(() => {
    update(shipDaemon);
  }, [update]);

  const setGenome = useCallback((genome: string) => {
    update(s => ({ ...s, genome, hatched: true, stage: "egg" }));
  }, [update]);

  // Save lastCloseTime on unmount/blur
  useEffect(() => {
    const onBlur = () => {
      setState((s) => {
        const next = { ...s, lastCloseTime: Date.now() };
        saveState(next);
        return next;
      });
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("beforeunload", onBlur);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBlur);
    };
  }, []);

  return {
    state,
    dreamPhase,
    showDreamWake,
    lastCleanExit,
    dismissDream,
    recordCharge,
    ship,
    setGenome,
  };
}
