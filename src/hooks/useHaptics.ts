"use client";
import { useCallback, useEffect, useRef } from "react";

type Pattern = number | number[];

export function useHaptics() {
  const supported = useRef(false);

  useEffect(() => {
    supported.current =
      typeof navigator !== "undefined" && "vibrate" in navigator;
  }, []);

  const vibrate = useCallback((pattern: Pattern) => {
    if (supported.current) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // silently ignore
      }
    }
  }, []);

  const pop = useCallback(() => vibrate(14), [vibrate]);
  const detent = useCallback(() => vibrate(8), [vibrate]);
  const complete = useCallback(() => vibrate([25, 15, 45, 15, 80]), [vibrate]);
  const beadTap = useCallback(() => vibrate(12), [vibrate]);
  const fluidDrag = useCallback(() => vibrate(6), [vibrate]);

  return { vibrate, pop, detent, complete, beadTap, fluidDrag, supported: supported.current };
}
