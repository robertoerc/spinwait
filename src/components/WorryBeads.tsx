"use client";
import { useState, useCallback } from "react";
import { useHaptics } from "@/hooks/useHaptics";

interface Props {
  progress: number;
  color: string;
  isActive: boolean;
}

const BEAD_COUNT = 12;
const BEAD_SIZE = 42;
const GAP = 12; // gap between beads

// Slight arc: beads curve up in the middle
function beadY(i: number): number {
  const norm = i / (BEAD_COUNT - 1); // 0..1
  return Math.sin(norm * Math.PI) * 28; // max 28px arc
}

export default function WorryBeads({ color, isActive }: Props) {
  const [bouncing, setBouncing] = useState<Set<number>>(new Set());
  const { beadTap } = useHaptics();

  const handleBead = useCallback(
    (i: number) => {
      if (bouncing.has(i)) return;
      beadTap();
      setBouncing((prev) => new Set(prev).add(i));
      setTimeout(() => {
        setBouncing((prev) => {
          const next = new Set(prev);
          next.delete(i);
          return next;
        });
      }, 460);
    },
    [bouncing, beadTap]
  );

  const totalWidth = BEAD_COUNT * BEAD_SIZE + (BEAD_COUNT - 1) * GAP;

  // Build SVG string path through bead centers
  const beadCenters = Array.from({ length: BEAD_COUNT }, (_, i) => ({
    x: i * (BEAD_SIZE + GAP) + BEAD_SIZE / 2,
    y: 80 - beadY(i),
  }));

  const pathD = beadCenters
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  return (
    <div className="w-full h-full flex flex-col items-center justify-center no-select px-4">
      <div className="relative" style={{ width: totalWidth, height: 160 }}>
        {/* String/chain */}
        <svg
          className="absolute inset-0"
          width={totalWidth}
          height={160}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          {/* Shadow string */}
          <path
            d={pathD}
            fill="none"
            stroke="#0a0a14"
            strokeWidth={5}
            strokeLinecap="round"
          />
          {/* Main string */}
          <path
            d={pathD}
            fill="none"
            stroke={`${color}30`}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </svg>

        {/* Beads */}
        {beadCenters.map((center, i) => {
          const isBouncing = bouncing.has(i);
          // Subtle hue shift per bead
          const opacity = 0.7 + (i % 3) * 0.1;

          return (
            <button
              key={i}
              className={isBouncing ? "bead-bouncing" : ""}
              onPointerDown={(e) => {
                e.preventDefault();
                handleBead(i);
              }}
              style={{
                position: "absolute",
                width: BEAD_SIZE,
                height: BEAD_SIZE,
                left: center.x - BEAD_SIZE / 2,
                top: center.y - BEAD_SIZE / 2,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: `radial-gradient(circle at 38% 30%, ${color}ee, ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")})`,
                boxShadow: [
                  "inset 0 2px 5px rgba(255,255,255,0.3)",
                  "inset 0 -3px 6px rgba(0,0,0,0.35)",
                  `0 4px 12px ${color}44`,
                  `0 1px 3px rgba(0,0,0,0.5)`,
                ].join(", "),
                outline: "none",
                WebkitTapHighlightColor: "transparent",
                touchAction: "none",
                zIndex: 2,
              }}
              aria-label={`bead ${i + 1}`}
            >
              {/* Specular highlight */}
              <div
                style={{
                  position: "absolute",
                  top: "16%",
                  left: "24%",
                  width: "32%",
                  height: "22%",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.5)",
                  transform: "rotate(-25deg)",
                  pointerEvents: "none",
                }}
              />
            </button>
          );
        })}
      </div>

      <p
        className="text-xs font-mono mt-8 tracking-widest"
        style={{ color: isActive ? color : "#33334a" }}
      >
        {isActive ? "tap each bead" : "tap the beads"}
      </p>
    </div>
  );
}
