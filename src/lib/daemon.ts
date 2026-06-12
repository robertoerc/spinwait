// DAEMON — game state engine
// Persisted in localStorage under the key "daemon_v1"

export type Stage = "egg" | "larva" | "juvenile" | "mature" | "shipping";

export interface DaemonTraits {
  nocturnal: boolean;   // >50% charges after 8pm / before 6am
  quicksilver: boolean; // average charge <12s
  resonant: boolean;    // >30% of charge time in resonance zone
}

export interface DreamShard {
  id: string;
  rarity: "common" | "rare" | "legendary";
  name: string;
  emoji: string;
  earnedAt: number;
}

export interface ShelfEntry {
  generation: number;
  totalFlux: number;
  uptime: number;
  traits: DaemonTraits;
  resonanceGrade: string;
  shippedAt: number;
  genome: string; // 24-char hex
}

export interface DaemonState {
  // Meta
  version: number;
  generation: number;
  lineageMultiplier: number; // 1 + (generation-1)*0.15

  // Flux
  flux: number;
  totalFluxEarned: number;
  stage: Stage;

  // Uptime streak
  uptime: number;          // days
  lastChargeDate: string;  // ISO date "YYYY-MM-DD"
  isHibernating: boolean;

  // Resonance / skill tracking
  totalChargeDuration: number;    // seconds
  resonanceSeconds: number;        // seconds spent in the zone
  chargeSessions: number;
  avgChargeDuration: number;

  // Trait raw counts
  nightCharges: number;  // charges between 8pm-6am
  totalCharges: number;

  // Clean Exit
  cleanExits: number;
  consecutiveCleanExits: number;

  // Idle dream
  lastCloseTime: number; // epoch ms
  dreamFluxPending: number;
  pendingShard: DreamShard | null;

  // Collection
  shards: DreamShard[];
  shelf: ShelfEntry[];

  // Visual
  genome: string; // 24-char hex — empty until birth sequence completes
  hatched: boolean; // has the egg ever been cracked?

  // Resonance grade cached
  resonanceGrade: string; // S A B C D F
}

const FLUX_THRESHOLDS: Record<Stage, number> = {
  egg: 0,
  larva: 400,
  juvenile: 1800,
  mature: 7000,
  shipping: 22000,
};

export const STAGE_LABELS: Record<Stage, string> = {
  egg: "egg [1/5]",
  larva: "larva [2/5]",
  juvenile: "juvenile [3/5]",
  mature: "mature [4/5]",
  shipping: "ready to ship [5/5]",
};

const STAGE_ORDER: Stage[] = ["egg", "larva", "juvenile", "mature", "shipping"];

// Max idle accumulation: 4 hours worth at 4 flux/min
const DREAM_FLUX_RATE = 4; // per minute
const DREAM_FLUX_MAX = 4 * 60 * DREAM_FLUX_RATE; // 960

const SHARD_POOL: Omit<DreamShard, "id" | "earnedAt">[] = [
  { rarity: "common", name: "Ghost Bit", emoji: "◌" },
  { rarity: "common", name: "Null Byte", emoji: "∅" },
  { rarity: "common", name: "Lost Ping", emoji: "◈" },
  { rarity: "rare", name: "Race Condition", emoji: "⟳" },
  { rarity: "rare", name: "Segfault Echo", emoji: "⚡" },
  { rarity: "rare", name: "Stack Ghost", emoji: "𝛿" },
  { rarity: "legendary", name: "Root Access", emoji: "◉" },
  { rarity: "legendary", name: "The Daemon Fork", emoji: "⑂" },
];

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getHour(): number {
  return new Date().getHours();
}

function rollShard(): DreamShard | null {
  // ~30% chance per dream check, weighted by rarity
  const roll = Math.random();
  if (roll > 0.30) return null;
  const rarity = roll < 0.03 ? "legendary" : roll < 0.12 ? "rare" : "common";
  const pool = SHARD_POOL.filter((s) => s.rarity === rarity);
  const template = pool[Math.floor(Math.random() * pool.length)];
  return { ...template, id: genId(), earnedAt: Date.now() };
}

function stageForFlux(totalFlux: number): Stage {
  const stages = STAGE_ORDER.slice().reverse();
  for (const s of stages) {
    if (totalFlux >= FLUX_THRESHOLDS[s]) return s;
  }
  return "egg";
}

function gradeForRatio(ratio: number): string {
  if (ratio >= 0.5) return "S";
  if (ratio >= 0.35) return "A";
  if (ratio >= 0.22) return "B";
  if (ratio >= 0.12) return "C";
  if (ratio >= 0.05) return "D";
  return "F";
}

export function defaultState(): DaemonState {
  return {
    version: 1,
    generation: 1,
    lineageMultiplier: 1,
    flux: 0,
    totalFluxEarned: 0,
    stage: "egg",
    uptime: 0,
    lastChargeDate: "",
    isHibernating: false,
    totalChargeDuration: 0,
    resonanceSeconds: 0,
    chargeSessions: 0,
    avgChargeDuration: 0,
    nightCharges: 0,
    totalCharges: 0,
    cleanExits: 0,
    consecutiveCleanExits: 0,
    lastCloseTime: Date.now(),
    dreamFluxPending: 0,
    pendingShard: null,
    shards: [],
    shelf: [],
    genome: "",
    hatched: false,
    resonanceGrade: "F",
  };
}

const STORAGE_KEY = "daemon_v1";

export function loadState(): DaemonState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as DaemonState;
    // Migrate / patch missing fields
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(s: DaemonState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // storage full — ignore
  }
}

// Called on app open — compute dream flux + check uptime
export function processWakeUp(s: DaemonState): DaemonState {
  const now = Date.now();
  const minutesAsleep = Math.max(0, (now - s.lastCloseTime) / 60000);
  const dreamFlux = Math.min(minutesAsleep * DREAM_FLUX_RATE, DREAM_FLUX_MAX);
  const shard = minutesAsleep > 5 ? rollShard() : null;

  // Uptime check
  const today = todayStr();
  let uptime = s.uptime;
  let isHibernating = s.isHibernating;

  if (s.lastChargeDate === "") {
    // Brand new — no streak yet
  } else {
    const lastDate = new Date(s.lastChargeDate);
    const todayDate = new Date(today);
    const diffDays = Math.round(
      (todayDate.getTime() - lastDate.getTime()) / 86400000
    );
    if (diffDays > 1) {
      // Missed day(s) — hibernate but don't reset
      isHibernating = true;
    }
  }

  return {
    ...s,
    dreamFluxPending: Math.round(dreamFlux),
    pendingShard: shard,
    isHibernating,
    lastCloseTime: now,
  };
}

// Collect the pending dream reward — call after showing the wake animation
export function collectDream(s: DaemonState): DaemonState {
  const earned = Math.round(s.dreamFluxPending * s.lineageMultiplier);
  const newFlux = s.flux + earned;
  const newTotal = s.totalFluxEarned + earned;
  const newStage = stageForFlux(newTotal);
  const newShards = s.pendingShard
    ? [...s.shards, s.pendingShard]
    : s.shards;

  return {
    ...s,
    flux: newFlux,
    totalFluxEarned: newTotal,
    stage: newStage,
    dreamFluxPending: 0,
    pendingShard: null,
    shards: newShards,
  };
}

export interface ChargeResult {
  fluxEarned: number;
  isCleanExit: boolean;
  resonanceBonus: number;
}

// Called when a charge session ends
export function applyCharge(
  s: DaemonState,
  opts: {
    durationSeconds: number;
    resonanceSeconds: number;
    isCleanExit: boolean;
  }
): DaemonState {
  const { durationSeconds, resonanceSeconds, isCleanExit } = opts;
  const BASE_RATE = 10; // flux per second

  let earned = durationSeconds * BASE_RATE * s.lineageMultiplier;

  // Resonance bonus (up to 2x extra)
  const resonanceRatio = resonanceSeconds / Math.max(durationSeconds, 1);
  const resonanceBonus = resonanceRatio * 2;
  earned *= 1 + resonanceBonus;

  // Clean exit bonus
  if (isCleanExit) earned *= 1.25;

  earned = Math.round(earned);

  const newFlux = s.flux + earned;
  const newTotal = s.totalFluxEarned + earned;
  const newStage = stageForFlux(newTotal);

  // Update skill tracking
  const newTotalDuration = s.totalChargeDuration + durationSeconds;
  const newResonanceSec = s.resonanceSeconds + resonanceSeconds;
  const newSessions = s.chargeSessions + 1;
  const newAvg = newTotalDuration / newSessions;

  // Uptime
  const today = todayStr();
  let uptime = s.uptime;
  let isHibernating = s.isHibernating;
  let lastChargeDate = s.lastChargeDate;

  if (s.lastChargeDate !== today) {
    if (!isHibernating) {
      uptime += 1;
    } else {
      // Waking from hibernation — keep existing uptime, just clear hibernation
      isHibernating = false;
    }
    lastChargeDate = today;
  }

  // Night charge tracking
  const hour = getHour();
  const isNight = hour >= 20 || hour < 6;

  // Trait evaluation
  const totalCharges = s.totalCharges + 1;
  const nightCharges = s.nightCharges + (isNight ? 1 : 0);
  const traits: DaemonTraits = {
    nocturnal: nightCharges / totalCharges > 0.5,
    quicksilver: newAvg < 12,
    resonant: newResonanceSec / Math.max(newTotalDuration, 1) > 0.3,
  };

  const cleanExits = s.cleanExits + (isCleanExit ? 1 : 0);
  const consecutiveCleanExits = isCleanExit
    ? s.consecutiveCleanExits + 1
    : 0;

  const resonanceGrade = gradeForRatio(
    newResonanceSec / Math.max(newTotalDuration, 1)
  );

  const hatched = s.hatched || newTotal > 0;

  return {
    ...s,
    flux: newFlux,
    totalFluxEarned: newTotal,
    stage: newStage,
    uptime,
    lastChargeDate,
    isHibernating,
    totalChargeDuration: newTotalDuration,
    resonanceSeconds: newResonanceSec,
    chargeSessions: newSessions,
    avgChargeDuration: newAvg,
    nightCharges,
    totalCharges,
    cleanExits,
    consecutiveCleanExits,
    resonanceGrade,
    hatched,
  };
}

// Ship the daemon — prestige reset
export function shipDaemon(s: DaemonState): DaemonState {
  const entry: ShelfEntry = {
    generation: s.generation,
    totalFlux: s.totalFluxEarned,
    uptime: s.uptime,
    traits: {
      nocturnal: s.nightCharges / Math.max(s.totalCharges, 1) > 0.5,
      quicksilver: s.avgChargeDuration < 12,
      resonant: s.resonanceSeconds / Math.max(s.totalChargeDuration, 1) > 0.3,
    },
    resonanceGrade: s.resonanceGrade,
    shippedAt: Date.now(),
    genome: s.genome,
  };

  const generation = s.generation + 1;
  const lineageMultiplier = 1 + (generation - 1) * 0.15;

  return {
    ...defaultState(),
    generation,
    lineageMultiplier,
    shelf: [...s.shelf, entry],
    shards: s.shards, // keep shards across generations
    genome: "",       // cleared — new birth sequence required
    hatched: false,
    lastCloseTime: Date.now(),
  };
}

export function formatFlux(n: number): string {
  // Terminal style: 4_204 instead of 4,204
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "_");
}

export function progressToNextStage(totalFlux: number): number {
  const stage = stageForFlux(totalFlux);
  if (stage === "shipping") return 1;
  const idx = STAGE_ORDER.indexOf(stage);
  const next = STAGE_ORDER[idx + 1];
  const lo = FLUX_THRESHOLDS[stage];
  const hi = FLUX_THRESHOLDS[next];
  return Math.min((totalFlux - lo) / (hi - lo), 1);
}
