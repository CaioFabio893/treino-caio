import { useState } from "react";
import { ArrowUpRight, BarChart3, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppState, Lift } from "./domain/model";
import { LIFTS, liftMetrics, totalLoad } from "./domain/engine";
export default function Performance({ state }: { state: AppState }) {
  const [lift, setLift] = useState<Lift | "bench">("squat");
  const [period, setPeriod] = useState(90);
  const records = liftMetrics(state.sessions, lift);
  const cycleSessions = state.sessions.filter((s) =>
    s.id.startsWith(`${state.profile.cycleStart}:`),
  );
  const since = Date.now() - period * 86400000;
  const data = records
    .filter((r) => new Date(`${r.date}T12:00:00`).getTime() >= since)
    .map((r) => ({
      ...r,
      estimate: r.estimate === null ? null : Number(r.estimate.toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const bestEstimate = Math.max(0, ...records.map((r) => r.estimate ?? 0));
  const tested = Math.max(
    0,
    ...liftMetrics(cycleSessions, lift)
      .filter((r) => r.tested)
      .map((r) => r.total),
  );
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const sessions = cycleSessions.filter((s) => s.plan.week === i + 1);
    const sets = sessions.flatMap((s) =>
      s.sets
        .filter((set) => set.successful)
        .map((set) => ({
          set,
          exercise: s.plan.exercises.find((e) => e.id === set.exerciseId),
        })),
    );
    return {
      week: `S${i + 1}`,
      volume: sets.reduce(
        (n, { set, exercise }) =>
          n +
          (exercise?.unit === "reps"
            ? totalLoad(set.load, set.bodyweight, !!exercise.weighted) *
              set.amount
            : 0),
        0,
      ),
      rpe: sets.length
        ? Number(
            (sets.reduce((n, { set }) => n + set.rpe, 0) / sets.length).toFixed(
              1,
            ),
          )
        : null,
      sessions: sessions.filter((s) => s.finishedAt).length,
    };
  });
  const recovery = [...state.readiness]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-21);
  const color = state.theme === "dark" ? "#b9f14d" : "#477800";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EVIDÊNCIA, NÃO SUPOSIÇÃO</span>
          <h1>Força em perspectiva.</h1>
          <p>
            Dados das suas séries. Estimativas, máximos históricos e testes em
            espaços distintos.
          </p>
        </div>
        <TrendingUp size={28} className="lime" />
      </div>
      <div className="chart-toolbar">
        <label className="field">
          <span>Movimento</span>
          <select
            value={lift}
            onChange={(e) => setLift(e.target.value as Lift | "bench")}
          >
            {[
              ...LIFTS,
              { id: "bench", name: "Supino reto", weighted: false },
            ].map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Período</span>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <option value={30}>30 dias</option>
            <option value={90}>90 dias</option>
            <option value={365}>1 ano</option>
          </select>
        </label>
      </div>
      <div className="stat-grid">
        <section className="card stat">
          <span className="eyebrow">MÁXIMO HISTÓRICO</span>
          <h3>
            {LIFTS.find((l) => l.id === lift)?.weighted ? "+" : ""}
            {state.profile.historical[lift]} <small>kg</small>
          </h3>
          <p>
            Antigo ·{" "}
            {LIFTS.find((l) => l.id === lift)?.weighted
              ? "lastro adicional"
              : "carga na barra"}
          </p>
        </section>
        <section className="card stat">
          <span className="eyebrow">MELHOR E1RM REGISTRADO</span>
          <h3>
            {bestEstimate ? bestEstimate.toFixed(1) : "—"} <small>kg</small>
          </h3>
          <p>
            Epley ·{" "}
            {LIFTS.find((l) => l.id === lift)?.weighted
              ? "peso total"
              : "carga estimada"}
          </p>
        </section>
        <section className="card stat">
          <span className="eyebrow">MÁXIMO TESTADO NO CICLO</span>
          <h3>
            {tested || "—"} <small>kg</small>
          </h3>
          <p>Single bem-sucedido em PR Test</p>
        </section>
        <section className="card stat">
          <span className="eyebrow">TRAINING MAX VALIDADO</span>
          <h3>
            {lift === "bench" ? "—" : (state.profile.trainingMax[lift] ?? "—")}{" "}
            <small>kg</small>
          </h3>
          <p>Informado no perfil · não inferido</p>
        </section>
      </div>
      <section className="card">
        <div className="section-title">
          <div>
            <span className="eyebrow">EVOLUÇÃO · E1RM</span>
            <h3>
              {lift === "bench"
                ? "Supino reto"
                : LIFTS.find((l) => l.id === lift)?.name}
            </h3>
          </div>
          <ArrowUpRight size={20} className="lime" />
        </div>
        {data.length === 0 ? (
          <ChartEmpty text="Registre séries de 1–10 reps deste main lift para acompanhar a estimativa." />
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 15, right: 10, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient
                    id="strength-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted)"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => String(v).slice(5)}
                />
                <YAxis
                  stroke="var(--muted)"
                  tick={{ fontSize: 11 }}
                  width={48}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--text)",
                  }}
                />
                <Area
                  name="e1RM estimado (kg)"
                  type="monotone"
                  dataKey="estimate"
                  stroke={color}
                  fill="url(#strength-fill)"
                  strokeWidth={2}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="subtle">
          e1RM não corrige RPE nem mede prontidão. Séries acima de 10 reps ficam
          fora. Movimentos com lastro usam peso total da sessão.
        </p>
      </section>
      <div className="bottom-grid">
        <section className="card">
          <h3>Volume por semana</h3>
          {state.sessions.some((s) => s.sets.length) ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeks}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    stroke="var(--muted)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--muted)"
                    width={55}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel)",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Area
                    dataKey="volume"
                    name="Volume (kg × reps)"
                    stroke={color}
                    fill={color}
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty text="O volume aparece conforme as séries são registradas." />
          )}
          <p className="subtle">
            Somente séries em repetições bem-sucedidas. Distância e isometria
            não viram tonelagem. Movimentos com lastro incluem peso corporal.
          </p>
        </section>
        <section className="card">
          <h3>Esforço médio por semana</h3>
          {state.sessions.some((s) => s.sets.length) ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeks}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    stroke="var(--muted)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis domain={[0, 10]} stroke="var(--muted)" width={30} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel)",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Line
                    dataKey="rpe"
                    name="RPE médio"
                    stroke={color}
                    strokeWidth={2}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty text="RPE ausente não é zero. Aguardando suas séries." />
          )}
        </section>
      </div>
      <section className="card">
        <h3>Recuperação ao longo dos dias</h3>
        {recovery.length ? (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recovery}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted)"
                  tickFormatter={(v) => String(v).slice(5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="var(--muted)" width={30} domain={[0, 24]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                  }}
                />
                <Line
                  dataKey="sleep"
                  name="Sono (h)"
                  stroke={color}
                  strokeWidth={2}
                />
                <Line
                  dataKey="pain"
                  name="Dor (0–10)"
                  stroke="#b49cdd"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartEmpty text="Preencha os check-ins para visualizar sono e dor ao longo dos dias." />
        )}
      </section>
      <section className="card">
        <h3>Registros e PRs testados</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Movimento</th>
                <th>Melhor single testado</th>
                <th>e1RM estimado</th>
                <th>Histórico antigo</th>
              </tr>
            </thead>
            <tbody>
              {LIFTS.map((l) => {
                const rows = liftMetrics(state.sessions, l.id);
                const singles = rows.filter((r) => r.tested);
                return (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td>
                      {singles.length
                        ? `${Math.max(...singles.map((r) => r.total))} kg${l.weighted ? " totais" : ""}`
                        : "—"}
                    </td>
                    <td>
                      {rows.some((r) => r.estimate !== null)
                        ? `${Math.max(...rows.map((r) => r.estimate ?? 0)).toFixed(1)} kg`
                        : "—"}
                    </td>
                    <td>
                      {l.weighted ? "+" : ""}
                      {state.profile.historical[l.id]} kg{" "}
                      {l.weighted ? "lastro" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="subtle">
          Máximos testados preservam o peso corporal de cada tentativa;
          alterações posteriores no perfil não recalculam o histórico. Modelo:
          Epley v1.
        </p>
      </section>
    </>
  );
}
function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="empty chart-empty">
      <BarChart3 size={32} />
      <strong>Os seus dados vão contar essa história.</strong>
      <p>{text}</p>
    </div>
  );
}
