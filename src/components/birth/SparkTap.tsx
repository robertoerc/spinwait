"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { MiniGameResult } from "@/lib/genome";

interface Props {
  difficulty: number; // 0-1
  embryoFlux: number; // 0-1 creature growth so far
  onComplete: (result: MiniGameResult) => void;
}

const DURATION_MS = 5000;

export default function SparkTap({ difficulty, embryoFlux, onComplete }: Props) {
  const [taps, setTaps] = useState(0);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [done, setDone] = useState(false);
  const startRef = useRef<number | null>(null);
  const timestampsRef = useRef<number[]>([]);
  const sparkIdRef = useRef(0);

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      const now = performance.now();
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const left = Math.max(0, DURATION_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(interval);
        finish();
      }
    }, 50);
    return () => clearInterval(interval);
  });

  const finish = useCallback(() => {
    if (done) return;
    setDone(true);
    const count = timestampsRef.current.length;
    const elapsed = (timestampsRef.current[count - 1] - timestampsRef.current[0]) / 1000 || 1;
    const tapsPerSec = count / elapsed;
    onComplete({
      gameId: "spark",
      score: Math.min(tapsPerSec / 12, 1),
      rawValue: tapsPerSec,
      timestamps: [...timestampsRef.current],
    });
  }, [done, onComplete]);

  const handleTap = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const now = performance.now();
    if (startRef.current === null) startRef.current = now;
    if (done) return;

    timestampsRef.current.push(now);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = sparkIdRef.current++;
    setSparks(prev => [...prev.slice(-20), { id, x, y }]);
    setTaps(t => t + 1);

    // Remove spark after animation
    setTimeout(() => setSparks(prev => prev.filter(s => s.id !== id)), 400);
  }, [done]);

  const progress = 1 - timeLeft / DURATION_MS;
  const barFill = Math.round(progress * 20);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <p className="font-mono text-[10px] tracking-widest mb-2 text-center"
        style={{ color: "#44445a" }}>
        tap — quickly — feed the signal
      </p>

      <div
        className="relative w-full flex-1 rounded-xl overflow-hidden no-select"
        style={{
          background: "#04040a",
          border: "1px solid #0e0e1e",
          cursor: "pointer",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={handleTap}
      >
        {/* Sparks */}
        {sparks.map(s => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: s.x - 16,
              top: s.y - 16,
              width: 32,
              height: 32,
              pointerEvents: "none",
              animation: "sparkBurst 0.4s ease-out forwards",
            }}
          >
            {["↗","↖","↘","↙"].map((a, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  fontSize: 10,
                  color: `hsl(${40 + embryoFlux * 120}, 90%, 65%)`,
                  transform: `translate(${[14,-14,14,-14][i]}px,${[-14,-14,14,14][i]}px)`,
                  opacity: 0,
                  animation: `sparkFly 0.35s ease-out ${i * 40}ms forwards`,
                }}
              >
                {a}
              </span>
            ))}
          </div>
        ))}

        {/* Tap count */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: "none" }}
        >
          <span
            className="font-mono font-bold"
            style={{
              fontSize: Math.min(48 + taps * 0.8, 96),
              color: `hsl(${40 + embryoFlux * 120}, 80%, 60%)`,
              textShadow: `0 0 ${8 + taps * 0.2}px hsl(${40 + embryoFlux * 120}, 80%, 60%)`,
              transition: "font-size 0.1s ease",
            }}
          >
            {taps}
          </span>
        </div>

        {/* Timer bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: "#0e0e1e" }}>
          <div
            style={{
              height: "100%",
              width: `${(timeLeft / DURATION_MS) * 100}%`,
              background: `hsl(${40 + embryoFlux * 120}, 80%, 55%)`,
              transition: "width 0.05s linear",
            }}
          />
        </div>
      </div>

      {/* Terminal readout */}
      <div className="font-mono text-[9px] tracking-widest mt-2 flex gap-4"
        style={{ color: "#2a2a3a" }}>
        <span>taps [{taps.toString().padStart(3, "·")}]</span>
        <span>time [{("█".repeat(barFill) + "░".repeat(20 - barFill)).slice(0, 10)}]</span>
      </div>

      <style>{`
        @keyframes sparkBurst { from { opacity: 1; transform: scale(0.5); } to { opacity: 0; transform: scale(1.5); } }
        @keyframes sparkFly { from { opacity: 1; transform: translate(0,0); } to { opacity: 0; } }
      `}</style>
    </div>
  );
}
