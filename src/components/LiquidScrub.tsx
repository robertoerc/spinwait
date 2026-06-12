"use client";
import { useEffect, useRef, useCallback } from "react";

interface Props {
  progress: number;
  color: string;
  isActive: boolean;
}

const PARTICLE_COUNT = 90;
const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 2.8;
const FRICTION = 0.92;
const CENTER_PULL = 0.0004;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  opacity: number;
  hue: number; // variation around the base color
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function LiquidScrub({ color, isActive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const pointerPos = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);
  const isPointerDown = useRef(false);
  const prevDragPos = useRef<{ x: number; y: number } | null>(null);

  const initParticles = useCallback((w: number, h: number) => {
    particles.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      baseSize: 2 + Math.random() * 4,
      opacity: 0.25 + Math.random() * 0.5,
      hue: Math.random() * 40 - 20, // ±20 brightness variation
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Fade trail
    ctx.fillStyle = "rgba(5, 5, 10, 0.18)";
    ctx.fillRect(0, 0, w, h);

    const [r, g, b] = hexToRgb(color);
    const ptr = pointerPos.current;

    for (const p of particles.current) {
      // Repulsion from pointer
      if (ptr) {
        const dx = p.x - ptr.x;
        const dy = p.y - ptr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 1) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Center pull
      p.vx += (cx - p.x) * CENTER_PULL;
      p.vy += (cy - p.y) * CENTER_PULL;

      // Friction
      p.vx *= FRICTION;
      p.vy *= FRICTION;

      // Integrate
      p.x += p.vx;
      p.y += p.vy;

      // Wrap at edges
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // Speed-based size and brightness
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const size = p.baseSize + Math.min(speed * 1.5, 4);
      const alpha = Math.min(p.opacity + speed * 0.08, 0.9);
      const brightness = Math.min(1 + speed * 0.2 + p.hue / 100, 1.4);

      const rr = Math.min(255, Math.round(r * brightness));
      const gg = Math.min(255, Math.round(g * brightness));
      const bb = Math.min(255, Math.round(b * brightness));

      // Draw glowing particle
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2.5);
      grad.addColorStop(0, `rgba(${rr},${gg},${bb},${alpha})`);
      grad.addColorStop(0.5, `rgba(${rr},${gg},${bb},${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${rr},${gg},${bb},0)`);

      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      initParticles(canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [draw, initParticles]);

  const getXY = (e: React.PointerEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("clientX" in e) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    const t = (e as React.TouchEvent).touches[0];
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  return (
    <div className="w-full h-full relative no-select" style={{ touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: isPointerDown.current ? "none" : "crosshair" }}
        onPointerDown={(e) => {
          isPointerDown.current = true;
          const pos = getXY(e);
          pointerPos.current = pos;
          prevDragPos.current = pos;
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!isPointerDown.current) return;
          pointerPos.current = getXY(e);
        }}
        onPointerEnter={(e) => {
          pointerPos.current = getXY(e);
        }}
        onPointerLeave={() => {
          if (!isPointerDown.current) pointerPos.current = null;
        }}
        onPointerUp={() => {
          isPointerDown.current = false;
          pointerPos.current = null;
        }}
        onPointerCancel={() => {
          isPointerDown.current = false;
          pointerPos.current = null;
        }}
      />

      {/* Label overlay */}
      <p
        className="absolute bottom-8 left-0 right-0 text-center text-xs font-mono tracking-widest pointer-events-none"
        style={{ color: isActive ? color : "#33334a" }}
      >
        {isActive ? "stir the flow" : "drag through the field"}
      </p>
    </div>
  );
}
