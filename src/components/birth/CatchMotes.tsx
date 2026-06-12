"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { MiniGameResult } from "@/lib/genome";

interface Props {
  difficulty: number;
  embryoFlux: number;
  onComplete: (result: MiniGameResult) => void;
}

interface Mote {
  id: number;
  x: number;
  y: number;
  size: number;
  born: number;
  lifetime: number;
  hue: number;
  caught: boolean;
}

const TOTAL_MOTES = 14;

export default function CatchMotes({ difficulty, embryoFlux, onComplete }: Props) {
  const [motes, setMotes] = useState<Mote[]>([]);
  const [caught, setCaught] = useState(0);
  const [spawned, setSpawned] = useState(0);
  const [done, setDone] = useState(false);
  const spawnedRef = useRef(0);
  const caughtRef = useRef(0);
  const timestampsRef = useRef<number[]>([]);
  const moteIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hue = 40 + embryoFlux * 120;
  const onCompleteRef = useRef<Props["onComplete"]>(null!);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Spawn motes
  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      if (spawnedRef.current >= TOTAL_MOTES) {
        clearInterval(interval);
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      const id = moteIdRef.current++;
      const lifetime = (1.8 - difficulty * 0.6) * 1000;
      const m: Mote = {
        id,
        x: 20 + Math.random() * (width - 40),
        y: 20 + Math.random() * (height - 80),
        size: 16 + Math.random() * 18,
        born: performance.now(),
        lifetime,
        hue: hue + (Math.random() - 0.5) * 60,
        caught: false,
      };
      setMotes(prev => [...prev, m]);
      spawnedRef.current++;
      setSpawned(s => s + 1);

      // Auto-expire
      setTimeout(() => {
        setMotes(prev => prev.filter(m2 => m2.id !== id));
      }, lifetime + 50);
    }, 600 - difficulty * 200);

    return () => clearInterval(interval);
  }, [difficulty, done, hue]);

  // Fade opacity based on lifetime
  useEffect(() => {
    let rafId: number;
    const update = () => {
      const now = performance.now();
      setMotes(prev => prev.map(m => m));  // trigger re-render for CSS animations
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Finish when all spawned + a grace period
  useEffect(() => {
    if (spawned < TOTAL_MOTES) return;
    const timer = setTimeout(() => {
      if (!done) {
        setDone(true);
        const score = caughtRef.current / TOTAL_MOTES;
        onCompleteRef.current({
          gameId: "motes",
          score,
          rawValue: caughtRef.current,
          timestamps: timestampsRef.current,
        });
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [spawned, done]);

  const catchMote = useCallback((id: number, e: React.PointerEvent) => {
    e.stopPropagation();
    if (done) return;
    timestampsRef.current.push(performance.now());
    caughtRef.current++;
    setCaught(c => c + 1);
    setMotes(prev => prev.map(m => m.id === id ? { ...m, caught: true } : m));
    setTimeout(() => setMotes(prev => prev.filter(m => m.id !== id)), 200);
  }, [done]);

  const progress = spawned / TOTAL_MOTES;

  return (
    <div className="flex flex-col items-center w-full h-full gap-2">
      <p className="font-mono text-[10px] tracking-widest text-center" style={{ color: "#44445a" }}>
        catch the motes before they fade
      </p>

      <div
        ref={containerRef}
        className="relative w-full flex-1 rounded-xl overflow-hidden"
        style={{ background: "#04040a", border: "1px solid #0e0e1e" }}
      >
        {motes.map(m => {
          const age = (performance.now() - m.born) / m.lifetime;
          const opacity = m.caught ? 0 : Math.max(0, 1 - age);
          return (
            <div
              key={m.id}
              style={{
                position: "absolute",
                left: m.x - m.size / 2,
                top: m.y - m.size / 2,
                width: m.size,
                height: m.size,
                borderRadius: "50%",
                background: `radial-gradient(circle, hsl(${m.hue}, 80%, 70%) 0%, hsl(${m.hue}, 70%, 50%) 60%, transparent 100%)`,
                boxShadow: `0 0 ${m.size * 0.6}px hsl(${m.hue}, 80%, 55%)`,
                opacity,
                cursor: "pointer",
                transition: m.caught ? "opacity 0.2s ease" : "none",
                touchAction: "none",
              }}
              onPointerDown={e => catchMote(m.id, e)}
            />
          );
        })}
      </div>

      <div className="font-mono text-[9px] tracking-widest flex gap-4" style={{ color: "#2a2a3a" }}>
        <span>caught [{caught.toString().padStart(2, "·")}/{TOTAL_MOTES}]</span>
      </div>
    </div>
  );
}
