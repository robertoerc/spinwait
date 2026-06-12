"use client";
import { useRef, useEffect, useCallback } from "react";
import { Stage } from "@/lib/daemon";

interface Props {
  stage: Stage;
  hue: number;
  isCharging: boolean;
  resonanceLevel: number; // 0-1
  flux: number;
  isHibernating: boolean;
  onClick: () => void;
}

interface Particle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  opacity: number;
  phase: number;
}

interface Blob {
  ox: number; // offset from center (-1 to 1)
  oy: number;
  size: number; // relative to base
  speed: number;
  phase: number;
}

const STAGE_CONFIGS: Record<Stage, { blobs: Blob[]; particles: number; eyeSize: number }> = {
  egg: { blobs: [{ ox: 0, oy: 0, size: 1, speed: 0.5, phase: 0 }], particles: 0, eyeSize: 0 },
  larva: {
    blobs: [
      { ox: 0, oy: 0, size: 1, speed: 0.7, phase: 0 },
      { ox: 0.18, oy: -0.1, size: 0.55, speed: 0.9, phase: 1.2 },
    ],
    particles: 8,
    eyeSize: 0.07,
  },
  juvenile: {
    blobs: [
      { ox: 0, oy: 0.05, size: 1, speed: 0.8, phase: 0 },
      { ox: -0.2, oy: -0.12, size: 0.65, speed: 1.1, phase: 0.8 },
      { ox: 0.22, oy: -0.08, size: 0.6, speed: 0.95, phase: 2.0 },
      { ox: 0, oy: -0.25, size: 0.45, speed: 1.3, phase: 3.5 },
    ],
    particles: 18,
    eyeSize: 0.085,
  },
  mature: {
    blobs: [
      { ox: 0, oy: 0.05, size: 1, speed: 0.8, phase: 0 },
      { ox: -0.25, oy: -0.1, size: 0.7, speed: 1.0, phase: 0.7 },
      { ox: 0.26, oy: -0.08, size: 0.65, speed: 0.9, phase: 1.9 },
      { ox: 0.05, oy: -0.28, size: 0.5, speed: 1.2, phase: 3.2 },
      { ox: -0.1, oy: 0.28, size: 0.45, speed: 1.4, phase: 4.1 },
    ],
    particles: 28,
    eyeSize: 0.095,
  },
  shipping: {
    blobs: [
      { ox: 0, oy: 0, size: 1.15, speed: 1.2, phase: 0 },
      { ox: -0.28, oy: -0.12, size: 0.75, speed: 1.3, phase: 0.5 },
      { ox: 0.3, oy: -0.1, size: 0.7, speed: 1.1, phase: 1.8 },
      { ox: 0.08, oy: -0.3, size: 0.6, speed: 1.5, phase: 2.8 },
      { ox: -0.15, oy: 0.3, size: 0.55, speed: 1.6, phase: 3.8 },
      { ox: 0.2, oy: 0.25, size: 0.5, speed: 1.4, phase: 5.0 },
    ],
    particles: 36,
    eyeSize: 0.1,
  },
};

export default function DaemonCreature({
  stage, hue, isCharging, resonanceLevel, flux, isHibernating, onClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  // Init particles
  const initParticles = useCallback((count: number) => {
    particles.current = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      radius: 0.7 + Math.random() * 0.5,
      baseRadius: 0.7 + Math.random() * 0.5,
      speed: (0.3 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
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
    const baseSize = Math.min(w, h) * 0.32;

    const t = timeRef.current;
    const cfg = STAGE_CONFIGS[stage];
    const chargeFactor = isCharging ? 1 + resonanceLevel * 0.4 : 1;
    const sleepFactor = isHibernating ? 0.45 : 1;

    // Breathing / idle bob
    const breathe = Math.sin(t * 1.3) * 0.04;
    const bob = Math.sin(t * 0.7) * baseSize * 0.03;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background vignette
    const vign = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
    vign.addColorStop(0, "transparent");
    vign.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, w, h);

    // Outer ambient glow
    const glowRadius = baseSize * (1.8 + resonanceLevel * 0.6) * chargeFactor;
    const glowAlpha = (0.06 + resonanceLevel * 0.12) * sleepFactor;
    const outerGlow = ctx.createRadialGradient(cx, cy + bob, 0, cx, cy + bob, glowRadius);
    outerGlow.addColorStop(0, `hsla(${hue}, 100%, 65%, ${glowAlpha * 2})`);
    outerGlow.addColorStop(0.4, `hsla(${hue}, 100%, 65%, ${glowAlpha})`);
    outerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = outerGlow;
    ctx.fillRect(0, 0, w, h);

    // Egg stage — special treatment
    if (stage === "egg") {
      drawEgg(ctx, cx, cy, baseSize, t, hue, isCharging, resonanceLevel, flux);
      timeRef.current += 0.016;
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    // Draw blobs (metaball approximation)
    for (const blob of cfg.blobs) {
      const bx = cx + blob.ox * baseSize + Math.sin(t * blob.speed + blob.phase) * baseSize * 0.08;
      const by = cy + bob + blob.oy * baseSize + Math.cos(t * blob.speed * 0.7 + blob.phase) * baseSize * 0.06;
      const br = baseSize * blob.size * (1 + breathe * 0.5) * chargeFactor;

      // Core body
      const bodyGrad = ctx.createRadialGradient(
        bx - br * 0.15, by - br * 0.2, 0,
        bx, by, br
      );
      const lightness = isHibernating ? 20 : 50 + resonanceLevel * 20;
      const alpha = (0.55 + resonanceLevel * 0.25) * sleepFactor;
      bodyGrad.addColorStop(0, `hsla(${hue + 20}, 90%, ${lightness + 20}%, ${alpha})`);
      bodyGrad.addColorStop(0.5, `hsla(${hue}, 85%, ${lightness}%, ${alpha * 0.8})`);
      bodyGrad.addColorStop(1, `hsla(${hue - 10}, 80%, ${lightness - 15}%, 0)`);

      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
    }

    // Orbiting particles
    const particleSpeed = isCharging ? 1 + resonanceLevel * 2 : 1;
    for (const p of particles.current) {
      p.angle += 0.016 * p.speed * particleSpeed;
      const wobble = Math.sin(t * 2 + p.phase) * 0.12;
      const pr = baseSize * (p.baseRadius + wobble) * (1 + resonanceLevel * 0.3);
      const px = cx + Math.cos(p.angle) * pr;
      const py = cy + bob + Math.sin(p.angle) * pr * 0.6;

      const pAlpha = p.opacity * sleepFactor * (isCharging ? 1.3 : 1);
      const pHue = hue + (resonanceLevel > 0.7 ? 40 : 0); // shift toward gold at high resonance
      const grad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5);
      grad.addColorStop(0, `hsla(${pHue}, 100%, 80%, ${Math.min(pAlpha, 1)})`);
      grad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eyes
    if (cfg.eyeSize > 0 && !isHibernating) {
      drawEyes(ctx, cx, cy + bob, baseSize, cfg.eyeSize, t, pointerRef.current, hue, resonanceLevel);
    }

    // Hibernating — Zzz
    if (isHibernating) {
      ctx.fillStyle = `hsla(${hue}, 60%, 60%, 0.5)`;
      ctx.font = `${baseSize * 0.18}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("z z z", cx, cy + bob - baseSize * 0.7);
    }

    // Resonance corona at high levels
    if (resonanceLevel > 0.6 && isCharging) {
      const coronaAlpha = (resonanceLevel - 0.6) * 2.5 * 0.4;
      const corona = ctx.createRadialGradient(cx, cy + bob, baseSize * 0.8, cx, cy + bob, baseSize * 1.6);
      corona.addColorStop(0, `hsla(50, 100%, 70%, ${coronaAlpha})`); // gold
      corona.addColorStop(1, "transparent");
      ctx.fillStyle = corona;
      ctx.fillRect(0, 0, w, h);
    }

    timeRef.current += 0.016;
    rafRef.current = requestAnimationFrame(draw);
  }, [stage, hue, isCharging, resonanceLevel, isHibernating, flux]);

  useEffect(() => {
    const cfg = STAGE_CONFIGS[stage];
    initParticles(cfg.particles);
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, initParticles, stage]);

  // Pointer tracking for eye direction
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);
  const onPointerLeave = useCallback(() => { pointerRef.current = null; }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      style={{ touchAction: "none" }}
      width={400}
      height={400}
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    />
  );
}

function drawEgg(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  t: number, hue: number,
  isCharging: boolean, resonanceLevel: number, flux: number
) {
  const bob = Math.sin(t * 0.8) * size * 0.04;
  const breathe = 1 + Math.sin(t * 1.4) * 0.04;

  // Outer glow
  const glowR = size * 1.2;
  const glow = ctx.createRadialGradient(cx, cy + bob, 0, cx, cy + bob, glowR);
  glow.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.15)`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - glowR, cy + bob - glowR, glowR * 2, glowR * 2);

  // Egg body (scaled ellipse)
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(breathe, breathe * 1.25);

  const eggR = size * 0.42;
  const eggGrad = ctx.createRadialGradient(-eggR * 0.15, -eggR * 0.25, 0, 0, 0, eggR);
  eggGrad.addColorStop(0, `hsla(${hue + 30}, 90%, 75%, 0.9)`);
  eggGrad.addColorStop(0.55, `hsla(${hue}, 80%, 45%, 0.75)`);
  eggGrad.addColorStop(1, `hsla(${hue - 20}, 70%, 25%, 0.5)`);

  ctx.beginPath();
  ctx.arc(0, 0, eggR, 0, Math.PI * 2);
  ctx.fillStyle = eggGrad;
  ctx.fill();

  // Specular
  ctx.beginPath();
  ctx.arc(-eggR * 0.14, -eggR * 0.22, eggR * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fill();

  // Cracks when close to hatching (flux > 300)
  if (flux > 250) {
    const crackAlpha = Math.min((flux - 250) / 150, 1) * 0.7;
    ctx.strokeStyle = `hsla(${hue + 40}, 100%, 85%, ${crackAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-eggR * 0.05, -eggR * 0.3);
    ctx.lineTo(eggR * 0.1, -eggR * 0.1);
    ctx.lineTo(-eggR * 0.08, eggR * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eggR * 0.1, -eggR * 0.1);
    ctx.lineTo(eggR * 0.22, eggR * 0.08);
    ctx.stroke();
  }

  ctx.restore();

  // Hint text
  ctx.fillStyle = `hsla(${hue}, 60%, 65%, 0.5)`;
  ctx.font = "11px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.fillText("tap to hatch", cx, cy + size * 0.65);
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, baseSize: number,
  eyeSize: number, t: number,
  ptr: { x: number; y: number } | null,
  hue: number, resonance: number
) {
  const eyeSpacing = baseSize * 0.22;
  const eyeY = cy - baseSize * 0.12;
  const eyeR = baseSize * eyeSize;
  const pupilR = eyeR * 0.45;

  for (let i = -1; i <= 1; i += 2) {
    const ex = cx + i * eyeSpacing;

    // Eye socket
    const eyeGrad = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, eyeR);
    eyeGrad.addColorStop(0, "rgba(255,255,255,0.9)");
    eyeGrad.addColorStop(0.7, `hsla(${hue + 40}, 80%, 85%, 0.8)`);
    eyeGrad.addColorStop(1, `hsla(${hue}, 60%, 60%, 0.3)`);
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = eyeGrad;
    ctx.fill();

    // Pupil direction toward pointer
    let dx = 0, dy = 0;
    if (ptr) {
      const pvx = ptr.x - ex;
      const pvy = ptr.y - eyeY;
      const pd = Math.sqrt(pvx * pvx + pvy * pvy);
      if (pd > 1) {
        dx = (pvx / pd) * eyeR * 0.28;
        dy = (pvy / pd) * eyeR * 0.28;
      }
    } else {
      // Idle look around
      dx = Math.sin(t * 0.5 + i) * eyeR * 0.2;
      dy = Math.sin(t * 0.3) * eyeR * 0.15;
    }

    const pupilHue = resonance > 0.6 ? 50 : hue;
    ctx.beginPath();
    ctx.arc(ex + dx, eyeY + dy, pupilR, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${pupilHue}, 90%, 15%, 0.95)`;
    ctx.fill();

    // Pupil shine
    ctx.beginPath();
    ctx.arc(ex + dx - pupilR * 0.3, eyeY + dy - pupilR * 0.3, pupilR * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();
  }
}
