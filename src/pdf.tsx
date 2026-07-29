import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { AppData, EvaluationMode, EvaluationSourceMode } from "./types";
import { effectiveScore, evaluationFor, evaluationTotal, nearestBoard, scoreEditKey } from "./data";

const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: "#111", color: "#eee", fontFamily: "Helvetica", fontSize: 8 },
  brand: { color: "#f28c28", fontSize: 10, fontWeight: 700, letterSpacing: 2 },
  title: { fontSize: 21, marginTop: 8, marginBottom: 4, fontWeight: 700 },
  banner: { color: "#111", padding: 7, marginVertical: 10, fontWeight: 700 },
  board: { marginTop: 14, borderTop: "1px solid #555" },
  boardTitle: { fontSize: 12, color: "#f28c28", paddingVertical: 7 },
  row: { flexDirection: "row", borderBottom: "1px solid #333", paddingVertical: 4 },
  name: { width: 125 },
  value: { width: 38, textAlign: "right" },
  modified: { color: "#f28c28", fontWeight: 700 },
  footer: { position: "absolute", bottom: 18, left: 28, right: 28, color: "#888", fontSize: 7 },
});

function RadarDocument({
  data,
  dates,
  mode,
  sourceMode,
  edits,
  evaluationHash,
  sessionHash,
}: {
  data: AppData;
  dates: string[];
  mode: EvaluationMode;
  sourceMode: EvaluationSourceMode;
  edits: Record<string, number>;
  evaluationHash: string;
  sessionHash: string;
}) {
  const label =
    mode === "custom"
      ? "EVALUACIÓN PERSONALIZADA"
      : mode === "heath"
        ? "CALIFICACIONES PUBLICADAS / RECONSTRUIDAS DE HEATH"
        : "EVALUACIÓN OBSERVATORIO BANXICO";
  const contextColor = mode === "custom" ? "#f28c28" : mode === "heath" ? "#4da3ff" : "#33c37d";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.brand}>OBSERVATORIO BANXICO</Text>
        <Text style={styles.title}>Radar BM · Comparador de Juntas</Text>
        <Text>Evaluación histórica de la Junta de Gobierno del Banco de México</Text>
        <Text style={[styles.banner, { backgroundColor: contextColor }]}>{label}</Text>
        {dates.map((date) => {
          const board = nearestBoard(data, date);
          if (!board) return null;
          return (
            <View key={date} style={styles.board}>
              <Text style={styles.boardTitle}>
                {new Date(date).toLocaleDateString("es-MX", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </Text>
              {board.members.map((name) => {
                const evaluation = evaluationFor(data, date, name, sourceMode);
                if (!evaluation) return null;
                const values = data.criteria.map(
                  (criterion) => effectiveScore(date, evaluation, criterion.id, edits),
                );
                const total = evaluationTotal(data, date, evaluation, edits);
                return (
                  <View key={name} style={styles.row}>
                    <Text style={styles.name}>
                      {name}
                      {name === board.governor ? " · Gobernador" : ""}
                    </Text>
                    <Text style={styles.value}>{total == null ? "N/D" : total.toFixed(1)}</Text>
                    {values.map((value, index) => {
                      const modified = scoreEditKey(date, evaluation.id, data.criteria[index].id) in edits;
                      return (
                      <Text key={index} style={[styles.value, ...(modified ? [styles.modified] : [])]}>
                        {value == null ? "N/D" : `${value.toFixed(1)}${modified ? " *" : ""}`}
                      </Text>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          );
        })}
        <Text style={styles.footer}>
          Radar BM · {label} · Hash exportación {evaluationHash} · Hash sesión {sessionHash || "calculando"} · * valor modificado · Generado{" "}
          {new Date().toLocaleString("es-MX")} · Las calificaciones personalizadas no
          representan al Observatorio Banxico.
        </Text>
      </Page>
    </Document>
  );
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function exportPdf(
  data: AppData,
  dates: string[],
  mode: EvaluationMode,
  sourceMode: EvaluationSourceMode,
  edits: Record<string, number>,
  sessionHash: string,
) {
  const evaluationHash = await sha256(
    JSON.stringify({
      methodologyVersion: "Radar BM v1.0",
      mode,
      sourceMode,
      dates,
      edits: Object.entries(edits).sort(([left], [right]) => left.localeCompare(right)),
    }),
  );
  const blob = await pdf(
    <RadarDocument
      data={data}
      dates={dates}
      mode={mode}
      sourceMode={sourceMode}
      edits={edits}
      evaluationHash={evaluationHash}
      sessionHash={sessionHash}
    />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Radar-BM-${mode}-${new Date().toISOString().slice(0, 10)}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
