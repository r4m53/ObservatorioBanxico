export type Decision = {
  Decision_ID: string; Fecha_Decision: string; Hora_Publicacion: string | null; Tipo_Reunion: string;
  Regimen_Operativo: string; Tasa_Anterior: number | null; Cambio_pb: number | null; Tasa_Nueva: number | null;
  Direccion_Decision: string; Decision_Unanime: string; Numero_Disensos: number | null;
  Comunicado_URL: string | null; Minuta_URL: string | null; Observaciones: string | null;
};
export type Vote = { Decision_ID: string; Persona_ID: string | null; Voto: string; Tipo_Voto: string; Nivel_Identificacion: string; Observaciones: string | null };
export type Participation = { Decision_ID: string; Persona_ID: string; Cargo: string; Participacion_Confirmada: string; Observaciones: string | null };
export type Person = { Persona_ID: string; Nombre: string };
export type GraphPoint = { Fecha: string; Decision_ID: string; Tasa_Objetivo: number; Movimiento_pb?: number; Disensos_Hawk: number; Disensos_Dovish: number };
export type DecisionsData = { decisions: Decision[]; votes: Vote[]; participation: Participation[]; people: Person[]; graph: GraphPoint[]; memberGraph: GraphPoint[] };

export async function loadDecisionsData(): Promise<DecisionsData> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/radar-decisiones.json`);
  if (!response.ok) throw new Error(`No fue posible cargar el Radar de Decisiones (${response.status})`);
  return response.json();
}

export const validVote = (vote: Vote) => ["Consenso", "Disenso restrictivo", "Disenso acomodaticio"].includes(vote.Tipo_Voto);
export const voteSymbol = (vote?: Vote, participation?: Participation) => {
  if (participation?.Participacion_Confirmada?.toLowerCase().includes("ausen")) return "✕";
  if (!participation) return "—";
  if (!vote || !validVote(vote)) return vote?.Nivel_Identificacion === "Anónimo" ? "?" : "○";
  if (vote.Tipo_Voto === "Disenso restrictivo") return "▲";
  if (vote.Tipo_Voto === "Disenso acomodaticio") return "▼";
  return "●";
};
