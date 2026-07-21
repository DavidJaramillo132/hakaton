import { useMemo, useState } from "react";
import type { NivelRiesgo, PronosticoDia } from "../types";

type Props = { days: PronosticoDia[] };
const RISK_COLOR: Record<NivelRiesgo, string> = { bajo: "#27824b", medio: "#d38b19", alto: "#dc4c42" };
const display = (value: number | null, suffix: string) => value === null ? "Sin dato" : `${Math.round(value)}${suffix}`;

export function WeeklyForecastChart({ days }: Props) {
  const [active, setActive] = useState(0);
  const dimensions = { width: 348, height: 192, left: 28, top: 14, chartHeight: 112, right: 15 };
  const chartWidth = dimensions.width - dimensions.left - dimensions.right;
  const temperatureRange = useMemo(() => {
    const values = days.flatMap((day) => [day.tempMin, day.tempMax]).filter((value): value is number => value !== null);
    const min = Math.min(...values, 15); const max = Math.max(...values, 35);
    return { min: Math.floor(min / 5) * 5, max: Math.ceil(max / 5) * 5 || 35 };
  }, [days]);
  if (!days.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No hay datos suficientes para mostrar el pronóstico de siete días.</div>;
  const x = (index: number) => dimensions.left + chartWidth * ((index + 0.5) / days.length);
  const riskY = (score: number) => dimensions.top + dimensions.chartHeight - (score / 100) * dimensions.chartHeight;
  const tempY = (temperature: number) => dimensions.top + dimensions.chartHeight - ((temperature - temperatureRange.min) / Math.max(1, temperatureRange.max - temperatureRange.min)) * dimensions.chartHeight;
  const buildLine = (key: "tempMax" | "tempMin" | "riesgo") => days.reduce((path, day, index) => {
    const value = key === "riesgo" ? day.riesgo?.puntuacion ?? null : day[key];
    return value === null ? path : `${path}${path && !path.endsWith("M") ? " L" : "M"}${x(index).toFixed(1)} ${key === "riesgo" ? riskY(value).toFixed(1) : tempY(value).toFixed(1)}`;
  }, "");
  const current = days[Math.min(active, days.length - 1)];
  return <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="forecast-title"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cuándo actuar</p><h3 id="forecast-title" className="mt-1 font-display text-xl font-bold text-leaf-900">Pronóstico de 7 días</h3></div><span className="rounded-lg bg-leaf-50 px-2 py-1 text-xs font-semibold text-leaf-700">Índice preventivo</span></div><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500"><Legend color="#60a5fa" label="Lluvia" /><Legend color="#f97316" label="Temp. máx." line /><Legend color="#64748b" label="Temp. mín." line /><Legend color="#27824b" label="Riesgo" line /></div>
    <svg className="mt-2 w-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} role="img" aria-label="Gráfico de lluvia, temperatura y riesgo para los próximos siete días"><text x="0" y={dimensions.top + 4} fill="#94a3b8" fontSize="9">100%</text><text x="3" y={dimensions.top + dimensions.chartHeight} fill="#94a3b8" fontSize="9">0</text><text x={dimensions.width - 19} y={dimensions.top + 4} fill="#94a3b8" fontSize="9">{temperatureRange.max}°</text><text x={dimensions.width - 19} y={dimensions.top + dimensions.chartHeight} fill="#94a3b8" fontSize="9">{temperatureRange.min}°</text>{[0, 50, 100].map((tick) => <line key={tick} x1={dimensions.left} x2={dimensions.width - dimensions.right} y1={riskY(tick)} y2={riskY(tick)} stroke="#e2e8f0" strokeDasharray="3 3" />)}{days.map((day, index) => { const rainfall = day.lluvia ?? 0; const barY = riskY(rainfall); return <g key={day.fecha} aria-label={`${day.etiqueta}: lluvia ${display(day.lluvia, "%")}, máxima ${display(day.tempMax, "°C")}, mínima ${display(day.tempMin, "°C")}, riesgo ${day.riesgo ? `${day.riesgo.puntuacion}% ${day.riesgo.nivel}` : "sin dato"}`} onFocus={() => setActive(index)} onMouseEnter={() => setActive(index)} role="button" tabIndex={0}><rect fill="#93c5fd" height={dimensions.top + dimensions.chartHeight - barY} opacity=".7" rx="2" width={Math.max(8, chartWidth / days.length * 0.38)} x={x(index) - Math.max(8, chartWidth / days.length * 0.38) / 2} y={barY} /><text fill="#64748b" fontSize="10" textAnchor="middle" x={x(index)} y={dimensions.top + dimensions.chartHeight + 20}>{day.etiqueta}</text></g>; })}<path d={buildLine("tempMax")} fill="none" stroke="#f97316" strokeWidth="2.1" /><path d={buildLine("tempMin")} fill="none" stroke="#64748b" strokeDasharray="4 3" strokeWidth="1.8" /><path d={buildLine("riesgo")} fill="none" stroke="#334155" strokeWidth="2.3" />{days.map((day, index) => day.riesgo && <circle key={`${day.fecha}-risk`} cx={x(index)} cy={riskY(day.riesgo.puntuacion)} fill={RISK_COLOR[day.riesgo.nivel]} r="4" stroke="white" strokeWidth="1.5" />)}</svg>
    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600" aria-live="polite"><strong className="text-slate-800">{current.etiqueta}:</strong> lluvia {display(current.lluvia, "%")} · {display(current.tempMin, "°C")}–{display(current.tempMax, "°C")} · <span className="font-semibold" style={{ color: current.riesgo ? RISK_COLOR[current.riesgo.nivel] : undefined }}>riesgo {current.riesgo ? `${current.riesgo.puntuacion}% (${current.riesgo.nivel})` : "sin dato"}</span></div>
  </section>;
}

function Legend({ color, label, line = false }: { color: string; label: string; line?: boolean }) { return <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm" style={line ? { height: 2, backgroundColor: color } : { backgroundColor: color }} />{label}</span>; }
