"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { MiniGameResult } from "@/lib/genome";

interface Props {
  difficulty: number;
  embryoFlux: number;
  onComplete: (result: MiniGameResult) => void;
}

const TOTAL_BEATS = 12;
const BPM_BASE = 60;

export default function PulseSync({ difficulty, embryoFlux, onComplete }: Props) {
  const bpm = BPM_BASE + difficulty * 40;
  const beatInterval = 60000 / bpm;
  const [beatIndex, setBeatIndex] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);
  const [score, setScore] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; good: boolean }[]>([]);
  const [done, setDone] = useState(false);
  const nextBeatRef = useRef<number | null>(null);
  const beatIndexRef = useRef(0);
  const timestampsRef = useRef<number[]>([]);
  const accuraciesRef = useRef<number[]>([]);
  const rippleIdRef = useRef(0);
  const hue = 40 + embryoFlux * 120;
  const onCompleteRef = useRef<Props["onComplete"]>(null!);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    if (done) return;
    const start = performance.now();
    nextBeatRef.current = start;

    const tick = () => {
      const now = performance.now();
      if (nextBeatRef.current === null) return;
      if (now >= nextBeatRef.current) {
        nextBeatRef.current += beatInterval;
        beatIndexRef.current++;
        setBeatIndex(bi => bi + 1);
        // Pulse animation
        setPulseScale(1.25);
        setTimeout(() => setPulseScale(1), 150);

        if (beatIndexRef.current >= TOTAL_BEATS) {
          setDone(true);
          const accs = accuraciesRef.current;
          const avgAcc = accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : 0;
          onCompleteRef.current({
            gameId: "pulse",
            score: avgAcc,
            rawValue: bpm * avgAcc,
            timestamps: timestampsRef.current,
          });
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    let rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [beatInterval, done, bpm]);

  const handleTap = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (done || nextBeatRef.current === null) return;
    const now = performance.now();
    timestampsRef.current.push(now);

    const distToNext = Math.abs(now - nextBeatRef.current);
    const distToPrev = Math.abs(now - (nextBeatRef.current - beatInterval));
    const closestDist = Math.min(distToNext, distToPrev);
    const window = beatInterval * 0.3;
    const accuracy = Math.max(0, 1 - closestDist / window);
    accuraciesRef.current.push(accuracy);
    setScore(accuraciesRef.current.reduce((a, b) => a + b, 0) / accuraciesRef.current.length);

    const id = rippleIdRef.current++;
    setRipples(prev => [...prev.slice(-5), { id, good: accuracy > 0.6 }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
  }, [done, beatInterval]);

  const progress = beatIndex / TOTAL_BEATS;
  const bars = Math.round(progress * 12);

  return (
    <div className="flex flex-col items-center w-full h-full gap-4">
      <p className="font-mono text-[10px] tracking-widest text-center" style={{ color: "#44445a" }}>
        tap with the pulse
      </p>

      <div
        className="relative flex items-center justify-center no-select"
        style={{ width: 140, height: 140, cursor: "pointer", touchAction: "none" }}
        onPointerDown={handleTap}
      >
        {/* Ripples */}
        {ripples.map(r => (
          <div
            key={r.id}
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              border: `2px solid hsl(${r.good ? hue : 0}, ${r.good ? 80 : 60}%, 60%)`,
              animation: "rippleOut 0.6s ease-out forwards",
            }}
          />
        ))}

        {/* Main circle */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 100,
            height: 100,
            background: `radial-gradient(circle, hsl(${hue}, 50%, 20%) 0%, hsl(${hue}, 60%, 8%) 100%)`,
            border: `2px solid hsl(${hue}, 60%, 35%)`,
            boxShadow: `0 0 ${12 + score * 20}px hsl(${hue}, 80%, 45%)`,
            transform: `scale(${pulseScale})`,
            transition: "transform 0.15s ease",
          }}
        >
          <span className="font-mono text-[11px]" style={{ color: `hsl(${hue}, 70%, 60%)` }}>
            {beatIndex}/{TOTAL_BEATS}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="font-mono text-[9px] tracking-widest" style={{ color: "#2a2a3a" }}>
        sync [{("█".repeat(Math.round(score * 10)) + "░".repeat(10 - Math.round(score * 10))).slice(0, 10)}]
      </div>

      <div className="font-mono text-[9px] tracking-widest" style={{ color: "#1a1a2a" }}>
        {"░".repeat(12 - bars) + "█".repeat(bars)}
      </div>

      <style>{`
        @keyframes rippleOut {
          from { opacity: 0.8; transform: scale(0.7); }
          to   { opacity: 0; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
