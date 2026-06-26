import { useSyncExternalStore } from "react";

const TYPE_BASE: Array<[RegExp, number, string]> = [
  [/lab\s*report/i, 120, "lab report"],
  [/essay/i, 150, "essay"],
  [/quiz\s*prep|quiz/i, 90, "quiz prep"],
  [/problem\s*set/i, 75, "problem set"],
  [/project/i, 180, "project"],
  [/worksheet/i, 60, "worksheet"],
];

const BONUS: Array<[RegExp, number]> = [
  [/analysis/i, 30],
  [/research/i, 45],
  [/presentation/i, 60],
  [/\bgroup\b/i, 30],
];

// approx units → "one unit" of effort
const UNIT_SCALE: Record<string, number> = {
  page: 1, pages: 1,
  word: 1 / 250, words: 1 / 250,
  chapter: 1, chapters: 1,
  problem: 1, problems: 1,
  question: 1, questions: 1,
};

const UNIT_RE = /(\d+)\s*-?\s*(\d+)?\s*(pages?|words?|chapters?|problems?|questions?)/gi;

export function estimateMinutes(a: { title: string; description: string }): {
  minutes: number;
  type: string;
} {
  const text = `${a.title} ${a.description}`;
  let base = 60;
  let type = "task";
  for (const [re, mins, label] of TYPE_BASE) {
    if (re.test(text)) {
      base = mins;
      type = label;
      break;
    }
  }
  let unitBonus = 0;
  for (const m of text.matchAll(UNIT_RE)) {
    const a1 = parseInt(m[1], 10);
    const a2 = m[2] ? parseInt(m[2], 10) : a1;
    const count = Math.max(a1, a2);
    const scale = UNIT_SCALE[m[3].toLowerCase()] ?? 1;
    if (!Number.isNaN(count)) unitBonus += 15 * count * scale;
  }
  unitBonus = Math.min(Math.round(unitBonus), 240);
  let bonus = 0;
  for (const [re, mins] of BONUS) if (re.test(text)) bonus += mins;
  // snap to 15
  const total = Math.max(30, Math.round((base + unitBonus + bonus) / 15) * 15);
  return { minutes: total, type };
}

export function fmtMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// --- Split store (assignment id -> number of parts, 2..5) ---

type SplitMap = Record<string, number>;
let splits: SplitMap = {};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function getSplits(): SplitMap {
  return splits;
}

export function setSplit(id: string, parts: number | null) {
  const next = { ...splits };
  if (parts == null || parts <= 1) delete next[id];
  else next[id] = Math.min(5, Math.max(2, Math.round(parts)));
  splits = next;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useSplits(): SplitMap {
  return useSyncExternalStore(subscribe, getSplits, getSplits);
}
