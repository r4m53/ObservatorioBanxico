import { create } from "zustand";
import type { AppData, EvaluationMode } from "./types";

const KEY = "radar-bm-session";
type Saved = { mode: EvaluationMode; edits: Record<string, number>; selectedBoards: string[] };

function loadSaved(): Saved {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch { /* ignore corrupt local session */ }
  return { mode: "official", edits: {}, selectedBoards: [] };
}

type Store = {
  data: AppData | null;
  mode: EvaluationMode;
  edits: Record<string, number>;
  selectedBoards: string[];
  activeTab: number;
  setData: (data: AppData) => void;
  setMode: (mode: EvaluationMode) => void;
  selectBoard: (date: string) => void;
  setActiveTab: (tab: number) => void;
  editScore: (evaluationId: string, criterionId: string, value: number) => void;
  reset: () => void;
};

const saved = loadSaved();
const persist = (state: Pick<Store, "mode" | "edits" | "selectedBoards">) =>
  sessionStorage.setItem(KEY, JSON.stringify(state));

export const useRadarStore = create<Store>((set, get) => ({
  data: null,
  mode: saved.mode,
  edits: saved.edits,
  selectedBoards: saved.selectedBoards,
  activeTab: 0,
  setData: (data) => {
    const validSavedDates = get().selectedBoards.filter((date) => data.timeline.includes(date));
    set({
      data,
      selectedBoards: validSavedDates.length ? validSavedDates : [data.metadata.latestDate],
    });
  },
  setMode: (mode) => {
    const next = { ...get(), mode, edits: {} };
    persist(next);
    set({ mode, edits: {} });
  },
  selectBoard: (date) => {
    const current = get().selectedBoards.filter((d) => d !== date);
    const nextBoards = [...current, date].slice(-3);
    persist({ ...get(), selectedBoards: nextBoards });
    set({ selectedBoards: nextBoards, activeTab: 0 });
  },
  setActiveTab: (activeTab) => set({ activeTab }),
  editScore: (evaluationId, criterionId, value) => {
    const edits = { ...get().edits, [`${evaluationId}:${criterionId}`]: value };
    const next = { ...get(), edits, mode: "custom" as const };
    persist(next);
    set({ edits, mode: "custom" });
  },
  reset: () => {
    sessionStorage.removeItem(KEY);
    const latest = get().data?.metadata.latestDate;
    set({ mode: "official", edits: {}, selectedBoards: latest ? [latest] : [] });
  },
}));
