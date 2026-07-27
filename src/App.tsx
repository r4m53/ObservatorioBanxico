import { useEffect, useMemo, useState } from "react";
import {
  AppBar, Box, Button, Chip, Container, Dialog, DialogContent, DialogTitle, Divider, Drawer,
  FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Toolbar, Tooltip, Typography
} from "@mui/material";
import { Close, Download, Edit, RestartAlt, Timeline } from "@mui/icons-material";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis, Legend } from "recharts";
import { motion } from "framer-motion";
import { loadData, evaluationFor, nearestBoard } from "./data";
import { useRadarStore } from "./store";
import { orange } from "./theme";
import type { Evaluation, Person } from "./types";
import { exportPdf } from "./pdf";

const modeMeta = {
  official: { color: "#33c37d", title: "Evaluación oficial del Observatorio", text: "Visualizando las estimaciones originales de Observatorio Banxico." },
  heath: { color: "#4da3ff", title: "Calificaciones originales de Heath", text: "Visualizando las calificaciones publicadas por Jonathan Heath y las reconstrucciones históricas identificadas." },
  custom: { color: orange, title: "Evaluación personalizada", text: "Contiene cambios temporales de esta sesión; no corresponde a la evaluación oficial." },
} as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function App() {
  const { data, setData, mode, setMode, selectedBoards, selectBoard, activeTab, setActiveTab, edits, editScore, reset } = useRadarStore();
  const [entered, setEntered] = useState(false);
  const [person, setPerson] = useState<Person | null>(null);
  const [scoreModal, setScoreModal] = useState<{ ev: Evaluation; criterionId: string } | null>(null);
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
        <Button startIcon={<Download />} onClick={() => exportPdf(data, selectedBoards, mode, edits)}>Exportar PDF</Button>
      </Toolbar>
    </AppBar>
    <Box className="status" sx={{ borderColor: meta.color }}>
      <Box className="status-dot" sx={{ bgcolor: meta.color }} /><Box sx={{ flexGrow: 1 }}><b>{meta.title}</b> · {meta.text}</Box>
      <FormControl size="small" sx={{ minWidth: 220 }}><InputLabel>Origen</InputLabel><Select label="Origen" value={mode} onChange={e => setMode(e.target.value as "official"|"heath")}>
        <MenuItem value="official">Observatorio</MenuItem><MenuItem value="heath">Jonathan Heath</MenuItem>
        {mode === "custom" && <MenuItem value="custom">Evaluación personalizada</MenuItem>}
      </Select></FormControl>
      <Button startIcon={<RestartAlt />} onClick={reset}>Restablecer</Button>
    </Box>
    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" className="tabs">
      <Tab label="Comparador" /><Tab label="Histórico Radar BM" /><Tab label="Experiencia" /><Tab label="Metodología" />
    </Tabs>
    <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 3 }}>
      {activeTab === 0 && <Comparator onPerson={setPerson} onScore={(ev, criterionId)=>setScoreModal({ev,criterionId})} />}
      {activeTab === 1 && <HistoricalChart />}
      {activeTab === 2 && <ExperienceChart />}
      {activeTab === 3 && <Methodology />}
    </Container>
    <PersonDrawer person={person} onClose={() => setPerson(null)} />
    <ScoreDialog value={scoreModal} onClose={() => setScoreModal(null)} onEdit={editScore} />
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

function Comparator({ onPerson, onScore }: { onPerson: (p: Person)=>void; onScore: (e: Evaluation,c:string)=>void }) {
  const { data, mode, edits, selectedBoards, selectBoard } = useRadarStore();
  if (!data) return null;
  const boardDates = data.boards.map(b=>b.date);
  return <Stack spacing={3}>
    <Box><Typography variant="overline" color="primary">COMPARADOR HISTÓRICO</Typography><Typography variant="h3">La Junta, lado a lado</Typography><Typography color="text.secondary">Selecciona hasta tres cortes. No mostramos diferencias: la lectura queda en manos del usuario.</Typography></Box>
    <Stack direction="row" gap={1} flexWrap="wrap">{selectedBoards.map((d,i)=><FormControl key={i} size="small" sx={{ minWidth: 190 }}><InputLabel>Junta {String.fromCharCode(65+i)}</InputLabel><Select label={`Junta ${String.fromCharCode(65+i)}`} value={d} onChange={e=>selectBoard(e.target.value)}>{boardDates.map(x=><MenuItem key={x} value={x}>{formatDate(x)}</MenuItem>)}</Select></FormControl>)}
    {selectedBoards.length<3 && <Button variant="outlined" onClick={()=>selectBoard(boardDates[Math.max(0,boardDates.length-121)])}>+ Agregar junta</Button>}</Stack>
    <Box className="boards-grid">{selectedBoards.map(date=><BoardTable key={date} date={date} onPerson={onPerson} onScore={onScore} mode={mode} edits={edits} />)}</Box>
  </Stack>;
}

function BoardTable({date,onPerson,onScore,mode,edits}:{date:string;onPerson:(p:Person)=>void;onScore:(e:Evaluation,c:string)=>void;mode:"official"|"heath"|"custom";edits:Record<string,number>}) {
  const data=useRadarStore(s=>s.data)!; const board=nearestBoard(data,date);
  const rows=board.members.map(name=>({name,person:data.people.find(p=>p.name===name),ev:evaluationFor(data,date,name,mode)})).filter(r=>r.ev);
  const averages=data.criteria.map(c=>rows.reduce((s,r)=>s+(edits[`${r.ev!.id}:${c.id}`]??r.ev!.scores[c.id]??0),0)/rows.length);
  const avgTotal=averages.reduce((a,b)=>a+b,0)/averages.length;
  return <Paper className="board-panel"><Box className="board-header"><Typography variant="overline">JUNTA DE GOBIERNO</Typography><Typography variant="h5">{formatDate(date)}</Typography><Typography color="text.secondary">{board.governor}</Typography></Box>
    <TableContainer><Table size="small" stickyHeader><TableHead><TableRow><TableCell>Integrante</TableCell><TableCell align="right">Total</TableCell>{data.criteria.map(c=><Tooltip title={c.name} key={c.id}><TableCell align="right">{c.short}</TableCell></Tooltip>)}</TableRow></TableHead>
      <TableBody>{rows.map(({name,person,ev})=>{const vals=data.criteria.map(c=>edits[`${ev!.id}:${c.id}`]??ev!.scores[c.id]??0);const total=vals.reduce((a,b)=>a+b,0)/vals.length;return <TableRow key={name} hover><TableCell><Button className="person-link" onClick={()=>person&&onPerson(person)}>{name}</Button><small>{name===board.governor?"Gobernador":"Subgobernador"}</small></TableCell><TableCell align="right" className="total-cell">{total.toFixed(2)}</TableCell>{data.criteria.map((c,i)=><TableCell key={c.id} align="right" className="score-cell" onClick={()=>onScore(ev!,c.id)}>{vals[i].toFixed(1)}</TableCell>)}</TableRow>})}
      <TableRow className="average-row"><TableCell>PROMEDIO</TableCell><TableCell align="right">{avgTotal.toFixed(2)}</TableCell>{averages.map((x,i)=><TableCell key={i} align="right">{x.toFixed(1)}</TableCell>)}</TableRow></TableBody>
    </Table></TableContainer></Paper>;
}

function HistoricalChart() {
  const {data,mode,edits,selectBoard}=useRadarStore(); if(!data)return null;
  const series=useMemo(()=>data.boards.map(board=>{const evals=board.members.map(n=>evaluationFor(data,board.date,n,mode)).filter(Boolean) as Evaluation[];const values=evals.map(e=>{const scores=data.criteria.map(c=>edits[`${e.id}:${c.id}`]??e.scores[c.id]??0);return scores.reduce((a,b)=>a+b,0)/scores.length});return {date:board.date,label:formatDate(board.date),score:values.length?values.reduce((a,b)=>a+b,0)/values.length:null}}).filter(x=>x.score),[data,mode,edits]);
  const handleClick = (state: unknown) => {
    const payload = (state as { activePayload?: Array<{ payload?: { date?: string } }> })?.activePayload?.[0]?.payload;
    if (payload?.date) selectBoard(payload.date);
  };
  return <ChartPanel eyebrow="SERIE HISTÓRICA" title="Evolución de Radar BM" subtitle="Haz clic en cualquier punto para llevar esa Junta al comparador."><ResponsiveContainer width="100%" height={470}><LineChart data={series} onClick={handleClick}><CartesianGrid stroke="#262626"/><XAxis dataKey="label" minTickGap={40}/><YAxis domain={[5,10]}/><ChartTooltip contentStyle={{background:"#171717",border:"1px solid #444"}}/><Line type="monotone" dataKey="score" name="Radar BM" stroke={orange} strokeWidth={2.5} dot={{r:3,fill:orange}} activeDot={{r:7}}/></LineChart></ResponsiveContainer></ChartPanel>;
}

function ExperienceChart() {
  const {data,selectBoard}=useRadarStore(); if(!data)return null;
  const handleClick = (state: unknown) => {
    const payload = (state as { activePayload?: Array<{ payload?: { date?: string } }> })?.activePayload?.[0]?.payload;
    if (payload?.date) selectBoard(nearestBoard(data, payload.date).date);
  };
  return <ChartPanel eyebrow="CAPITAL PROFESIONAL" title="Experiencia acumulada de la Junta" subtitle="Promedios mensuales de experiencia total, monetaria y fiscal."><ResponsiveContainer width="100%" height={470}><LineChart data={data.experience} onClick={handleClick}><CartesianGrid stroke="#262626"/><XAxis dataKey="date" tickFormatter={formatDate} minTickGap={50}/><YAxis/><Legend/><ChartTooltip labelFormatter={(label)=>typeof label==="string"?formatDate(label):String(label??"")} contentStyle={{background:"#171717",border:"1px solid #444"}}/><Line dot={false} dataKey="total" name="Total" stroke={orange} strokeWidth={2.3}/><Line dot={false} dataKey="monetary" name="Monetaria" stroke="#4da3ff" strokeWidth={1.8}/><Line dot={false} dataKey="fiscal" name="Fiscal" stroke="#33c37d" strokeWidth={1.8}/></LineChart></ResponsiveContainer></ChartPanel>;
}

function ChartPanel({eyebrow,title,subtitle,children}:{eyebrow:string;title:string;subtitle:string;children:React.ReactNode}) {return <Paper sx={{p:{xs:2,md:4}}}><Typography variant="overline" color="primary">{eyebrow}</Typography><Typography variant="h3">{title}</Typography><Typography color="text.secondary" sx={{mb:4}}>{subtitle}</Typography>{children}</Paper>}

function Methodology(){const data=useRadarStore(s=>s.data)!;return <Stack spacing={3}><Box><Typography variant="overline" color="primary">TRANSPARENCIA</Typography><Typography variant="h3">Cómo leer Radar BM</Typography></Box><Paper sx={{p:4}}><Typography variant="h5">Reconocimiento metodológico</Typography><Typography color="text.secondary" sx={{mt:1}}>Radar BM es una metodología desarrollada por Observatorio Banxico a partir de los criterios de evaluación publicados por Jonathan Heath. Las calificaciones históricas publicadas se preservan como fuente; toda reconstrucción, ampliación y estimación es responsabilidad del Observatorio.</Typography></Paper><Box className="criteria-grid">{data.criteria.map(c=><Paper key={c.id} sx={{p:3}}><Typography color="primary">{String(c.number).padStart(2,"0")}</Typography><Typography variant="h6">{c.name}</Typography><Typography color="text.secondary">{c.definition}</Typography><Chip size="small" label={c.nature} sx={{mt:2}}/></Paper>)}</Box></Stack>}

function PersonDrawer({person,onClose}:{person:Person|null;onClose:()=>void}){return <Drawer anchor="right" open={!!person} onClose={onClose} PaperProps={{sx:{width:{xs:"94vw",md:520},p:3}}}><Box sx={{display:"flex",justifyContent:"space-between"}}><Box><Typography className="brand">PERFIL</Typography><Typography variant="h4">{person?.name}</Typography></Box><IconButton onClick={onClose}><Close/></IconButton></Box><Divider sx={{my:3}}/><Typography color="text.secondary">{person?.biography}</Typography><Typography variant="h6" sx={{mt:4,mb:2}}>Trayectoria documentada</Typography><Stack spacing={2}>{person?.career.map((c,i)=><Box key={i} className="career"><Typography>{c.role}</Typography><Typography color="primary">{c.institution}</Typography><Typography variant="caption" color="text.secondary">{c.start} — {c.end}</Typography><Typography variant="body2" color="text.secondary">{c.description}</Typography></Box>)}</Stack></Drawer>}

function ScoreDialog({value,onClose,onEdit}:{value:{ev:Evaluation;criterionId:string}|null;onClose:()=>void;onEdit:(e:string,c:string,v:number)=>void}){const data=useRadarStore(s=>s.data)!;const edits=useRadarStore(s=>s.edits);if(!value)return null;const criterion=data.criteria.find(c=>c.id===value.criterionId)!;const current=edits[`${value.ev.id}:${criterion.id}`]??value.ev.scores[criterion.id];const history=data.evaluations.filter(e=>e.personId===value.ev.personId&&e.scores[criterion.id]!=null).map(e=>({date:e.date,value:e.scores[criterion.id]}));return <Dialog open onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>{criterion.short} · {value.ev.person}<IconButton onClick={onClose} sx={{float:"right"}}><Close/></IconButton></DialogTitle><DialogContent><Typography color="text.secondary">{criterion.name}</Typography><ResponsiveContainer width="100%" height={230}><LineChart data={history}><CartesianGrid stroke="#333"/><XAxis dataKey="date" tickFormatter={formatDate}/><YAxis domain={[0,10]}/><ChartTooltip/><Line dataKey="value" stroke={orange}/></LineChart></ResponsiveContainer><Stack direction="row" alignItems="center" gap={2}><Typography variant="h4">{Number(current).toFixed(1)}</Typography><Button startIcon={<Edit/>} onClick={()=>{const x=prompt("Nueva calificación (0–10)",String(current));if(x!==null){const n=Number(x);if(n>=0&&n<=10)onEdit(value.ev.id,criterion.id,n)}}}>Editar en esta sesión</Button></Stack><Typography color="text.secondary" sx={{mt:2}}>{value.ev.scoreNotes[criterion.id]||value.ev.notes}</Typography></DialogContent></Dialog>}
