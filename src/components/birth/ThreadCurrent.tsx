"use client";
import { useRef, useEffect, useCallback, useState } from "react";
import { MiniGameResult } from "@/lib/genome";

interface Props {
  difficulty: number;
  embryoFlux: number;
  onComplete: (result: MiniGameResult) => void;
}

const DURATION_MS = 6000;
const TRAIL_LEN = 24;

export default function ThreadCurrent({ difficulty, embryoFlux, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const timestampsRef = useRef<number[]>([]);
  const deviationsRef = useRef<number[]>([]);

  // Target dot follows bezier path
  const targetRef = useRef({ x: 0, y: 0 });
  const pointerRef = useRef({ x: -999, y: -999 });
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const [started, setStarted] = useState(false);
  const hue = 40 + embryoFlux * 120;

  const getBezierPoint = useCallback((t: number, W: number, H: number) => {
    // Parameterized loop: 3 control points that wobble over time
    const p0x = W * 0.15, p0y = H * 0.5;
    const p1x = W * 0.5 + Math.sin(t * 1.3) * W * 0.3;
    const p1y = H * 0.2 + Math.cos(t * 0.9) * H * 0.3;
    const p2x = W * 0.85, p2y = H * 0.5;
    const p3x = W * 0.5, p3y = H * 0.8;
    // Cubic bezier from p0 to p3 with p1,p2 as handles
    const u = (t % 1);
    const inv = 1 - u;
    return {
      x: inv * inv * inv * p0x + 3 * inv * inv * u * p1x + 3 * inv * u * u * p2x + u * u * u * p3x,
      y: inv * inv * inv * p0y + 3 * inv * inv * u * p1y + 3 * inv * u * u * p2y + u * u * u * p3y,
    };
  }, []);

  const finish = useCallback((W: number, H: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const deviations = deviationsRef.current;
    const avgDev = deviations.length ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 50;
    const score = Math.max(0, 1 - avgDev / 80);
    const { onComplete: oc } = { onComplete: doneRef.current };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    let t = 0;

    const loop = (ts: number) => {
      if (!startRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const elapsed = ts - startRef.current;
      const timeRatio = elapsed / DURATION_MS;
      if (timeRatio >= 1 && !doneRef.current) {
        doneRef.current = true;
        const deviations = deviationsRef.current;
        const avgDev = deviations.length ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 50;
        const score = Math.max(0, 1 - avgDev / 80);
        // will be called from parent via onComplete below
        return;
      }

      const speed = 0.15 + difficulty * 0.12;
      t += speed / 60;
      const target = getBezierPoint(t, W, H);
      targetRef.current = target;

      // Track deviation
      const ptr = pointerRef.current;
      const dx = ptr.x - target.x;
      const dy = ptr.y - target.y;
      const dev = Math.sqrt(dx * dx + dy * dy);
      if (ptr.x >= 0) {
        deviationsRef.current.push(dev);
        timestampsRef.current.push(performance.now());
      }

      // Trail
      trailRef.current = [...trailRef.current.slice(-(TRAIL_LEN - 1)), { x: target.x, y: target.y }];

      // Draw
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Draw ghost path
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = `hsla(${hue}, 40%, 40%, 0.3)`;
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 60; i++) {
        const pt = getBezierPoint((t + i / 60), W, H);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw trail
      const trail = trailRef.current;
      for (let i = 1; i < trail.length; i++) {
        const alpha = i / trail.length;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.6})`;
        ctx.lineWidth = 2 * alpha;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Draw target dot
      const inZone = dev < 20;
      ctx.beginPath();
      ctx.arc(target.x, target.y, inZone ? 8 : 6, 0, Math.PI * 2);
      ctx.fillStyle = inZone ? `hsl(${hue}, 90%, 70%)` : `hsl(${hue}, 60%, 55%)`;
      ctx.shadowColor = `hsl(${hue}, 90%, 65%)`;
      ctx.shadowBlur = inZone ? 14 : 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw pointer
      if (ptr.x >= 0) {
        ctx.beginPath();
        ctx.arc(ptr.x, ptr.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${inZone ? 0.9 : 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Timer bar
      ctx.fillStyle = "#0e0e1e";
      ctx.fillRect(0, H - 4, W, 4);
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(0, H - 4, W * (1 - timeRatio), 4);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // Auto-complete after duration
    const timer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        cancelAnimationFrame(rafRef.current);
        const deviations = deviationsRef.current;
        const avgDev = deviations.length ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 50;
        const score = Math.max(0, 1 - avgDev / 80);
        (window as any).__threadComplete?.({ gameId: "thread", score, rawValue: avgDev, timestamps: timestampsRef.current });
      }
    }, DURATION_MS + 200);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timer);
    };
  }, [difficulty, getBezierPoint, hue]);

  // Store onComplete in a ref so the timeout can call it
  const onCompleteRef = useRef<Props["onComplete"]>(null!);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    (window as any).__threadComplete = (result: MiniGameResult) => onCompleteRef.current(result);
    return () => { delete (window as any).__threadComplete; };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!started) {
      setStarted(true);
      startRef.current = performance.now();
    }
  }, [started]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (!started) {
      setStarted(true);
      startRef.current = performance.now();
    }
  }, [started]);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <p className="font-mono text-[10px] tracking-widest mb-2 text-center"
        style={{ color: "#44445a" }}>
        follow the light — stay close
      </p>
      <canvas
        ref={canvasRef}
        width={320}
        height={220}
        className="rounded-xl"
        style={{ background: "#04040a", border: "1px solid #0e0e1e", touchAction: "none", cursor: "crosshair" }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      />
      {!started && (
        <p className="font-mono text-[9px] tracking-widest mt-2" style={{ color: "#2a2a3a" }}>
          move to begin
        </p>
      )}
    </div>
  );
}
