"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { useHaptics } from "@/hooks/useHaptics";

interface Props {
  color: string;
  onFluxTick: (resonanceActive: boolean) => void;
  onResonanceChange: (level: number) => void;
  agentProgress: number;
}

// Resonance sweet spot: 0.050 – 0.095 rad/frame
const RESONANCE_LO = 0.048;
const RESONANCE_HI = 0.098;

export default function ChargeSpin({ color, onFluxTick, onResonanceChange, agentProgress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const velocity = useRef(0);
  const prevPtrAngle = useRef(0);
  const prevTime = useRef(0);
  const isDragging = useRef(false);
  const rafRef = useRef<number>(0);
  const prevDetent = useRef(0);
  const resonanceTimeRef = useRef(0); // frames in the zone
  const RESONANCE_BUILD = 0.008; // per frame to reach 1.0
  const RESONANCE_DECAY = 0.03;
  const resonanceLevelRef = useRef(0);
  const [resonanceDisplay, setResonanceDisplay] = useState(0);
  const [inZone, setInZone] = useState(false);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { detent, vibrate } = useHaptics();

  const getPtrAngle = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2));
  }, []);

  const animate = useCallback(() => {
    if (!isDragging.current) {
      velocity.current *= 0.984;
      if (Math.abs(velocity.current) < 0.0002) velocity.current = 0;
    }
    angle.current += velocity.current;

    if (discRef.current) {
      discRef.current.style.transform = `rotate(${angle.current}rad)`;
    }

    const spd = Math.abs(velocity.current);

    // Resonance zone check
    const inResonance = spd >= RESONANCE_LO && spd <= RESONANCE_HI;
    if (inResonance) {
      resonanceLevelRef.current = Math.min(resonanceLevelRef.current + RESONANCE_BUILD, 1);
    } else {
      resonanceLevelRef.current = Math.max(resonanceLevelRef.current - RESONANCE_DECAY, 0);
    }
    const rl = resonanceLevelRef.current;

    // Glow
    if (glowRef.current) {
      const baseGlow = spd * 60;
      const resonanceGlow = rl * 0.7;
      glowRef.current.style.opacity = String(Math.min(0.15 + baseGlow + resonanceGlow, 0.9));
      // Shift color toward gold at full resonance
      if (rl > 0.8) {
        glowRef.current.style.background = `radial-gradient(circle, rgba(255,180,0,0.6) 0%, ${color}44 40%, transparent 70%)`;
      } else {
        glowRef.current.style.background = `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`;
      }
    }

    // Haptic detents — 12 per revolution
    const DETENTS = 12;
    const period = (2 * Math.PI) / DETENTS;
    const det = Math.floor(angle.current / period);
    if (det !== prevDetent.current && spd > 0.018) {
      detent();
      prevDetent.current = det;
    }

    // Resonance purr at high levels (every 8 frames)
    if (rl > 0.85 && Math.floor(timeRef.current * 60) % 8 === 0) {
      vibrate(4);
    }

    setInZone(inResonance && spd > 0.01);
    onResonanceChange(rl);

    // Sync display ~10fps
    if (Math.floor(timeRef.current * 60) % 6 === 0) {
      setResonanceDisplay(rl);
    }

    timeRef.current += 0.016;
    rafRef.current = requestAnimationFrame(animate);
  }, [color, detent, vibrate, onResonanceChange]);

  const timeRef = useRef(0);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Flux ticks every second while spinning
  useEffect(() => {
    tickIntervalRef.current = setInterval(() => {
      if (Math.abs(velocity.current) > 0.01) {
        onFluxTick(resonanceLevelRef.current > 0.5);
      }
    }, 1000);
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [onFluxTick]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    prevPtrAngle.current = getPtrAngle(e.clientX, e.clientY);
    prevTime.current = performance.now();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, [getPtrAngle]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const now = performance.now();
    const dt = now - prevTime.current;
    if (dt < 1) return;
    const a = getPtrAngle(e.clientX, e.clientY);
    let delta = a - prevPtrAngle.current;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    velocity.current = (delta / dt) * 16;
    prevPtrAngle.current = a;
    prevTime.current = now;
  }, [getPtrAngle]);

  const onPointerUp = useCallback(() => { isDragging.current = false; }, []);

  const SIZE = 260;
  const R = 122;
  const circ = 2 * Math.PI * R;
  const dashOffset = circ * (1 - Math.min(agentProgress, 100) / 100);

  // Resonance bar as terminal string
  const bars = Math.round(resonanceDisplay * 10);
  const resonanceBar = "█".repeat(bars) + "░".repeat(10 - bars);
  const resonanceColor = resonanceDisplay > 0.8
    ? "#ffb000"
    : resonanceDisplay > 0.4
    ? color
    : "#333";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative flex items-center justify-center no-select"
        style={{ width: SIZE, height: SIZE, touchAction: "none", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Ambient glow */}
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`,
            opacity: 0.15,
            transform: "scale(1.3)",
            pointerEvents: "none",
          }}
        />

        {/* Progress ring SVG */}
        <svg
          className="absolute inset-0"
          width={SIZE} height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#0e0e1a" strokeWidth={3} />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.5s ease", filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>

        {/* Disc */}
        <div
          ref={discRef}
          className="rounded-full flex items-center justify-center relative"
          style={{
            width: 200, height: 200,
            background: "radial-gradient(circle at 36% 30%, #1e2540, #06060e)",
            boxShadow: [
              "inset 0 2px 8px rgba(255,255,255,0.06)",
              "inset 0 -3px 12px rgba(0,0,0,0.8)",
              `0 0 20px ${color}22`,
            ].join(", "),
          }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div key={deg} style={{
              position: "absolute", width: 2, height: 24, borderRadius: 1,
              background: `linear-gradient(${color}55, ${color}15)`,
              transform: `rotate(${deg}deg) translateY(-72px)`,
              transformOrigin: "center center",
            }} />
          ))}
          <div style={{
            position: "absolute", width: 160, height: 160, borderRadius: "50%",
            border: `1px solid ${color}16`,
          }} />
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #2a3555, #06060f)",
            boxShadow: `0 0 14px ${color}44, inset 0 1px 4px rgba(255,255,255,0.08)`,
          }} />
        </div>

        {/* Resonance zone indicator — ring flash when in zone */}
        {inZone && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `2px solid ${resonanceDisplay > 0.8 ? "#ffb000" : color}`,
              opacity: 0.6 + resonanceDisplay * 0.4,
              filter: `blur(1px) drop-shadow(0 0 6px ${resonanceDisplay > 0.8 ? "#ffb000" : color})`,
            }}
          />
        )}
      </div>

      {/* Resonance readout */}
      <div className="font-mono text-[10px] tracking-widest text-center" style={{ color: resonanceColor }}>
        resonance [{resonanceBar}]
        {resonanceDisplay > 0.8 && (
          <span className="ml-2 animate-pulse">⚡ zone</span>
        )}
      </div>

      {/* Hint */}
      <p className="font-mono text-[9px] tracking-widest" style={{ color: "#2a2a3a" }}>
        {inZone ? "hold the rhythm" : "find the sweet spot"}
      </p>
    </div>
  );
}
