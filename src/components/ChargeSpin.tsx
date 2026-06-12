"use client";
import { useRef, useEffect, useCallback } from "react";
import { useHaptics } from "@/hooks/useHaptics";

interface Props {
  progress: number;
  color: string;
  isActive: boolean;
}

export default function ChargeSpin({ progress, color, isActive }: Props) {
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
  const { detent } = useHaptics();

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

    // Glow proportional to speed
    const spd = Math.min(Math.abs(velocity.current) * 60, 1);
    if (glowRef.current) {
      glowRef.current.style.opacity = String(0.15 + spd * 0.6);
      glowRef.current.style.transform = `scale(${1 + spd * 0.15})`;
    }

    // Haptic detents — 12 per revolution
    const DETENTS = 12;
    const period = (2 * Math.PI) / DETENTS;
    const det = Math.floor(angle.current / period);
    if (det !== prevDetent.current && Math.abs(velocity.current) > 0.018) {
      detent();
      prevDetent.current = det;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [detent]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      prevPtrAngle.current = getPtrAngle(e.clientX, e.clientY);
      prevTime.current = performance.now();
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    [getPtrAngle]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
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
    },
    [getPtrAngle]
  );

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const SIZE = 280;
  const R = 132;
  const circ = 2 * Math.PI * R;
  const dashOffset = circ * (1 - Math.min(progress, 100) / 100);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center no-select"
      style={{ touchAction: "none", cursor: "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        {/* Ambient glow behind disc */}
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-full transition-none"
          style={{
            background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
            opacity: 0.15,
            transition: "none",
          }}
        />

        {/* Progress ring */}
        <svg
          className="absolute inset-0"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#1a1a2a"
            strokeWidth={3}
          />
          {/* Fill */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.5s ease",
              filter: `drop-shadow(0 0 5px ${color})`,
            }}
          />
        </svg>

        {/* The spinning disc */}
        <div
          ref={discRef}
          className="rounded-full flex items-center justify-center relative"
          style={{
            width: 220,
            height: 220,
            background:
              "radial-gradient(circle at 36% 30%, #1e2540, #080810)",
            boxShadow: [
              "inset 0 2px 8px rgba(255,255,255,0.07)",
              "inset 0 -4px 12px rgba(0,0,0,0.7)",
              `0 0 24px ${color}28`,
              `0 0 60px ${color}0e`,
            ].join(", "),
          }}
        >
          {/* 6 grip bars */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                width: 3,
                height: 26,
                borderRadius: 2,
                background: `linear-gradient(${color}55, ${color}15)`,
                transform: `rotate(${deg}deg) translateY(-78px)`,
                transformOrigin: "center center",
              }}
            />
          ))}

          {/* Inner ring accent */}
          <div
            style={{
              position: "absolute",
              width: 170,
              height: 170,
              borderRadius: "50%",
              border: `1px solid ${color}18`,
            }}
          />

          {/* Center hub */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #2a3555, #08080f)",
              boxShadow: `0 0 14px ${color}50, inset 0 1px 4px rgba(255,255,255,0.1)`,
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {/* Status label */}
      <p
        className="text-xs font-mono mt-6 tracking-widest transition-colors duration-300"
        style={{ color: isActive ? color : "#33334a" }}
      >
        {isActive
          ? `compiling… ${Math.round(Math.min(progress, 100))}%`
          : "drag to spin"}
      </p>
    </div>
  );
}
