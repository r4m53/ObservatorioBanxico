import type { AppData, Board, Evaluation, EvaluationSourceMode } from "./types";

export async function loadData(): Promise<AppData> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/radar-bm.json`);
  if (!response.ok) throw new Error("No fue posible cargar los datos de Radar BM.");
  const data = await response.json() as AppData;
  return evolveExperienceRadar(data);
}

const DAY_MS = 86_400_000;
const CUMULATIVE_CRITERIA = new Set(["H03", "H04", "H05", "H07", "H09", "H10"]);

function isoMonthEnd(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
}

export function observationDate(now = new Date()) {
  return isoMonthEnd(now.getFullYear(), now.getMonth() - 1);
}

function monthEndsAfter(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  cursor.setUTCDate(1);
  cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  while (true) {
    const date = isoMonthEnd(cursor.getUTCFullYear(), cursor.getUTCMonth());
    if (date > end) break;
    dates.push(date);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return dates;
}

function activeBoardAt(data: AppData, date: string): Board | undefined {
  return data.boards.find((board, index) => board.start <= date &&
    (date <= board.end || (index === data.boards.length - 1 && board.end === data.metadata.latestDate)));
}

function daysThrough(start: string, end: string, cutoff: string, openEnded: boolean) {
  if (!start || start > cutoff) return 0;
  const effectiveEnd = openEnded ? cutoff : (end < cutoff ? end : cutoff);
  return effectiveEnd < start ? 0 : (Date.parse(effectiveEnd) - Date.parse(start)) / DAY_MS + 1;
}

function experienceAt(data: AppData, date: string) {
  const board = activeBoardAt(data, date);
  if (!board) return undefined;
  const people = board.members.map((name) => data.people.find((person) => person.name === name)).filter(Boolean);
  const totals = people.map((person) => {
    const sums = { total: 0, monetary: 0, fiscal: 0 };
    for (const entry of person!.career) {
      const years = daysThrough(entry.start, entry.end, date, person!.active && entry.end === data.metadata.latestDate) / 365.2425;
      if (entry.countTotal) sums.total += years;
      if (entry.countMonetary) sums.monetary += years;
      if (entry.countFiscal) sums.fiscal += years;
    }
    return sums;
  });
  return { date, total: average(totals.map((value) => value.total))!, monetary: average(totals.map((value) => value.monetary))!, fiscal: average(totals.map((value) => value.fiscal))! };
}

function projectedEvaluations(data: AppData, dates: string[]) {
  const additions: Evaluation[] = [];
  for (const person of data.people.filter((item) => item.active)) {
    for (const origin of ["observatorio", "heath"] as const) {
      const history = data.evaluations.filter((item) => item.personId === person.id && item.origin.toLowerCase().includes(origin)).sort((a, b) => a.date.localeCompare(b.date));
      const base = history.at(-1);
      if (!base) continue;
      const prior = [...history].reverse().find((item) => item.date < base.date && Object.keys(item.scores).length);
      for (const date of dates.filter((item) => item > base.date)) {
        const elapsedYears = (Date.parse(date) - Date.parse(base.date)) / DAY_MS / 365.2425;
        const referenceYears = prior ? (Date.parse(base.date) - Date.parse(prior.date)) / DAY_MS / 365.2425 : 0;
        const scores = Object.fromEntries(data.criteria.map((criterion) => {
          const value = base.scores[criterion.id];
          if (!CUMULATIVE_CRITERIA.has(criterion.id) || value == null || !prior || referenceYears <= 0) return [criterion.id, value];
          const annualRate = Math.max(0, (value - (prior.scores[criterion.id] ?? value)) / referenceYears);
          return [criterion.id, Math.min(10, value + annualRate * elapsedYears)];
        }));
        additions.push({ ...base, id: `${base.id}-AUTO-${date}`, date, scores, total: average(Object.values(scores)), notes: `${base.notes} Proyección temporal automática a FechaObservacion.` });
      }
    }
  }
  return additions;
}

export function evolveExperienceRadar(source: AppData, now = new Date()): AppData {
  const cutoff = observationDate(now);
  if (cutoff <= source.metadata.latestDate) return source;
  const dates = monthEndsAfter(source.metadata.latestDate, cutoff);
  const lastBoard = source.boards.at(-1);
  const boards = lastBoard?.end === source.metadata.latestDate ? [...source.boards.slice(0, -1), { ...lastBoard, end: cutoff, date: cutoff }] : source.boards;
  const data = { ...source, boards };
  const experience = dates.map((date) => experienceAt(data, date)).filter((point): point is NonNullable<typeof point> => Boolean(point));
  return {
    ...data,
    metadata: { ...source.metadata, latestDate: cutoff, timelineSource: `${source.metadata.timelineSource} + extensión automática a FechaObservacion` },
    timeline: [...source.timeline, ...dates],
    evaluations: [...source.evaluations, ...projectedEvaluations(source, dates)],
    experience: [...source.experience, ...experience],
  };
}


export function evaluationFor(data: AppData, boardDate: string, personName: string, mode: EvaluationSourceMode): Evaluation | undefined {
  const limit = new Date(boardDate).getTime();
  const origin = mode === "heath" ? "heath" : "observatorio";
  return data.evaluations
    .filter((e) => e.person === personName && new Date(e.date).getTime() <= limit)
    .filter((e) => e.origin.toLowerCase().includes(origin))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function scoreEditKey(
  boardDate: string,
  evaluationId: string,
  criterionId: string,
) {
  return `${boardDate}:${evaluationId}:${criterionId}`;
}

export function effectiveScore(
  boardDate: string,
  evaluation: Evaluation,
  criterionId: string,
  edits: Record<string, number>,
) {
  return edits[scoreEditKey(boardDate, evaluation.id, criterionId)]
    ?? evaluation.scores[criterionId];
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
  boardDate: string,
  evaluation: Evaluation,
  edits: Record<string, number>,
): number | null {
  const recalculated = average(data.criteria.map((criterion) =>
    effectiveScore(boardDate, evaluation, criterion.id, edits)
  ));
  return recalculated ?? evaluation.total;
}
