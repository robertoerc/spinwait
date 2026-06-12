"use client";
import { useState, useCallback, useRef } from "react";
import { useHaptics } from "@/hooks/useHaptics";

interface Props {
  progress: number;
  color: string;
  isActive: boolean;
}

const COLS = 6;
const ROWS = 8;
const TOTAL = COLS * ROWS;

type BubbleState = "idle" | "popping" | "growing";

function initBubbles(): BubbleState[] {
  return Array(TOTAL).fill("idle");
}

// Slight randomness in bubble sizes (stable per index)
const BUBBLE_SCALES = Array.from({ length: TOTAL }, (_, i) => {
  const seed = ((i * 7) % 13) / 13;
  return 0.82 + seed * 0.18;
});

export default function PopCascade({ color, isActive }: Props) {
  const [bubbles, setBubbles] = useState<BubbleState[]>(initBubbles);
  const refillTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const { pop } = useHaptics();

  const handlePop = useCallback(
    (i: number) => {
      setBubbles((prev) => {
        if (prev[i] !== "idle") return prev;
        const next = [...prev];
        next[i] = "popping";
        return next;
      });
      pop();

      // Clear existing refill timer if any
      const existing = refillTimers.current.get(i);
      if (existing) clearTimeout(existing);

      const t = setTimeout(() => {
        setBubbles((prev) => {
          const next = [...prev];
          next[i] = "growing";
          return next;
        });
        const t2 = setTimeout(() => {
          setBubbles((prev) => {
            const next = [...prev];
            next[i] = "idle";
            return next;
          });
          refillTimers.current.delete(i);
        }, 380);
        refillTimers.current.set(i, t2);
      }, 300);
      refillTimers.current.set(i, t);
    },
    [pop]
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center no-select px-6">
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          maxWidth: 340,
          width: "100%",
          touchAction: "none",
        }}
      >
        {bubbles.map((state, i) => {
          const scale = BUBBLE_SCALES[i];
          const popped = state === "popping";
          const growing = state === "growing";

          return (
            <button
              key={i}
              onPointerDown={(e) => {
                e.preventDefault();
                handlePop(i);
              }}
              className={`aspect-square rounded-full ${
                popped ? "pop-popping" : growing ? "pop-growing" : ""
              }`}
              style={{
                transform: `scale(${popped || growing ? 1 : scale})`,
                background: popped
                  ? "transparent"
                  : `radial-gradient(circle at 35% 30%, ${color}cc, ${color}44)`,
                boxShadow: popped
                  ? "none"
                  : [
                      `inset 0 2px 4px rgba(255,255,255,0.25)`,
                      `inset 0 -2px 5px rgba(0,0,0,0.3)`,
                      `0 3px 10px ${color}30`,
                    ].join(", "),
                border: "none",
                cursor: "pointer",
                outline: "none",
                position: "relative",
                overflow: "visible",
                touchAction: "none",
                WebkitTapHighlightColor: "transparent",
              }}
              aria-label={`bubble ${i}`}
            >
              {/* Specular highlight */}
              {state === "idle" && (
                <div
                  style={{
                    position: "absolute",
                    top: "18%",
                    left: "22%",
                    width: "30%",
                    height: "22%",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.45)",
                    transform: "rotate(-30deg)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <p
        className="text-xs font-mono mt-6 tracking-widest"
        style={{ color: isActive ? color : "#33334a" }}
      >
        {isActive ? "pop them all" : "tap to pop"}
      </p>
    </div>
  );
}
