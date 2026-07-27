import type { AppData, Board, Evaluation } from "./types";

export async function loadData(): Promise<AppData> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/radar-bm.json`);
  if (!response.ok) throw new Error("No fue posible cargar los datos de Radar BM.");
  return response.json() as Promise<AppData>;
}

export function evaluationFor(data: AppData, boardDate: string, personName: string, mode: "official" | "heath" | "custom"): Evaluation | undefined {
  const limit = new Date(boardDate).getTime();
  const candidates = data.evaluations
    .filter((e) => e.person === personName && new Date(e.date).getTime() <= limit)
    .filter((e) => mode !== "heath" || e.origin.toLowerCase().includes("heath"))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return candidates[0] ?? data.evaluations
    .filter((e) => e.person === personName && new Date(e.date).getTime() <= limit)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function nearestBoard(data: AppData, date: string): Board {
  const target = new Date(date).getTime();
  return [...data.boards].sort((a, b) =>
    Math.abs(new Date(a.date).getTime() - target) - Math.abs(new Date(b.date).getTime() - target)
  )[0];
}
