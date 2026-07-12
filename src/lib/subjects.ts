// Subject color palette. Used to color-code cards, calendar, tetris.
// Users type free-form subject names; we map by normalized name to a color.
// Unknown subjects get a deterministic color from the palette.

const PALETTE = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16", "#a855f7",
];

const KNOWN: Record<string, string> = {
  math: "#3b82f6", mathematics: "#3b82f6",
  physics: "#8b5cf6",
  chemistry: "#10b981",
  biology: "#f59e0b",
  english: "#ef4444",
  history: "#06b6d4",
  geography: "#14b8a6",
  cs: "#6366f1", "computer science": "#6366f1",
  art: "#ec4899",
  music: "#a855f7",
  pe: "#f97316", "physical education": "#f97316",
};

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function subjectColor(name: string | null | undefined): string {
  if (!name) return PALETTE[0];
  const key = name.trim().toLowerCase();
  if (KNOWN[key]) return KNOWN[key];
  return PALETTE[hashStr(key) % PALETTE.length];
}

export const DEFAULT_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English", "History", "Geography", "Computer Science",
];
