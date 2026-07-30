import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar, Box, Button, Chip, Container, Divider, Drawer,
  FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs,
  Toolbar, Tooltip, Typography
} from "@mui/material";
import { ArrowBack, ArrowForward, Close, Download, RestartAlt } from "@mui/icons-material";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis, Legend } from "recharts";
import { motion } from "framer-motion";
import { average, effectiveScore, evaluationFor, evaluationTotal, loadData, nearestBoard, scoreEditKey } from "./data";
import { useRadarStore } from "./store";
import { orange } from "./theme";
import type { Evaluation, EvaluationMode, EvaluationSourceMode, Person } from "./types";
import { exportPdf } from "./pdf";

const modeMeta = {
  official: { color: "#33c37d", title: "🟢 Oficial", text: "Visualizando la evaluación oficial del Observatorio Banxico." },
  heath: { color: "#4da3ff", title: "🔵 Reconstrucción Heath", text: "Visualizando la reconstrucción de las calificaciones publicadas por Jonathan Heath." },
  custom: { color: orange, title: "🟠 Mi evaluación", text: "Está visualizando una evaluación personalizada." },
} as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatLongDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function formatScore(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? "N/D" : value.toFixed(1);
}

const tooltipFormatter = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => typeof item === "number" ? item.toFixed(1) : String(item)).join(", ");
  return typeof value === "number" ? value.toFixed(1) : String(value ?? "N/D");
};

export default function App() {
  const { data, setData, mode, sourceMode, setSourceMode, selectedBoards, activeTab, setActiveTab, edits, evaluationHash, resetEvaluation } = useRadarStore();
  const [entered, setEntered] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { loadData().then(setData).catch((e: Error) => setError(e.message)); }, [setData]);
  if (error) return <Container sx={{ py: 10 }}><Typography color="error">{error}</Typography></Container>;
  if (!data) return <Box className="loading">Cargando Radar BM…</Box>;
  if (!entered) return <Welcome onEnter={() => setEntered(true)} />;
  const meta = modeMeta[mode];
  return <Box>
    <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: "blur(14px)", borderBottom: "1px solid #282828" }}>
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}><Typography className="brand">OBSERVATORIO BANXICO</Typography><Typography variant="h6">Radar BM</Typography></Box>
        <Button startIcon={<Download />} onClick={() => exportPdf(data, selectedBoards, mode, sourceMode, edits, evaluationHash)}>Exportar PDF</Button>
      </Toolbar>
    </AppBar>
    <Box className="status" sx={{ borderColor: meta.color }}>
      <Box className="status-dot" sx={{ bgcolor: meta.color }} /><Box sx={{ flexGrow: 1 }}><b>{meta.title}</b> · {meta.text}</Box>
      <Chip size="small" label={`Hash ${evaluationHash ? evaluationHash.slice(0, 12) : "calculando…"}`} sx={{ borderColor: meta.color, color: meta.color }} variant="outlined" />
      <FormControl size="small" sx={{ minWidth: 220 }}><InputLabel>Origen</InputLabel><Select label="Origen" value={sourceMode} onChange={e => setSourceMode(e.target.value as EvaluationSourceMode)}>
        <MenuItem value="official">Observatorio</MenuItem><MenuItem value="heath">Jonathan Heath</MenuItem>
      </Select></FormControl>
      <Button startIcon={<RestartAlt />} onClick={resetEvaluation}>Restablecer evaluación oficial</Button>
    </Box>
    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" className="tabs">
      <Tab label="Comparador" /><Tab label="Histórico Radar BM" /><Tab label="Experiencia" /><Tab label="Metodología" />
    </Tabs>
    <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 3 }}>
      {activeTab === 0 && <Comparator onPerson={setPerson} />}
      {activeTab === 1 && <HistoricalChart />}
      {activeTab === 2 && <ExperienceChart />}
      {activeTab === 3 && <Methodology />}
    </Container>
    <PersonDrawer person={person} onClose={() => setPerson(null)} />
  </Box>;
}

function Welcome({ onEnter }: { onEnter: () => void }) {
  return <Box className="welcome"><Box className="welcome-grid" /><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
    <Typography className="brand">OBSERVATORIO BANXICO</Typography>
    <Typography variant="h1" sx={{ fontSize: { xs: 58, md: 102 }, lineHeight: .9, my: 3 }}>Radar <span>BM</span></Typography>
    <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 720 }}>Una lectura histórica, comparable y transparente del perfil técnico e institucional de la Junta de Gobierno.</Typography>
    <Button variant="contained" size="large" onClick={onEnter} sx={{ mt: 5, color: "#111" }}>Explorar las juntas</Button>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 4, maxWidth: 720 }}>Metodología desarrollada por Observatorio Banxico a partir de los criterios publicados por Jonathan Heath. Las reconstrucciones y ampliaciones son responsabilidad exclusiva del Observatorio.</Typography>
  </motion.div></Box>;
}

function Comparator({ onPerson }: { onPerson: (p: Person)=>void }) {
  const { data, mode, sourceMode, edits, selectedBoards, activeBoard, selectBoard } = useRadarStore();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const comparatorReady = useRef(false);
  const boardDates = data?.timeline ?? [];
  const activeIndex = boardDates.indexOf(activeBoard);
  const navigate = (offset: number) => {
    const next = boardDates[activeIndex + offset];
    if (next) selectBoard(next);
  };
  useEffect(() => {
    if (!comparatorReady.current) {
      comparatorReady.current = true;
      return;
    }
    if (activeBoard) cardRefs.current[activeBoard]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeBoard]);
  if (!data) return null;
  return <Stack spacing={3}>
    <Box><Typography variant="overline" color="primary">COMPARADOR HISTÓRICO</Typography><Typography variant="h3">Evolución de la Junta</Typography><Typography color="text.secondary">Compara cortes históricos en vertical. La gráfica, el selector y la Junta activa permanecen sincronizados.</Typography></Box>
    <Paper className="comparator-controls">
      <FormControl size="small" sx={{ minWidth: 240 }}><InputLabel>Junta activa</InputLabel><Select label="Junta activa" value={activeBoard} onChange={e=>selectBoard(e.target.value)}>{boardDates.map(x=><MenuItem key={x} value={x}>{formatLongDate(x)}</MenuItem>)}</Select></FormControl>
      <Button startIcon={<ArrowBack />} disabled={activeIndex <= 0} onClick={()=>navigate(-1)}>Junta anterior</Button>
      <Button endIcon={<ArrowForward />} disabled={activeIndex < 0 || activeIndex >= boardDates.length-1} onClick={()=>navigate(1)}>Junta siguiente</Button>
    </Paper>
    <HistoricalChart embedded />
    <Stack direction="row" gap={1} flexWrap="wrap">{selectedBoards.map((d,i)=><FormControl key={i} size="small" sx={{ minWidth: 190 }}><InputLabel>Comparación {String.fromCharCode(65+i)}</InputLabel><Select label={`Comparación ${String.fromCharCode(65+i)}`} value={d} onChange={e=>selectBoard(e.target.value)}>{boardDates.map(x=><MenuItem key={x} value={x}>{formatDate(x)}</MenuItem>)}</Select></FormControl>)}
    {selectedBoards.length<3 && <Button variant="outlined" onClick={()=>selectBoard(boardDates[Math.max(0,boardDates.length-121)])}>+ Agregar junta</Button>}</Stack>
    <Box className="boards-list">{selectedBoards.map(date=><div key={date} ref={node=>{cardRefs.current[date]=node}}><BoardTable date={date} onPerson={onPerson} mode={mode} sourceMode={sourceMode} edits={edits} active={date===activeBoard} onActivate={()=>selectBoard(date)} /></div>)}</Box>
  </Stack>;
}

function BoardTable({date,onPerson,mode,sourceMode,edits,active,onActivate}:{date:string;onPerson:(p:Person)=>void;mode:EvaluationMode;sourceMode:EvaluationSourceMode;edits:Record<string,number>;active:boolean;onActivate:()=>void}) {
  const data=useRadarStore(s=>s.data)!;
  const editScore=useRadarStore(s=>s.editScore);
  const board=nearestBoard(data,date);
  if (!board) return <Paper className="board-panel" sx={{p:3}}><Typography color="warning.main">Información insuficiente: no existe una composición de Junta vigente para {formatDate(date)}.</Typography></Paper>;
  const rows=board.members.map(name=>({name,person:data.people.find(p=>p.name===name),ev:evaluationFor(data,date,name,sourceMode)}));
  const averages=data.criteria.map(c=>average(rows.map(r=>r.ev ? effectiveScore(date,r.ev,c.id,edits) : null)));
  const avgTotal=average(rows.map(r=>r.ev ? evaluationTotal(data,date,r.ev,edits) : null));
  const contextColor=modeMeta[mode].color;
  return <Paper className={`board-panel ${active?"board-active":""}`} onClick={onActivate} sx={{"--context-color":contextColor} as React.CSSProperties}>
    <Box className="board-header"><Box><Typography variant="overline" sx={{color:contextColor}}>JUNTA DE GOBIERNO · {modeMeta[mode].title}</Typography><Typography variant="h4">{formatLongDate(date)}</Typography></Box>
      <Box className="board-summary"><span>Gobernador<strong>{board.governor}</strong></span><span>Subgobernadores<strong>{board.members.filter(name=>name!==board.governor).join(", ")}</strong></span><span>Promedio general<strong>{formatScore(avgTotal)}</strong></span></Box>
    </Box>
    <Box className="members-list">{rows.map(({name,person,ev})=>{const total=ev ? evaluationTotal(data,date,ev,edits) : null;return <Box className="member-card" key={name}>
      <Box className="member-heading"><Box><Button className="person-link" onClick={event=>{event.stopPropagation();if(person)onPerson(person)}}>{name}</Button><small>{name===board.governor?"Gobernador":"Subgobernador"}</small></Box><Box className="member-total"><small>Total</small>{formatScore(total)}</Box></Box>
      {!ev?<Typography color="warning.main">Información insuficiente para este origen</Typography>:<Box className="criteria-scores">{data.criteria.map(c=>{const original=ev.scores[c.id];const key=scoreEditKey(date,ev.id,c.id);const edited=key in edits;const value=effectiveScore(date,ev,c.id,edits);return <Box className={`criterion-score ${edited?"modified-score":""}`} key={c.id}><Tooltip title={c.name}><span>{c.short}</span></Tooltip><EditableScore value={value} edited={edited} onCommit={newValue=>original!=null&&editScore({boardDate:date,evaluationId:ev.id,person:name,criterionId:c.id,criterion:c.name,originalValue:original,newValue})}/></Box>})}</Box>}
    </Box>})}</Box>
    <Box className="averages-strip"><strong>PROMEDIO POR CRITERIO</strong>{data.criteria.map((c,i)=><span key={c.id}>{c.short}<b>{formatScore(averages[i])}</b></span>)}</Box>
  </Paper>;
}

function EditableScore({value,edited,onCommit}:{value:number|null|undefined;edited:boolean;onCommit:(value:number)=>void}) {
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState("");
  if(value==null)return <>N/D</>;
  const begin=()=>{setDraft(String(value));setEditing(true)};
  const commit=()=>{const next=Number(draft);if(Number.isFinite(next)&&next>=0&&next<=10)onCommit(next);setEditing(false)};
  if(editing)return <input className="score-input" autoFocus type="number" min="0" max="10" step="0.1" value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false)}} aria-label="Editar calificación"/>;
  return <button className="score-value" onDoubleClick={begin} title="Doble clic para editar">{formatScore(value)}{edited&&<span className="edit-mark" aria-label="Modificada"> ✎</span>}</button>;
}

function HistoricalChart({embedded=false}:{embedded?:boolean}) {
  const {data,mode,sourceMode,edits,selectBoard,activeBoard}=useRadarStore();
  const series=useMemo(()=>data ? data.timeline.map(date=>{const board=nearestBoard(data,date);const evals=board?.members.map(n=>evaluationFor(data,date,n,sourceMode)).filter(Boolean) as Evaluation[]|undefined;const score=average(evals?.map(e=>evaluationTotal(data,date,e,edits))??[]);return {date,label:formatDate(date),score}}) : [],[data,sourceMode,edits]);
  if(!data)return null;
  const color=modeMeta[mode].color;
  return <ChartPanel eyebrow="SERIE HISTÓRICA" title="Evolución de Radar BM" subtitle="Haz clic en cualquier punto para seleccionar y resaltar esa Junta."><ResponsiveContainer width="100%" height={embedded?330:470}><LineChart data={series}><CartesianGrid stroke="#262626"/><XAxis dataKey="label" minTickGap={40}/><YAxis domain={[5,10]} tickFormatter={(v:number)=>v.toFixed(1)}/><ChartTooltip formatter={tooltipFormatter} contentStyle={{background:"#171717",border:`1px solid ${color}`}}/><Line type="monotone" dataKey="score" name="Radar BM" stroke={color} strokeWidth={2.5} dot={({cx,cy,payload})=><g onClick={()=>selectBoard(payload.date)} style={{cursor:"pointer",pointerEvents:"all"}}><circle cx={cx} cy={cy} r={payload.date===activeBoard?7:2.5} fill={payload.date===activeBoard?"#fff":color} stroke={color} strokeWidth={payload.date===activeBoard?3:0}/><circle cx={cx} cy={cy} r={10} fill="transparent"/></g>} activeDot={{r:7}}/></LineChart></ResponsiveContainer></ChartPanel>;
}

function ExperienceChart() {
  const {data,mode,selectBoard}=useRadarStore(); if(!data)return null;
  const handleClick = (state: unknown) => {
    const payload = (state as { activePayload?: Array<{ payload?: { date?: string } }> })?.activePayload?.[0]?.payload;
    if (payload?.date && nearestBoard(data, payload.date)) selectBoard(payload.date);
  };
  const color=modeMeta[mode].color;
  return <ChartPanel eyebrow="CAPITAL PROFESIONAL" title="Experiencia acumulada de la Junta" subtitle="Promedios mensuales de experiencia total, monetaria y fiscal."><ResponsiveContainer width="100%" height={470}><LineChart data={data.experience} onClick={handleClick}><CartesianGrid stroke="#262626"/><XAxis dataKey="date" tickFormatter={formatDate} minTickGap={50}/><YAxis tickFormatter={(v:number)=>v.toFixed(1)}/><Legend/><ChartTooltip formatter={tooltipFormatter} labelFormatter={(label)=>typeof label==="string"?formatDate(label):String(label??"")} contentStyle={{background:"#171717",border:`1px solid ${color}`}}/><Line dot={false} dataKey="total" name="Total" stroke={color} strokeWidth={2.3}/><Line dot={false} dataKey="monetary" name="Monetaria" stroke="#4da3ff" strokeWidth={1.8}/><Line dot={false} dataKey="fiscal" name="Fiscal" stroke="#33c37d" strokeWidth={1.8}/></LineChart></ResponsiveContainer></ChartPanel>;
}

function ChartPanel({eyebrow,title,subtitle,children}:{eyebrow:string;title:string;subtitle:string;children:React.ReactNode}) {return <Paper sx={{p:{xs:2,md:4}}}><Typography variant="overline" color="primary">{eyebrow}</Typography><Typography variant="h3">{title}</Typography><Typography color="text.secondary" sx={{mb:4}}>{subtitle}</Typography>{children}</Paper>}

function Methodology(){const data=useRadarStore(s=>s.data)!;return <Stack spacing={3}><Box><Typography variant="overline" color="primary">TRANSPARENCIA</Typography><Typography variant="h3">Cómo leer Radar BM</Typography></Box><Paper sx={{p:4}}><Typography variant="h5">Reconocimiento metodológico</Typography><Typography color="text.secondary" sx={{mt:1}}>Radar BM es una metodología desarrollada por Observatorio Banxico a partir de los criterios de evaluación publicados por Jonathan Heath. Las calificaciones históricas publicadas se preservan como fuente; toda reconstrucción, ampliación y estimación es responsabilidad del Observatorio.</Typography></Paper><Box className="criteria-grid">{data.criteria.map(c=><Paper key={c.id} sx={{p:3}}><Typography color="primary">{String(c.number).padStart(2,"0")}</Typography><Typography variant="h6">{c.name}</Typography><Typography color="text.secondary">{c.definition}</Typography><Chip size="small" label={c.nature} sx={{mt:2}}/></Paper>)}</Box></Stack>}

function PersonDrawer({person,onClose}:{person:Person|null;onClose:()=>void}){return <Drawer anchor="right" open={!!person} onClose={onClose} PaperProps={{sx:{width:{xs:"94vw",md:520},p:3}}}><Box sx={{display:"flex",justifyContent:"space-between"}}><Box><Typography className="brand">PERFIL</Typography><Typography variant="h4">{person?.name}</Typography></Box><IconButton onClick={onClose}><Close/></IconButton></Box><Divider sx={{my:3}}/><Typography color="text.secondary">{person?.biography}</Typography><Typography variant="h6" sx={{mt:4,mb:2}}>Trayectoria documentada</Typography><Stack spacing={2}>{person?.career.map((c,i)=><Box key={i} className="career"><Typography>{c.role}</Typography><Typography color="primary">{c.institution}</Typography><Typography variant="caption" color="text.secondary">{c.start} — {c.end}</Typography><Typography variant="body2" color="text.secondary">{c.description}</Typography></Box>)}</Stack></Drawer>}
