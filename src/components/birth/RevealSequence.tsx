"use client";
import { useEffect, useState, useRef } from "react";
import { decodeGenome, generateName, computeRarity, getRareTraits, getHue, getAccentHue } from "@/lib/genome";
import DaemonCreature from "@/components/DaemonCreature";

interface Props {
  genome: string;
  onComplete: () => void;
}

type Beat =
  | "dark"
  | "strand"    // 0.5s — genome strand slot reel
  | "rare"      // 2.0s — rare trait glitch flash
  | "silhouette"// 2.5s — dark silhouette trace
  | "flood"     // 4.0s — color + limbs unfurl
  | "eyes"      // 5.0s — eyes open
  | "idle"      // 5.5s — signature idle animation
  | "name"      // 6.5s — name types out
  | "done";

const BEATS: { beat: Beat; at: number }[] = [
  { beat: "dark",      at: 0 },
  { beat: "strand",    at: 300 },
  { beat: "rare",      at: 1800 },
  { beat: "silhouette",at: 2400 },
  { beat: "flood",     at: 3800 },
  { beat: "eyes",      at: 4800 },
  { beat: "idle",      at: 5300 },
  { beat: "name",      at: 6200 },
  { beat: "done",      at: 8500 },
];

export default function RevealSequence({ genome, onComplete }: Props) {
  const [beat, setBeat] = useState<Beat>("dark");
  const [typedName, setTypedName] = useState("");
  const [strandSlots, setStrandSlots] = useState(genome);
  const dna = decodeGenome(genome);
  const rare = getRareTraits(dna);
  const name = generateName(dna, genome);
  const rarity = computeRarity(dna);
  const hue = getHue(dna);
  const accentHue = getAccentHue(dna);
  const rareTraitNames = Object.entries(rare)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // Schedule beats
  useEffect(() => {
    const timers = BEATS.map(({ beat: b, at }) =>
      setTimeout(() => setBeat(b), at)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Genome strand slot reel animation (0.3s – 1.8s)
  useEffect(() => {
    if (beat !== "strand") return;
    const chars = "0123456789abcdef";
    let i = 0;
    const interval = setInterval(() => {
      setStrandSlots(prev =>
        prev.split("").map((c, idx) =>
          idx < i ? genome[idx] : chars[Math.floor(Math.random() * 16)]
        ).join("")
      );
      i++;
      if (i > genome.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [beat, genome]);

  // Name type-out (6.2s+)
  useEffect(() => {
    if (beat !== "name") return;
    let i = 0;
    const interval = setInterval(() => {
      setTypedName(name.slice(0, i));
      i++;
      if (i > name.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [beat, name]);

  const showCreature = beat === "silhouette" || beat === "flood" || beat === "eyes" || beat === "idle" || beat === "name" || beat === "done";
  const showColor = beat === "flood" || beat === "eyes" || beat === "idle" || beat === "name" || beat === "done";
  const showEyes = beat === "eyes" || beat === "idle" || beat === "name" || beat === "done";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 gap-6"
      style={{ background: "rgba(2,2,6,0.97)", cursor: beat === "done" ? "pointer" : "default" }}
      onClick={beat === "done" ? onComplete : undefined}
    >
      {/* Genome strand */}
      {(beat === "strand" || beat === "rare") && (
        <div
          className="font-mono text-[10px] tracking-widest text-center"
          style={{
            color: `hsl(${hue}, 70%, 45%)`,
            letterSpacing: "0.15em",
            animation: beat === "rare" ? "glitchText 0.3s steps(2) infinite" : undefined,
          }}
        >
          {strandSlots.match(/.{1,6}/g)?.join(" ")}
        </div>
      )}

      {/* Rare trait flash */}
      {beat === "rare" && rareTraitNames.length > 0 && (
        <div
          className="font-mono text-xs tracking-widest text-center"
          style={{
            color: "#ffcc00",
            textShadow: "0 0 12px gold",
            animation: "glitchText 0.2s steps(2) infinite",
          }}
        >
          ✦ {rareTraitNames.join(" · ")} ✦
        </div>
      )}

      {/* Creature canvas */}
      {showCreature && (
        <div
          style={{
            filter: showColor ? "none" : "grayscale(1) brightness(0.3)",
            opacity: showColor ? 1 : 0.5,
            transition: beat === "flood" ? "filter 1.2s ease, opacity 0.8s ease" : "none",
          }}
        >
          <DaemonCreature
            dna={dna}
            stage={showEyes ? "mature" : "juvenile"}
            width={200}
            height={200}
          />
        </div>
      )}

      {/* Name type-out */}
      {(beat === "name" || beat === "done") && (
        <div className="text-center">
          <div
            className="font-mono font-bold tracking-widest"
            style={{
              fontSize: 18,
              color: `hsl(${hue}, 80%, 65%)`,
              textShadow: `0 0 16px hsl(${hue}, 80%, 55%)`,
            }}
          >
            {typedName}
            {typedName.length < name.length && (
              <span style={{ animation: "blink 0.5s step-end infinite" }}>_</span>
            )}
          </div>
          {beat === "done" && (
            <div className="font-mono text-[9px] tracking-widest mt-2" style={{ color: "#2a2a3a" }}>
              1 in {rarity.toLocaleString()} · {genome.slice(-4).toUpperCase()} · tap to continue
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes glitchText {
          0%   { transform: translate(0,0) skewX(0deg); opacity: 1; }
          25%  { transform: translate(-2px, 1px) skewX(2deg); opacity: 0.8; }
          50%  { transform: translate(2px, -1px) skewX(-1deg); opacity: 1; }
          75%  { transform: translate(-1px, 2px) skewX(1deg); opacity: 0.9; }
          100% { transform: translate(0,0) skewX(0deg); opacity: 1; }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
