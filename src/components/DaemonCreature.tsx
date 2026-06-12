"use client";
import { useRef, useEffect, useCallback } from "react";
import { DNA, getRareTraits, getHue, getAccentHue, getTempoMultiplier, mulberry32 } from "@/lib/genome";
import { Stage } from "@/lib/daemon";

interface Props {
  dna: DNA;
  stage: Stage;
  width?: number;
  height?: number;
  pointerX?: number;
  pointerY?: number;
}

const STAGE_COMPLEXITY: Record<Stage, number> = {
  egg: 0.0,
  larva: 0.25,
  juvenile: 0.55,
  mature: 0.85,
  shipping: 1.0,
};

export default function DaemonCreature({ dna, stage, width = 240, height = 240, pointerX, pointerY }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const t = tRef.current;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    if (stage === "egg") {
      drawEgg(ctx, dna, t, cx, cy);
    } else {
      const complexity = STAGE_COMPLEXITY[stage];
      drawCreature(ctx, dna, t, cx, cy, complexity, width, height, pointerX, pointerY);
    }

    tRef.current += 0.016 * getTempoMultiplier(dna);
    rafRef.current = requestAnimationFrame(draw);
  }, [dna, stage, width, height, pointerX, pointerY]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: "block" }}
    />
  );
}

// ============================================================
//  DRAWING PRIMITIVES
// ============================================================

function drawEgg(ctx: CanvasRenderingContext2D, dna: DNA, t: number, cx: number, cy: number) {
  const hue = getHue(dna);
  const bob = Math.sin(t * 1.2) * 3;
  const crack = t > 4;

  ctx.save();
  ctx.translate(cx, cy + bob);

  const grad = ctx.createRadialGradient(-8, -12, 2, 0, 0, 38);
  grad.addColorStop(0, `hsl(${hue}, 30%, 30%)`);
  grad.addColorStop(1, `hsl(${hue}, 45%, 10%)`);

  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, 70%, 55%, 0.4)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (crack) {
    ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.8)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -18);
    ctx.lineTo(-2, -10);
    ctx.lineTo(3, -14);
    ctx.lineTo(5, -6);
    ctx.stroke();
  }

  const pulse = (Math.sin(t * 2.5) + 1) / 2;
  const inner = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
  inner.addColorStop(0, `hsla(${hue}, 80%, 65%, ${0.05 + pulse * 0.15})`);
  inner.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = inner;
  ctx.fill();

  ctx.restore();
}

function drawCreature(
  ctx: CanvasRenderingContext2D,
  dna: DNA,
  t: number,
  cx: number,
  cy: number,
  complexity: number,
  W: number,
  H: number,
  pointerX?: number,
  pointerY?: number
) {
  const rare = getRareTraits(dna);
  const hue = rare.chromatic ? (getHue(dna) + t * 30) % 360 : getHue(dna);
  const accentHue = rare.chromatic ? (hue + 150) % 360 : getAccentHue(dna);
  const rng = mulberry32(dna.jitterSeed);

  const baseRadius = 28 + dna.bodySize * 5;
  const radius = baseRadius * (0.4 + complexity * 0.6);

  const idleBob = getIdleBob(dna, t);
  const bx = cx + idleBob.x;
  const by = cy + idleBob.y;

  ctx.save();
  ctx.translate(bx, by);

  if (rare.prismatic && complexity > 0.5) {
    const pHue = (hue + t * 60) % 360;
    ctx.save();
    ctx.shadowColor = `hsl(${pHue}, 100%, 60%)`;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    drawBodyPath(ctx, dna, 0, 0, radius + 4, t, rng);
    ctx.strokeStyle = `hsla(${pHue}, 100%, 65%, 0.5)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawBody(ctx, dna, 0, 0, radius, hue, accentHue, t, rng, complexity);

  if (dna.marking > 0 && complexity > 0.3) {
    drawMarkings(ctx, dna, 0, 0, radius, hue, accentHue, t, rng);
  }

  if (rare.glyph && complexity > 0.4) {
    drawGlyph(ctx, 0, 0, radius * 0.5, hue, t);
  }

  if (rare.halo && complexity > 0.5) {
    const haloY = -radius * 1.35;
    ctx.beginPath();
    ctx.ellipse(0, haloY, radius * 0.55, radius * 0.14, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${accentHue}, 90%, 70%, ${0.5 + Math.sin(t * 2) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `hsl(${accentHue}, 90%, 70%)`;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (dna.limbType > 0 && dna.limbCount > 0 && complexity > 0.2) {
    drawLimbs(ctx, dna, 0, 0, radius, hue, accentHue, t, rng, complexity);
  }

  if (dna.appendage > 0 && complexity > 0.4) {
    drawAppendage(ctx, dna, 0, 0, radius, hue, accentHue, t, rng);
  }

  if (rare.twinMote && complexity > 0.6) {
    const mAngle = t * 0.6;
    const mR = radius * 1.5;
    const mx = Math.cos(mAngle) * mR;
    const my = Math.sin(mAngle) * mR * 0.5 - radius * 0.2;
    const mSize = radius * 0.15;
    ctx.beginPath();
    ctx.arc(mx, my, mSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${accentHue}, 85%, 65%, 0.8)`;
    ctx.shadowColor = `hsl(${accentHue}, 90%, 70%)`;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (complexity > 0.15) {
    drawEyes(ctx, dna, 0, 0, radius, hue, accentHue, t, rng, rare, pointerX, pointerY, bx, by, W, H);
  }

  if (dna.mouth > 0 && complexity > 0.35) {
    drawMouth(ctx, dna, 0, 0, radius, hue, t);
  }

  ctx.restore();
}

function getIdleBob(dna: DNA, t: number): { x: number; y: number } {
  switch (dna.idleStyle) {
    case 0: return { x: 0, y: Math.sin(t * 1.1) * 5 };
    case 1: return { x: 0, y: 0 };
    case 2: {
      const angle = t * 0.4;
      return { x: Math.cos(angle) * 8, y: Math.sin(angle * 1.3) * 5 };
    }
    case 3: return { x: Math.sin(t * 2.1) * 2, y: Math.sin(t * 1.7) * 4 };
    case 4: return { x: Math.sin(t * 3) * 3, y: Math.cos(t * 2) * 3 };
    case 5: return { x: Math.sin(t * 7.3) * 1.5, y: Math.cos(t * 6.1) * 1.5 };
    default: return { x: 0, y: 0 };
  }
}

function drawBodyPath(
  ctx: CanvasRenderingContext2D,
  dna: DNA,
  x: number,
  y: number,
  radius: number,
  t: number,
  rng: () => number
) {
  const noise = dna.edgeNoise * 2.3;
  const aspect = 0.6 + dna.aspect * 0.14;

  switch (dna.bodyPlan) {
    case 0: blobPath(ctx, x, y, radius, aspect, noise, t); break;
    case 1: segmentedPath(ctx, x, y, radius, dna.segments + 3, noise, t); break;
    case 2: radialPath(ctx, x, y, radius, dna.segments + 3, noise, t); break;
    case 3: crystallinePath(ctx, x, y, radius, dna.segments + 3, noise, t); break;
    case 4: wispPath(ctx, x, y, radius, noise, t); break;
    case 5: asymmetricPath(ctx, x, y, radius, aspect, noise, t); break;
  }
}

function drawBody(
  ctx: CanvasRenderingContext2D,
  dna: DNA,
  x: number,
  y: number,
  radius: number,
  hue: number,
  accentHue: number,
  t: number,
  rng: () => number,
  complexity: number
) {
  const pulseScale = dna.idleStyle === 1 ? 1 + Math.sin(t * 2) * 0.04 : 1;
  const r = radius * pulseScale;

  ctx.save();
  ctx.scale(pulseScale, pulseScale);

  const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.05, x, y, r);
  grad.addColorStop(0, `hsl(${hue}, 55%, 72%)`);
  grad.addColorStop(0.6, `hsl(${hue}, 60%, 55%)`);
  grad.addColorStop(1, `hsl(${hue}, 65%, 32%)`);

  ctx.beginPath();
  drawBodyPath(ctx, dna, x, y, r, t, rng);
  ctx.fillStyle = grad;
  ctx.fill();

  const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, r * 0.55);
  coreGrad.addColorStop(0, `hsla(${accentHue}, 70%, 80%, ${0.12 + Math.sin(t * 1.5) * 0.05})`);
  coreGrad.addColorStop(1, "transparent");
  ctx.beginPath();
  drawBodyPath(ctx, dna, x, y, r, t, rng);
  ctx.fillStyle = coreGrad;
  ctx.fill();

  ctx.restore();
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  dna: DNA,
  x: number,
  y: number,
  radius: number,
  hue: number,
  accentHue: number,
  t: number,
  rng: () => number,
  rare: ReturnType<typeof getRareTraits>,
  pointerX?: number,
  pointerY?: number,
  bx?: number,
  by?: number,
  W?: number,
  H?: number
) {
  const eyeCount = dna.eyeCount + 1;
  const eyeSize = 4 + dna.eyeSize * 3;
  const eyeSpacing = Math.min(radius * 0.55, 16 + dna.eyeSize * 4);
  const eyeY = -radius * 0.2;

  let lookX = 0, lookY = 0;
  if (pointerX !== undefined && pointerY !== undefined && bx !== undefined && by !== undefined) {
    const dx = pointerX - bx;
    const dy = pointerY - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      lookX = (dx / dist) * Math.min(dist / 60, 1) * eyeSize * 0.35;
      lookY = (dy / dist) * Math.min(dist / 60, 1) * eyeSize * 0.35;
    }
  }

  for (let i = 0; i < eyeCount; i++) {
    const angle = eyeCount === 1 ? 0 : ((i / (eyeCount - 1)) - 0.5) * Math.PI * 0.6;
    const ex = x + Math.sin(angle) * eyeSpacing * (eyeCount > 1 ? 1 : 0);
    const ey = y + eyeY - Math.cos(angle) * eyeSpacing * 0.3;

    const eyeHue = rare.heterochromia && i % 2 === 1 ? (hue + 180) % 360 : accentHue;
    const isVoid = rare.voidEyes;

    if (isVoid) {
      ctx.beginPath();
      ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.strokeStyle = `hsl(${eyeHue}, 90%, 65%)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const grd = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeSize);
      grd.addColorStop(0.5, "transparent");
      grd.addColorStop(0.8, `hsla(${eyeHue}, 90%, 55%, 0.3)`);
      grd.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    } else {
      drawEyeShape(ctx, dna.eyeShape, ex, ey, eyeSize, eyeHue, hue, t);
      drawPupil(ctx, dna.pupil, ex + lookX, ey + lookY, eyeSize, eyeHue, t);
    }

    ctx.beginPath();
    ctx.arc(ex - eyeSize * 0.2, ey - eyeSize * 0.25, eyeSize * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fill();
  }
}

function drawEyeShape(
  ctx: CanvasRenderingContext2D,
  shape: number,
  ex: number,
  ey: number,
  r: number,
  iris: number,
  body: number,
  t: number
) {
  ctx.save();
  switch (shape) {
    case 0:
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${body}, 40%, 20%)`; ctx.fill();
      ctx.beginPath(); ctx.arc(ex, ey, r * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${iris}, 70%, 55%)`; ctx.fill();
      break;
    case 1:
      ctx.beginPath(); ctx.ellipse(ex, ey, r, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${body}, 40%, 20%)`; ctx.fill();
      ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.6, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${iris}, 70%, 55%)`; ctx.fill();
      break;
    case 2:
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${body}, 40%, 20%)`; ctx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(ex + r * 0.4, ey, r * 0.75, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      break;
    case 3:
      ctx.beginPath(); ctx.arc(ex, ey, r, Math.PI, 0);
      ctx.fillStyle = `hsl(${body}, 40%, 22%)`; ctx.fill();
      ctx.strokeStyle = `hsl(${iris}, 80%, 60%)`; ctx.lineWidth = 1.5; ctx.stroke();
      break;
    case 4:
      ctx.beginPath();
      ctx.moveTo(ex, ey - r); ctx.lineTo(ex + r * 0.65, ey);
      ctx.lineTo(ex, ey + r); ctx.lineTo(ex - r * 0.65, ey); ctx.closePath();
      ctx.fillStyle = `hsl(${body}, 40%, 18%)`; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(ex, ey - r * 0.5); ctx.lineTo(ex + r * 0.35, ey);
      ctx.lineTo(ex, ey + r * 0.5); ctx.lineTo(ex - r * 0.35, ey); ctx.closePath();
      ctx.fillStyle = `hsl(${iris}, 70%, 55%)`; ctx.fill();
      break;
    case 5:
      ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsl(${iris}, 80%, 60%)`; ctx.lineWidth = 2; ctx.stroke();
      break;
  }
  ctx.restore();
}

function drawPupil(
  ctx: CanvasRenderingContext2D,
  type: number,
  ex: number,
  ey: number,
  r: number,
  hue: number,
  t: number
) {
  switch (type) {
    case 0:
      ctx.beginPath(); ctx.arc(ex, ey, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "#000"; ctx.fill();
      break;
    case 1:
      ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.12, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#000"; ctx.fill();
      break;
    case 2: break;
    case 3:
      ctx.beginPath(); ctx.arc(ex, ey, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${0.5 + Math.sin(t * 3) * 0.3})`;
      ctx.shadowColor = `hsl(${hue}, 90%, 70%)`; ctx.shadowBlur = 6;
      ctx.fill(); ctx.shadowBlur = 0;
      break;
  }
}

function drawLimbs(
  ctx: CanvasRenderingContext2D,
  dna: DNA,
  x: number,
  y: number,
  radius: number,
  hue: number,
  accentHue: number,
  t: number,
  rng: () => number,
  complexity: number
) {
  const count = Math.min(dna.limbCount + 1, 6);
  const useAccent = dna.accentTarget === 1;
  const limbHue = useAccent ? accentHue : hue;
  const spreadAngle = (60 + dna.attachSpread * 43) * (Math.PI / 180);
  const startAngle = Math.PI / 2 + (Math.PI - spreadAngle) / 2;
  const length = (radius * 0.5) * (0.6 + dna.limbLength * 0.2);

  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const pairIndex = Math.floor(i / 2);
    const t_frac = count > 1 ? pairIndex / Math.max(count / 2 - 1, 1) : 0;
    const baseAngle = startAngle + t_frac * spreadAngle;

    let animOffset = 0;
    switch (dna.limbMotion) {
      case 0: animOffset = Math.sin(t * 1.8 + i * 0.8) * 0.3; break;
      case 1: animOffset = Math.sin(t * 3 + i * Math.PI) * 0.25; break;
      case 2: animOffset = Math.sin(t * 1.5 + i * 0.5) * 0.4; break;
    }

    const angle = baseAngle * side + animOffset * side;
    const ax = x + Math.cos(angle) * radius * 0.85;
    const ay = y + Math.sin(angle) * radius * 0.85;

    ctx.save();
    ctx.strokeStyle = `hsl(${limbHue}, 60%, 55%)`;
    ctx.fillStyle = `hsl(${limbHue}, 65%, 55%)`;
    ctx.lineWidth = 2;

    switch (dna.limbType) {
      case 1: drawTentacle(ctx, ax, ay, angle, length, t + i, limbHue); break;
      case 2: drawStickLeg(ctx, ax, ay, angle, length, limbHue); break;
      case 3: drawFin(ctx, ax, ay, angle, length * 0.7, limbHue, t + i * 0.5); break;
      case 4: drawSpike(ctx, ax, ay, angle, length * 0.8, limbHue); break;
      case 5: drawMoteOrbit(ctx, ax, ay, angle, radius, limbHue, accentHue, t + i); break;
      case 6:
        ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2);
        ctx.fill(); break;
    }
    ctx.restore();
  }
}

function drawTentacle(ctx: CanvasRenderingContext2D, ax: number, ay: number, angle: number, len: number, t: number, hue: number) {
  const curl = Math.sin(t * 1.2) * 0.4;
  const ex = ax + Math.cos(angle + curl) * len;
  const ey = ay + Math.sin(angle + curl) * len;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(
    ax + Math.cos(angle + curl * 0.5) * len * 0.5 + Math.cos(angle + Math.PI / 2) * 12,
    ay + Math.sin(angle + curl * 0.5) * len * 0.5 + Math.sin(angle + Math.PI / 2) * 12,
    ex, ey
  );
  ctx.strokeStyle = `hsla(${hue}, 65%, 55%, 0.9)`;
  ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
  ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${hue}, 70%, 65%)`; ctx.fill();
}

function drawStickLeg(ctx: CanvasRenderingContext2D, ax: number, ay: number, angle: number, len: number, hue: number) {
  const kx = ax + Math.cos(angle - 0.5) * len * 0.45;
  const ky = ay + Math.sin(angle - 0.5) * len * 0.45;
  const ex = kx + Math.cos(angle + 0.6) * len * 0.55;
  const ey = ky + Math.sin(angle + 0.6) * len * 0.55;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(kx, ky); ctx.lineTo(ex, ey);
  ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.9)`;
  ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
}

function drawFin(ctx: CanvasRenderingContext2D, ax: number, ay: number, angle: number, size: number, hue: number, t: number) {
  const wave = Math.sin(t * 2) * 0.3;
  ctx.beginPath(); ctx.moveTo(ax, ay);
  ctx.arc(ax, ay, size, angle - 0.6 + wave, angle + 0.6 + wave);
  ctx.closePath();
  ctx.fillStyle = `hsla(${hue}, 65%, 60%, 0.5)`; ctx.fill();
  ctx.strokeStyle = `hsla(${hue}, 65%, 55%, 0.7)`; ctx.lineWidth = 1; ctx.stroke();
}

function drawSpike(ctx: CanvasRenderingContext2D, ax: number, ay: number, angle: number, len: number, hue: number) {
  const ex = ax + Math.cos(angle) * len;
  const ey = ay + Math.sin(angle) * len;
  ctx.beginPath();
  ctx.moveTo(ax + Math.cos(angle + Math.PI / 2) * 5, ay + Math.sin(angle + Math.PI / 2) * 5);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ax + Math.cos(angle - Math.PI / 2) * 5, ay + Math.sin(angle - Math.PI / 2) * 5);
  ctx.closePath();
  ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.9)`; ctx.fill();
}

function drawMoteOrbit(ctx: CanvasRenderingContext2D, _ax: number, _ay: number, angle: number, radius: number, hue: number, accentHue: number, t: number) {
  const orbitR = radius * 1.2;
  const mx = Math.cos(angle + t * 0.8) * orbitR;
  const my = Math.sin(angle + t * 0.8) * orbitR * 0.5;
  const sz = 4 + Math.sin(t * 2) * 1.5;
  ctx.beginPath(); ctx.arc(mx, my, sz, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${accentHue}, 80%, 65%, ${0.6 + Math.sin(t * 1.5) * 0.3})`;
  ctx.shadowColor = `hsl(${accentHue}, 90%, 70%)`; ctx.shadowBlur = 8;
  ctx.fill(); ctx.shadowBlur = 0;
}

function drawMarkings(ctx: CanvasRenderingContext2D, dna: DNA, x: number, y: number, radius: number, hue: number, accentHue: number, t: number, rng: () => number) {
  const mHue = dna.accentTarget === 2 ? accentHue : (hue + 20) % 360;
  switch (dna.marking) {
    case 1: {
      const count = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < count; i++) {
        const a = rng() * Math.PI * 2; const r = rng() * radius * 0.65; const sz = 2 + rng() * 5;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, sz, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${mHue}, 60%, 65%, 0.4)`; ctx.fill();
      }
      break;
    }
    case 2: {
      const count = 2 + (dna.segments % 3);
      for (let i = 0; i < count; i++) {
        const yi = y - radius * 0.5 + (i / count) * radius;
        ctx.beginPath(); ctx.ellipse(x, yi, radius * 0.8, radius * 0.06, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${mHue}, 55%, 60%, 0.3)`; ctx.fill();
      }
      break;
    }
    case 3: {
      const grd = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.6);
      grd.addColorStop(0, `hsla(${mHue}, 80%, 75%, ${0.12 + Math.sin(t * 2) * 0.06})`);
      grd.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      break;
    }
    case 4: {
      const count = 5 + Math.floor(rng() * 6);
      for (let i = 0; i < count; i++) {
        const a = rng() * Math.PI * 2; const r = radius * 0.3 + rng() * radius * 0.5;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${mHue}, 50%, 55%, 0.6)`; ctx.fill();
      }
      break;
    }
  }
}

function drawAppendage(ctx: CanvasRenderingContext2D, dna: DNA, x: number, y: number, radius: number, hue: number, accentHue: number, t: number, rng: () => number) {
  const aHue = dna.accentTarget === 0 ? accentHue : hue;
  const top = y - radius;
  switch (dna.appendage) {
    case 1: {
      for (const side of [-1, 1]) {
        const wave = Math.sin(t * 2 + side) * 8;
        ctx.beginPath();
        ctx.moveTo(x + side * radius * 0.3, top);
        ctx.quadraticCurveTo(x + side * (radius * 0.4 + wave), top - radius * 0.5, x + side * (radius * 0.3 + wave), top - radius * 0.75);
        ctx.strokeStyle = `hsl(${aHue}, 60%, 55%)`; ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.stroke();
        ctx.beginPath(); ctx.arc(x + side * (radius * 0.3 + wave), top - radius * 0.75, 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${aHue}, 70%, 65%)`; ctx.fill();
      }
      break;
    }
    case 2: {
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x + side * radius * 0.3, top + 4);
        ctx.lineTo(x + side * radius * 0.4, top - radius * 0.5);
        ctx.lineTo(x + side * radius * 0.25, top + 2); ctx.closePath();
        ctx.fillStyle = `hsl(${aHue}, 65%, 55%)`; ctx.fill();
      }
      break;
    }
    case 3: {
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(x + side * radius * 0.5, top + 8);
        ctx.lineTo(x + side * radius * 0.75, top - radius * 0.4);
        ctx.lineTo(x + side * radius * 0.2, top - radius * 0.1); ctx.closePath();
        ctx.fillStyle = `hsl(${aHue}, 55%, 58%)`; ctx.fill();
      }
      break;
    }
    case 4: {
      const points = 3 + dna.segments % 3;
      const wave = Math.sin(t * 1.5) * 3;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const px = x + (i / points - 0.5) * radius * 1.2;
        const py = top - (i % 2 === 0 ? 0 : radius * 0.45) + wave;
        if (i === 0) ctx.moveTo(px, top);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(x + radius * 0.6, top);
      ctx.strokeStyle = `hsl(${aHue}, 65%, 55%)`; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
      break;
    }
    case 5: {
      const tailAngle = Math.PI / 2 + Math.sin(t * 2) * 0.4;
      const tailLen = radius * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y + radius * 0.6);
      ctx.quadraticCurveTo(x + Math.cos(tailAngle) * tailLen * 0.5, y + radius * 0.6 + tailLen * 0.6, x + Math.cos(tailAngle) * tailLen, y + radius * 0.6 + tailLen);
      ctx.strokeStyle = `hsl(${aHue}, 60%, 55%)`; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
      break;
    }
    case 6: {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          const wy = y + (i - 1) * 5;
          const wave = Math.sin(t * 1.5 + i) * 4 * side;
          ctx.beginPath(); ctx.moveTo(x + side * radius * 0.75, wy);
          ctx.lineTo(x + side * (radius * 0.75 + 18 + wave), wy + (i - 1) * 2);
          ctx.strokeStyle = `hsla(${aHue}, 55%, 70%, 0.6)`; ctx.lineWidth = 1; ctx.lineCap = "round"; ctx.stroke();
        }
      }
      break;
    }
  }
}

function drawMouth(ctx: CanvasRenderingContext2D, dna: DNA, x: number, y: number, radius: number, hue: number, t: number) {
  const my = y + radius * 0.3;
  ctx.strokeStyle = `hsla(${hue}, 50%, 40%, 0.7)`;
  ctx.lineWidth = 1.5; ctx.lineCap = "round";
  switch (dna.mouth) {
    case 1: ctx.beginPath(); ctx.moveTo(x - 6, my); ctx.lineTo(x + 6, my); ctx.stroke(); break;
    case 2:
      ctx.beginPath(); ctx.moveTo(x - 8, my - 1);
      ctx.quadraticCurveTo(x - 3, my + 4, x, my - 1);
      ctx.quadraticCurveTo(x + 3, my + 4, x + 8, my - 1); ctx.stroke(); break;
    case 3: ctx.beginPath(); ctx.arc(x, my, 4, 0, Math.PI * 2); ctx.stroke(); break;
    case 4:
      ctx.beginPath(); ctx.moveTo(x - 5, my - 2); ctx.lineTo(x, my + 3); ctx.lineTo(x + 5, my - 2); ctx.closePath();
      ctx.fillStyle = `hsl(${hue}, 50%, 40%)`; ctx.fill(); break;
  }
}

function drawGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hue: number, t: number) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(t * 0.2);
  ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${0.15 + Math.sin(t) * 0.07})`; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.12, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// Body path implementations

function blobPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, aspect: number, noise: number, t: number) {
  const N = 8;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const jitter = Math.sin(angle * 3 + t * 0.7) * noise + Math.sin(angle * 5 - t * 0.4) * noise * 0.5;
    const rx = r * (1 + jitter / r);
    const ry = r * aspect * (1 + jitter / r * 0.5);
    const px = x + Math.cos(angle) * rx;
    const py = y + Math.sin(angle) * ry;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function segmentedPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, count: number, noise: number, t: number) {
  ctx.beginPath();
  const step = (r * 1.8) / count;
  for (let i = 0; i < count; i++) {
    const sy = y - r * 0.9 + step * (i + 0.5);
    const sw = r * (0.5 + Math.sin((i / count) * Math.PI) * 0.5) + Math.sin(t * 1.2 + i) * noise;
    ctx.moveTo(x + sw, sy); ctx.arc(x, sy, Math.max(sw, 1), 0, Math.PI * 2);
  }
}

function radialPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, petals: number, noise: number, t: number) {
  const N = petals * 4;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const petal = (Math.cos(angle * petals + t * 0.4) + 1) / 2;
    const rad = r * (0.4 + petal * 0.6) + Math.sin(angle * 7 + t) * noise;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function crystallinePath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, sides: number, noise: number, t: number) {
  const rot = t * 0.05;
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 + rot;
    const jitter = Math.sin(i * 2.3 + t * 0.3) * noise * 0.5;
    const px = x + Math.cos(angle) * (r + jitter);
    const py = y + Math.sin(angle) * (r + jitter);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function wispPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, noise: number, t: number) {
  const wave = Math.sin(t * 1.3) * noise;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.bezierCurveTo(x + r * 0.7 + wave, y - r * 0.3, x + r * 0.5, y + r * 0.5, x, y + r * 0.2);
  ctx.bezierCurveTo(x - r * 0.5, y + r * 0.5, x - r * 0.7 - wave, y - r * 0.3, x, y - r);
  ctx.closePath();
}

function asymmetricPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, aspect: number, noise: number, t: number) {
  const wave = Math.sin(t * 0.9) * noise;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y, r * 0.8 + wave * 0.5, r * aspect, 0, 0, Math.PI * 2);
  ctx.moveTo(x + r * 0.75, y - r * 0.1);
  ctx.ellipse(x + r * 0.3, y - r * 0.1, r * 0.5 - wave * 0.3, r * aspect * 0.7, 0, 0, Math.PI * 2);
}
