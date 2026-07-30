import { create } from "zustand";
import { scoreEditKey } from "./data";
import type {
  AppData,
  EvaluationChange,
  EvaluationMode,
  EvaluationSourceMode,
} from "./types";

const KEY = "radar-bm-session";

type Saved = {
  sourceMode: EvaluationSourceMode;
  edits: Record<string, number>;
  changes: EvaluationChange[];
  selectedBoards: string[];
};

const emptySaved: Saved = {
  sourceMode: "official",
  edits: {},
  changes: [],
  selectedBoards: [],
};

function loadSaved(): Saved {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return emptySaved;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    return {
      sourceMode: parsed.sourceMode === "heath" ? "heath" : "official",
      edits: parsed.edits ?? {},
      changes: parsed.changes ?? [],
      selectedBoards: parsed.selectedBoards ?? [],
    };
  } catch {
    return emptySaved;
  }
}

function persist(state: Saved) {
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

function hashPayload(sourceMode: EvaluationSourceMode, edits: Record<string, number>) {
  return JSON.stringify({
    methodologyVersion: "Radar BM v1.0",
    sourceMode,
    edits: Object.entries(edits).sort(([left], [right]) => left.localeCompare(right)),
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

type EditScoreInput = {
  boardDate: string;
  evaluationId: string;
  person: string;
  criterionId: string;
  criterion: string;
  originalValue: number;
  newValue: number;
};

type Store = {
  data: AppData | null;
  sourceMode: EvaluationSourceMode;
  mode: EvaluationMode;
  edits: Record<string, number>;
  changes: EvaluationChange[];
  evaluationHash: string;
  selectedBoards: string[];
  activeBoard: string;
  activeTab: number;
  setData: (data: AppData) => void;
  setSourceMode: (mode: EvaluationSourceMode) => void;
  selectBoard: (date: string) => void;
  setActiveTab: (tab: number) => void;
  editScore: (input: EditScoreInput) => void;
  resetEvaluation: () => void;
};

const saved = loadSaved();

export const useRadarStore = create<Store>((set, get) => {
  const refreshHash = async (sourceMode: EvaluationSourceMode, edits: Record<string, number>) => {
    const payload = hashPayload(sourceMode, edits);
    const evaluationHash = await sha256(payload);
    if (hashPayload(get().sourceMode, get().edits) === payload) set({ evaluationHash });
  };

  void refreshHash(saved.sourceMode, saved.edits);

  return {
    data: null,
    sourceMode: saved.sourceMode,
    mode: Object.keys(saved.edits).length ? "custom" : saved.sourceMode,
    edits: saved.edits,
    changes: saved.changes,
    evaluationHash: "",
    selectedBoards: saved.selectedBoards,
    activeBoard: saved.selectedBoards.at(-1) ?? "",
    activeTab: 0,
    setData: (data) => {
      const validSavedDates = get().selectedBoards.filter((date) => data.timeline.includes(date));
      set({
        data,
        selectedBoards: validSavedDates.length ? validSavedDates : [data.metadata.latestDate],
        activeBoard: validSavedDates.at(-1) ?? data.metadata.latestDate,
      });
    },
    setSourceMode: (sourceMode) => {
      const next = {
        sourceMode,
        edits: {},
        changes: [],
        selectedBoards: get().selectedBoards,
      };
      persist(next);
      set({ sourceMode, mode: sourceMode, edits: {}, changes: [] });
      void refreshHash(sourceMode, {});
    },
    selectBoard: (date) => {
      const current = get().selectedBoards.filter((item) => item !== date);
      const selectedBoards = [...current, date].slice(-3);
      persist({
        sourceMode: get().sourceMode,
        edits: get().edits,
        changes: get().changes,
        selectedBoards,
      });
      set({ selectedBoards, activeBoard: date, activeTab: 0 });
    },
    setActiveTab: (activeTab) => set({ activeTab }),
    editScore: (input) => {
      if (!Number.isFinite(input.newValue) || input.newValue < 0 || input.newValue > 10) return;
      const key = scoreEditKey(input.boardDate, input.evaluationId, input.criterionId);
      const edits = { ...get().edits };
      if (input.newValue === input.originalValue) delete edits[key];
      else edits[key] = input.newValue;
      const change: EvaluationChange = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        boardDate: input.boardDate,
        evaluationId: input.evaluationId,
        person: input.person,
        criterionId: input.criterionId,
        criterion: input.criterion,
        originalValue: input.originalValue,
        newValue: input.newValue,
        sourceMode: get().sourceMode,
        timestamp: new Date().toISOString(),
      };
      const changes = [...get().changes, change];
      const mode: EvaluationMode = Object.keys(edits).length ? "custom" : get().sourceMode;
      persist({
        sourceMode: get().sourceMode,
        edits,
        changes,
        selectedBoards: get().selectedBoards,
      });
      set({ edits, changes, mode });
      void refreshHash(get().sourceMode, edits);
    },
    resetEvaluation: () => {
      const sourceMode = get().sourceMode;
      const selectedBoards = get().selectedBoards;
      persist({ sourceMode, edits: {}, changes: [], selectedBoards });
      set({ mode: sourceMode, edits: {}, changes: [] });
      void refreshHash(sourceMode, {});
    },
  };
});
