import type { AppData, Board, Evaluation } from "./types";

export async function loadData(): Promise<AppData> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/radar-bm.json`);
  if (!response.ok) throw new Error("No fue posible cargar los datos de Radar BM.");
  return response.json() as Promise<AppData>;
}

export function evaluationFor(data: AppData, boardDate: string, personName: string, mode: "official" | "heath" | "custom"): Evaluation | undefined {
  const limit = new Date(boardDate).getTime();
  const origin = mode === "heath" ? "heath" : "observatorio";
  return data.evaluations
    .filter((e) => e.person === personName && new Date(e.date).getTime() <= limit)
    .filter((e) => e.origin.toLowerCase().includes(origin))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function nearestBoard(data: AppData, date: string): Board | undefined {
  const target = new Date(date).getTime();
  return data.boards.find((board) =>
    new Date(board.start).getTime() <= target && target <= new Date(board.end).getTime()
  );
}

export function average(values: Array<number | null | undefined>): number | null {
  const available = values.filter((value): value is number => value != null && Number.isFinite(value));
  return available.length
    ? available.reduce((sum, value) => sum + value, 0) / available.length
    : null;
}

export function evaluationTotal(
  data: AppData,
  evaluation: Evaluation,
  edits: Record<string, number>,
): number | null {
  const recalculated = average(data.criteria.map((criterion) =>
    edits[`${evaluation.id}:${criterion.id}`] ?? evaluation.scores[criterion.id]
  ));
  return recalculated ?? evaluation.total;
}
