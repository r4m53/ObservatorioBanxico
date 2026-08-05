export type Criterion = {
  id: string;
  number: number;
  name: string;
  short: string;
  nature: string;
  definition: string;
};

export type Person = {
  id: string;
  name: string;
  firstBoardDate?: string;
  lastBoardDate?: string;
  active: boolean;
  biography: string;
  career: CareerEntry[];
  academic: AcademicEntry[];
  profile?: Record<string, number | string>;
};

export type AcademicEntry = {
  order: number;
  type: string;
  originalProgram: string;
  program: string;
  institution: string;
  country: string;
  year: number | null;
  status: string;
  sourceOrder: number;
  evidenceLevel: string;
  document: string;
  url: string;
  consultedAt: string;
  observations: string;
};

export type CareerEntry = {
  institution: string;
  role: string;
  start: string;
  end: string;
  description: string;
  source: string;
  url: string;
  countTotal?: boolean;
  countMonetary?: boolean;
  countFiscal?: boolean;
};

export type Evaluation = {
  id: string;
  personId: string;
  person: string;
  date: string;
  total: number | null;
  origin: string;
  evaluator: string;
  notes: string;
  source: string;
  sourceUrl: string;
  scores: Record<string, number>;
  scoreNotes: Record<string, string>;
};

export type Board = {
  date: string;
  start: string;
  end: string;
  governor: string;
  deputies: string[];
  members: string[];
};

export type ExperiencePoint = {
  date: string;
  total: number;
  monetary: number;
  fiscal: number;
};

export type AppData = {
  metadata: {
    generatedAt: string;
    source: string;
    latestDate: string;
    timelineSource: string;
  };
  timeline: string[];
  criteria: Criterion[];
  people: Person[];
  boards: Board[];
  evaluations: Evaluation[];
  experience: ExperiencePoint[];
};

export type EvaluationSourceMode = "official" | "heath";
export type EvaluationMode = EvaluationSourceMode | "custom";

export type EvaluationChange = {
  id: string;
  boardDate: string;
  evaluationId: string;
  person: string;
  criterionId: string;
  criterion: string;
  originalValue: number;
  newValue: number;
  sourceMode: EvaluationSourceMode;
  timestamp: string;
};
