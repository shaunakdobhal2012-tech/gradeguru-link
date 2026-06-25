import { useSyncExternalStore } from "react";
import { assignments as seedAssignments, type AssignmentStatus } from "./mock-data";
import { estimateMinutes } from "./estimate";

export type Assignment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  status: AssignmentStatus;
  grade: string | null;
  estimateMin: number;
  splitInto?: number; // count of chunks (manual or auto-decided)
  splitManual?: boolean; // true when user picked it — auto-arrange must respect
};

export type ChunkPlacement = {
  chunkId: string;
  assignmentId: string;
  partIndex: number; // 1-based
  partsTotal: number;
  durationMin: number;
  dayIdx: number;
  slot: number;
};

type State = {
  assignments: Assignment[];
  placements: ChunkPlacement[];
  flagged: Record<string, string>; // assignmentId -> reason
};

let state: State = {
  assignments: seedAssignments.map((a) => ({
    ...a,
    estimateMin: estimateMinutes(a.title, a.description, a.subject),
  })),
  placements: [],
  flagged: {},
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  emit();
};

export const assignmentsStore = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  addAssignment(input: {
    title: string;
    description: string;
    subject: string;
    dueDate: string;
    status?: AssignmentStatus;
    estimateMin?: number;
  }): Assignment {
    const id = `a-${Date.now().toString(36)}`;
    const a: Assignment = {
      id,
      title: input.title,
      description: input.description,
      subject: input.subject,
      dueDate: input.dueDate,
      status: input.status ?? "pending",
      grade: null,
      estimateMin:
        input.estimateMin ??
        estimateMinutes(input.title, input.description, input.subject),
    };
    set({ assignments: [a, ...state.assignments] });
    return a;
  },
  updateEstimate(id: string, mins: number) {
    const m = Math.max(15, Math.min(600, Math.round(mins / 15) * 15));
    set({
      assignments: state.assignments.map((a) =>
        a.id === id ? { ...a, estimateMin: m } : a,
      ),
      placements: state.placements.filter((p) => p.assignmentId !== id),
      flagged: omitKey(state.flagged, id),
    });
  },
  setManualSplit(id: string, parts: number) {
    const n = Math.max(2, Math.min(5, Math.round(parts)));
    set({
      assignments: state.assignments.map((a) =>
        a.id === id ? { ...a, splitInto: n, splitManual: true } : a,
      ),
      placements: state.placements.filter((p) => p.assignmentId !== id),
      flagged: omitKey(state.flagged, id),
    });
  },
  clearSplit(id: string) {
    set({
      assignments: state.assignments.map((a) => {
        if (a.id !== id) return a;
        const { splitInto: _s, splitManual: _m, ...rest } = a;
        return rest as Assignment;
      }),
      placements: state.placements.filter((p) => p.assignmentId !== id),
      flagged: omitKey(state.flagged, id),
    });
  },
  applyAutoSplit(id: string, parts: number) {
    // Auto (non-manual) split decision — preserved until user edits / clears.
    set({
      assignments: state.assignments.map((a) =>
        a.id === id && !a.splitManual
          ? { ...a, splitInto: parts, splitManual: false }
          : a,
      ),
    });
  },
  setPlacements(next: ChunkPlacement[], flagged: Record<string, string> = {}) {
    set({ placements: next, flagged });
  },
  placeChunk(chunk: ChunkPlacement) {
    set({
      placements: [
        ...state.placements.filter((p) => p.chunkId !== chunk.chunkId),
        chunk,
      ],
      flagged: omitKey(state.flagged, chunk.assignmentId),
    });
  },
  removePlacement(chunkId: string) {
    set({ placements: state.placements.filter((p) => p.chunkId !== chunkId) });
  },
  clearAllPlacements() {
    set({ placements: [], flagged: {} });
  },
  flagAssignment(id: string, reason: string) {
    set({ flagged: { ...state.flagged, [id]: reason } });
  },
};

function omitKey<T extends Record<string, unknown>>(o: T, k: string): T {
  if (!(k in o)) return o;
  const { [k]: _, ...rest } = o;
  return rest as T;
}

export function useAssignmentsStore(): State {
  return useSyncExternalStore(
    assignmentsStore.subscribe,
    assignmentsStore.get,
    assignmentsStore.get,
  );
}

// Chunks an assignment produces given its split decision.
export type Chunk = {
  chunkId: string;
  assignmentId: string;
  partIndex: number;
  partsTotal: number;
  durationMin: number;
};

export function chunksFor(a: Assignment): Chunk[] {
  const parts = a.splitInto && a.splitInto >= 2 ? a.splitInto : 1;
  if (parts === 1) {
    return [
      {
        chunkId: `${a.id}#1of1`,
        assignmentId: a.id,
        partIndex: 1,
        partsTotal: 1,
        durationMin: a.estimateMin,
      },
    ];
  }
  const each = Math.max(15, Math.round(a.estimateMin / parts / 15) * 15);
  return Array.from({ length: parts }, (_, i) => ({
    chunkId: `${a.id}#${i + 1}of${parts}`,
    assignmentId: a.id,
    partIndex: i + 1,
    partsTotal: parts,
    durationMin: each,
  }));
}
