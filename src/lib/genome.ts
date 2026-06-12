// GENOME SYSTEM — 24-char hex string encodes a unique creature
// Pure functions only — fully deterministic from genome string

export interface DNA {
  // Body
  bodyPlan:    0|1|2|3|4|5;  // blob, segmented, radial, crystalline, wisp, asymmetric
  bodySize:    number;         // 0-7 → radius 28-68px
  aspect:      number;         // 0-6 → 0.6-1.6 squash/stretch
  segments:    number;         // 0-4 → 3-7 count
  edgeNoise:   number;         // 0-5 → jitter 0-14px
  // Limbs
  limbType:    0|1|2|3|4|5|6; // none, tentacles, stickLegs, fins, spikes, motes, nubs
  limbCount:   number;         // 0-5 → 0,2,3,4,5,6 limbs
  limbLength:  number;         // 0-4 → short-long
  attachSpread:number;         // 0-7 → 60°-360° arc
  limbMotion:  0|1|2|3;       // sway, paddle, curl, twitch
  // Face
  eyeCount:    0|1|2|3;       // 1,2,3,4 eyes
  eyeShape:    0|1|2|3|4|5;   // circle, oval, crescent, arc, diamond, ring
  eyeSize:     number;         // 0-3
  pupil:       0|1|2|3;       // dot, slit, none, glow
  expression:  0|1|2|3;       // curious, calm, feral, smug
  mouth:       0|1|2|3|4;     // none, line, w-curve, o, beak
  appendage:   0|1|2|3|4|5|6|7; // none, antennae, horns, ears, crest, tail, whiskers, halo
  // Color
  hue:         number;         // 0-11 → 12 hue bins × 30°
  scheme:      0|1|2;         // analogous, complement-accent, triad
  accentTarget:0|1|2;         // eyes, limbs, markings
  marking:     0|1|2|3|4;     // none, spots, stripes, coreGlow, freckles
  // Motion
  idleStyle:   0|1|2|3|4|5;  // floatBob, pulse, orbitDrift, wobble, crawlWave, jitter
  tempo:       0|1|2;         // languid, steady, quicksilver
  // Entropy
  jitterSeed:  number;         // 0-65535
  // Rare flags (bitmask)
  rareFlags:   number;         // 8 bits
}

export interface RareTraits {
  chromatic:     boolean; // hue cycles
  halo:          boolean; // floating ring
  heterochromia: boolean; // two-tone eyes
  voidEyes:      boolean; // ring eyes override
  twinMote:      boolean; // companion orbiter
  prismatic:     boolean; // outline hue cycles
  glyph:         boolean; // ancient symbol marking
  asymmetryBreak:boolean; // one mismatched feature
}

// Mulberry32 PRNG — deterministic from seed
export function mulberry32(seed: number) {
  return function(): number {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Decode 24-char hex genome into DNA
export function decodeGenome(hex: string): DNA {
  const bytes = new Uint8Array(12);
  for (let i = 0; i < 12; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  const rng = mulberry32(
    (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
  );

  // Extract genes from bytes
  const b0 = bytes[0], b1 = bytes[1], b2 = bytes[2], b3 = bytes[3];
  const b4 = bytes[4], b5 = bytes[5], b6 = bytes[6], b7 = bytes[7];
  const b8 = bytes[8], b9 = bytes[9], b10 = bytes[10], b11 = bytes[11];

  return {
    bodyPlan:     (b0 % 6) as DNA["bodyPlan"],
    bodySize:     b0 >> 4 & 0x7,
    aspect:       b1 % 7,
    segments:     (b1 >> 3) % 5,
    edgeNoise:    b2 % 6,
    limbType:     (b2 >> 3 % 7) as DNA["limbType"],
    limbCount:    b3 % 6,
    limbLength:   (b3 >> 3) % 5,
    attachSpread: b4 % 8,
    limbMotion:   (b4 >> 3 & 0x3) as DNA["limbMotion"],
    eyeCount:     (b5 & 0x3) as DNA["eyeCount"],
    eyeShape:     (b5 >> 2 % 6) as DNA["eyeShape"],
    eyeSize:      (b5 >> 5) % 4,
    pupil:        (b6 & 0x3) as DNA["pupil"],
    expression:   ((b6 >> 2) & 0x3) as DNA["expression"],
    mouth:        (b6 >> 4) % 5 as DNA["mouth"],
    appendage:    (b7 & 0x7) as DNA["appendage"],
    hue:          b7 >> 3 & 0xF,
    scheme:       (b8 & 0x3) as DNA["scheme"],
    accentTarget: ((b8 >> 2) % 3) as DNA["accentTarget"],
    marking:      (b8 >> 4) % 5 as DNA["marking"],
    idleStyle:    (b9 % 6) as DNA["idleStyle"],
    tempo:        ((b9 >> 3) % 3) as DNA["tempo"],
    jitterSeed:   (b10 << 8) | b11,
    rareFlags:    b8 ^ b9,  // derived from middle bytes for entropy
  };
}

// Build genome from mini-game results + optional parent
export interface MiniGameResult {
  gameId: 'spark' | 'thread' | 'pulse' | 'motes' | 'breathe' | 'flinch' | 'hold' | 'trace';
  score: number;          // 0-1
  rawValue: number;       // game-specific: taps/sec, deviation, BPM accuracy, etc.
  timestamps: number[];   // raw touch event times
}

export function buildGenome(
  results: MiniGameResult[],
  parentGenome?: string,
  luckTokens: number = 0
): string {
  // Hash timestamps for true entropy
  const allTimes = results.flatMap(r => r.timestamps);
  let entropyHash = 0x811c9dc5;
  for (const t of allTimes) {
    entropyHash ^= Math.floor(t) & 0xFFFFFFFF;
    entropyHash = (Math.imul(entropyHash, 0x01000193)) >>> 0;
    entropyHash ^= Math.floor((t % 1) * 1000) & 0xFFFF;
    entropyHash = (Math.imul(entropyHash, 0x01000193)) >>> 0;
  }

  const rng = mulberry32(entropyHash);
  const bytes = new Uint8Array(12);
  for (let i = 0; i < 12; i++) bytes[i] = Math.floor(rng() * 256);

  // Map game results to specific genes
  for (const r of results) {
    const s = r.score;
    const v = r.rawValue;

    if (r.gameId === 'spark') {
      // tempo from taps/sec
      const tempo = v < 4 ? 0 : v < 7 ? 1 : 2;
      bytes[9] = (bytes[9] & 0b11111000) | tempo;
      // limbCount from total taps
      const lc = Math.min(5, Math.floor(v * 0.6));
      bytes[3] = (bytes[3] & 0b11111000) | lc;
    }
    if (r.gameId === 'thread') {
      // limbType from deviation (smooth→tentacles, rough→spikes)
      const lt = v < 12 ? 1 : v < 30 ? 2 : 4;
      bytes[2] = (bytes[2] & 0b11000111) | (lt << 3);
      // edgeNoise from deviation
      bytes[2] = (bytes[2] & 0b11111000) | Math.min(5, Math.floor(v / 6));
    }
    if (r.gameId === 'pulse') {
      // idleStyle from rhythm accuracy
      const is = s > 0.8 ? 1 : s > 0.5 ? 3 : 5;
      bytes[9] = (bytes[9] & 0b00000111) | (is << 3);
    }
    if (r.gameId === 'motes') {
      // eyeCount from catch rate
      const ec = s < 0.3 ? 0 : s < 0.6 ? 1 : s < 0.9 ? 2 : 3;
      bytes[5] = (bytes[5] & 0b11111100) | ec;
    }
    if (r.gameId === 'hold') {
      // bodyPlan from drift (still→crystalline/radial, drift→blob/wisp)
      const bp = v < 8 ? 3 : v < 25 ? 0 : 4;
      bytes[0] = (bytes[0] & 0b11111000) | bp;
    }
    if (r.gameId === 'trace') {
      // bodyPlan bias from stroke geometry
      const bp = v < 2 ? 0 : v < 4 ? 3 : v < 6 ? 2 : 4;
      bytes[0] = (bytes[0] & 0b11111000) | bp;
    }
    if (r.gameId === 'breathe') {
      // bodySize from fullness
      const bs = Math.floor(s * 7);
      bytes[0] = (bytes[0] & 0b10001111) | (bs << 4);
      // scheme from timing consistency
      const sc = s > 0.8 ? 0 : s > 0.5 ? 2 : 1;
      bytes[8] = (bytes[8] & 0b11111100) | sc;
    }
    if (r.gameId === 'flinch') {
      // appendage from deflection count
      const ap = v === 0 ? 2 : v < 3 ? 1 : v < 6 ? 3 : 6;
      bytes[7] = (bytes[7] & 0b11111000) | ap;
    }
  }

  // Trait Echo — inherit from parent
  if (parentGenome && parentGenome.length === 24) {
    const pBytes = new Uint8Array(12);
    for (let i = 0; i < 12; i++) {
      pBytes[i] = parseInt(parentGenome.slice(i * 2, i * 2 + 2), 16);
    }
    const echoRng = mulberry32(entropyHash ^ 0xDEADBEEF);
    // 25% chance each of bodyPlan, hue, idleStyle to be inherited
    if (echoRng() < 0.25) bytes[0] = (bytes[0] & 0b11111000) | (pBytes[0] & 0b00000111);
    if (echoRng() < 0.25) bytes[7] = (bytes[7] & 0b00000111) | (pBytes[7] & 0b11111000);
    if (echoRng() < 0.25) bytes[9] = (bytes[9] & 0b00000111) | (pBytes[9] & 0b11111000);
  }

  // Rare flags — luck-boosted
  const rareFlagByte = rollRareFlags(rng, luckTokens);
  bytes[8] = (bytes[8] & 0b00001111) | ((rareFlagByte & 0xF) << 4);
  bytes[11] = (bytes[11] & 0b11110000) | ((rareFlagByte >> 4) & 0xF);

  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function rollRareFlags(rng: () => number, luckTokens: number): number {
  const mult = Math.pow(1.5, luckTokens);
  const roll = (base: number) => rng() < Math.min(base * mult, 0.6);
  let flags = 0;
  if (roll(1/64))  flags |= 0b00000001; // chromatic
  if (roll(1/48))  flags |= 0b00000010; // halo
  if (roll(1/32))  flags |= 0b00000100; // heterochromia
  if (roll(1/40))  flags |= 0b00001000; // voidEyes
  if (roll(1/100)) flags |= 0b00010000; // twinMote
  if (roll(1/128)) flags |= 0b00100000; // prismatic
  if (roll(1/77))  flags |= 0b01000000; // glyph
  if (roll(1/56))  flags |= 0b10000000; // asymmetryBreak
  return flags;
}

export function getRareTraits(dna: DNA): RareTraits {
  const f = dna.rareFlags;
  return {
    chromatic:     !!(f & 0b00000001),
    halo:          !!(f & 0b00000010),
    heterochromia: !!(f & 0b00000100),
    voidEyes:      !!(f & 0b00001000),
    twinMote:      !!(f & 0b00010000),
    prismatic:     !!(f & 0b00100000),
    glyph:         !!(f & 0b01000000),
    asymmetryBreak:!!(f & 0b10000000),
  };
}

export function getHue(dna: DNA): number {
  return dna.hue * 30; // 0, 30, 60, ... 330
}

export function getAccentHue(dna: DNA): number {
  const base = getHue(dna);
  if (dna.scheme === 0) return (base + 25) % 360;        // analogous
  if (dna.scheme === 1) return (base + 180) % 360;       // complement
  return (base + 120) % 360;                              // triad
}

export function getTempoMultiplier(dna: DNA): number {
  return [0.6, 1.0, 1.6][dna.tempo];
}

// Combinatorics — for the "1 in N" display
export function computeRarity(dna: DNA): number {
  // Tier-1 visible read: bodyPlan × limbType × hue
  const tier1 = 6 * 7 * 12; // 504
  // Rare flags bonus
  const rareFactor = Math.max(1, dna.rareFlags === 0 ? 1 : 4 * dna.rareFlags);
  return Math.round(tier1 * rareFactor);
}

// Generated handle — adjective from expression+tempo, noun from bodyPlan+limbType
const ADJECTIVES = ["Languid","Steady","Quicksilver","Curious","Calm","Feral","Smug","Hollow"];
const NOUNS = [
  ["Blobkin","Wispling","Shardkin","Urchin","Tendril","Moteling","Nubkin"],
  ["Lobeform","Lobeform","Lobeform","Lobeform","Lobeform","Lobeform","Lobeform"],
  ["Radiance","Trilobe","Orbital","Radiance","Radiance","Radiance","Radiance"],
  ["Shard","Crystal","Faceter","Shard","Shard","Shard","Shard"],
  ["Wispling","Drift","Wispling","Wispling","Wispling","Wispling","Wispling"],
  ["Asymmorph","Lobe","Lobe","Lobe","Lobe","Lobe","Lobe"],
];

export function generateName(dna: DNA, genomeSuffix: string): string {
  const adj = ADJECTIVES[dna.expression * 2 + dna.tempo] ?? "Curious";
  const noun = NOUNS[dna.bodyPlan]?.[dna.limbType] ?? "Creature";
  const suffix = genomeSuffix.slice(-4).toUpperCase();
  return `${adj} ${noun} #${suffix}`;
}

// Generate a random new genome (for "new creature" path)
export function randomGenome(parentGenome?: string): string {
  const seed = Math.floor(Math.random() * 0xFFFFFFFF);
  const rng = mulberry32(seed);
  const bytes = new Uint8Array(12);
  for (let i = 0; i < 12; i++) bytes[i] = Math.floor(rng() * 256);
  // Use as blank mini-game results
  return buildGenome([], parentGenome, 0);
}
