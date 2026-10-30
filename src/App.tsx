import { waveSummary } from "./domain/waves";
import { loadDescription, planLoads } from "./domain/loads";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  Flame,
  Heart,
  History,
  House,
  Leaf,
  Menu,
  Minus,
  Plus,
  Settings2,
  ShieldCheck,
  Target,
  TrendingUp,
  WifiOff,
  X,
} from "lucide-react";
import {
  PROGRAM_ID,
  WEEKDAY_LABELS,
  ROTATION,
  TRAINING_DAYS,
  oapuProtocol,
} from "./domain/program";
import type { LucideIcon } from "lucide-react";
import {
  accessoryProgression,
  alternatives,
  reducePushVolume,
  substitute,
} from "./domain/accessories";
import type {
  AppState,
  Exercise,
  OapuLog,
  Page,
  Session,
} from "./domain/model";
import {
  addSet,
  dateKey,
  LIFTS,
  liftMetrics,
  localDate,
  makePlan,
  workoutName,
  startSession,
  suggestion,
  time,
  totalLoad,
  WEEKS,
} from "./domain/engine";
import {
  commit,
  decode,
  exportState,
  storageWarning,
  useStore,
} from "./data/store";
const Performance = lazy(() => import("./Performance"));
const CloudPanel = lazy(() => import("./CloudPanel"));
type Run = (
  action: () => void | Promise<void>,
  success?: string,
) => Promise<void>;
const NAV: { page: Page; title: string; icon: LucideIcon }[] = [
  { page: "inicio", title: "Início", icon: House },
  { page: "treino", title: "Treino", icon: Dumbbell },
  { page: "ciclo", title: "Periodização", icon: Target },
  { page: "evolucao", title: "Performance", icon: TrendingUp },
  { page: "recuperacao", title: "Recuperação", icon: Heart },
  { page: "historico", title: "Histórico", icon: History },
  { page: "perfil", title: "Configurações", icon: Settings2 },
];
function Tag({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <span className={`tag ${muted ? "muted" : ""}`}>{children}</span>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <Activity size={28} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export default function App() {
  const state = useStore();
  const now = Date.now();
  const [savedSelection] = useState(() => {
    try {
      const raw: unknown = JSON.parse(
        localStorage.getItem(
          `hybrid-strength:selection:${state.profile.cycleStart}:${PROGRAM_ID}`,
        ) ?? "null",
      );
      if (
        raw &&
        typeof raw === "object" &&
        "week" in raw &&
        "day" in raw &&
        typeof raw.week === "number" &&
        Number.isInteger(raw.week) &&
        raw.week >= 1 &&
        raw.week <= 12 &&
        typeof raw.day === "number" &&
        TRAINING_DAYS.includes(raw.day)
      )
        return { week: raw.week, day: raw.day };
    } catch {
      /* Armazenamento indisponível não impede consultar a ficha. */
    }
    return { week: 1, day: 1 };
  });
  const [page, setPage] = useState<Page>("inicio");
  // Uma sessão aberta nunca substitui a escolha explícita do usuário.
  const [week, setWeek] = useState(savedSelection.week);
  const [showAll, setShowAll] = useState(false);
  const [day, setDay] = useState(savedSelection.day);
  const selectionRevision = useRef(0);
  function chooseDay(value: number) {
    selectionRevision.current++;
    setDay(value);
    setShowAll(false);
    go("treino");
  }
  function chooseWeek(value: number) {
    selectionRevision.current++;
    setWeek(value);
    setShowAll(false);
  }
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const active = state.sessions.find(
    (s) =>
      s.finishedAt === null &&
      s.plan.week === week &&
      s.plan.day === day &&
      s.id.startsWith(`${state.profile.cycleStart}:`) &&
      s.plan.program === PROGRAM_ID,
  );
  const cycleSessions = state.sessions.filter(
    (s) =>
      s.id.startsWith(`${state.profile.cycleStart}:`) &&
      s.plan.program === PROGRAM_ID,
  );
  const plan = makePlan(week, day, state.profile, state.sessions);
  const w = WEEKS[week - 1];
  useEffect(() => {
    try {
      localStorage.setItem(
        `hybrid-strength:selection:${state.profile.cycleStart}:${PROGRAM_ID}`,
        JSON.stringify({ week, day }),
      );
    } catch {
      /* Os registros principais continuam com tratamento próprio de erro. */
    }
  }, [week, day, state.profile.cycleStart]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);
  useEffect(() => {
    const fn = () => setOnline(navigator.onLine);
    window.addEventListener("online", fn);
    window.addEventListener("offline", fn);
    return () => {
      window.removeEventListener("online", fn);
      window.removeEventListener("offline", fn);
    };
  }, []);
  async function run(action: () => void | Promise<void>, success = "") {
    try {
      await action();
      setError(false);
      setMessage(success);
    } catch (e) {
      setError(true);
      setMessage(
        e instanceof Error
          ? e.message
          : "Não foi possível concluir. Seus dados anteriores foram preservados.",
      );
    }
  }
  function go(next: Page) {
    setPage(next);
    setMenu(false);
    window.scrollTo({ top: 0 });
  }
  async function begin() {
    const revision = selectionRevision.current;
    await run(async () => {
      await commit((s) => {
        const created = startSession(
          s,
          makePlan(week, day, s.profile, s.sessions),
        );
        return s.sessions.some((x) => x.id === created.id)
          ? s
          : { ...s, sessions: [...s.sessions, created] };
      });
      if (selectionRevision.current !== revision) return;
      setShowAll(false);
      go("treino");
    });
  }
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        Pular para conteúdo
      </a>
      {menu && (
        <button
          className="scrim"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            go("inicio");
          }}
        >
          <span className="brand-icon">
            <Activity />
          </span>
          <span>
            HYBRID
            <strong>
              STRENGTH<span className="lime">.</span>
            </strong>
          </span>
        </a>
        <div className="cycle-mini">
          <span className="eyebrow">SEU PROGRAMA</span>
          <strong>12 semanas. Mais forte.</strong>
          <div className="mini-progress">
            <i
              style={{
                width: `${(week / 12) * 100}%`,
              }}
            />
          </div>
          <small>Semana {week} de 12</small>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {NAV.map(({ page: p, title, icon: Icon }) => (
            <button
              key={p}
              onClick={() => go(p)}
              className={page === p ? "selected" : ""}
              aria-current={page === p ? "page" : undefined}
            >
              <Icon size={19} />
              {title}
              {p === "treino" && active && <span className="live-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="local-note">
            <ShieldCheck size={17} />
            <span>
              Seus dados, no aparelho.
              <small>Exporte uma cópia regularmente.</small>
            </span>
          </div>
          <button className="user-button" onClick={() => go("perfil")}>
            <span className="avatar">
              {state.profile.name.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{state.profile.name}</strong>
              <small>Atleta · Força híbrida</small>
            </span>
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{NAV.find((n) => n.page === page)?.title}</strong>
          </div>
          <div className="top-right">
            <span className="connection">
              {online ? <span className="status-dot" /> : <WifiOff size={14} />}{" "}
              {online ? "Modo local" : "Offline · dados locais"}
            </span>
            <span className="top-date">
              {new Date(now).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <button
              className="avatar"
              onClick={() => go("perfil")}
              aria-label="Abrir perfil"
            >
              {state.profile.name.slice(0, 1)}
            </button>
          </div>
        </header>
        <main
          id="main"
          className={page === "treino" && active ? "main active-main" : "main"}
        >
          {(message || storageWarning()) && (
            <div
              role={error || storageWarning() ? "alert" : "status"}
              className={`notice ${error ? "error" : ""}`}
            >
              <span>{message || storageWarning()}</span>
              <button
                className="icon-button"
                aria-label="Fechar aviso"
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {page === "inicio" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CONSTÂNCIA CONSTRÓI FORÇA</div>
                  <h1>
                    Vamos evoluir, {state.profile.name.split(" ")[0]}
                    <span className="lime">.</span>
                  </h1>
                  <p>Seu plano, sua execução. Uma sessão de cada vez.</p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => go("ciclo")}
                >
                  Semana {week} <ChevronRight size={16} />
                </button>
              </div>
              <div className="dashboard-grid">
                <section className="hero">
                  <div className="hero-top">
                    <Tag>
                      {active ? "REGISTRO EM ANDAMENTO" : "TREINO ESCOLHIDO"}
                    </Tag>
                    <span className="eyebrow">{w.phase.toUpperCase()}</span>
                  </div>
                  <div className="hero-content">
                    <div className="hero-copy">
                      <span className="eyebrow">
                        {workoutName(day).toUpperCase()} · SEMANA {week}
                      </span>
                      <h2>
                        Força com
                        <br />
                        <span className="outline-text">intenção.</span>
                      </h2>
                      <p>
                        {plan.name} · {plan.focus}. Execute com controle e
                        respeite o seu RPE.
                      </p>
                      <div className="hero-facts">
                        <span>
                          <Check size={16} /> No seu ritmo
                        </span>
                        <span>
                          <Dumbbell size={16} /> {plan.exercises.length}{" "}
                          exercícios
                        </span>
                        {plan.pull && (
                          <span>
                            <Target size={16} /> OAPU · protocolo disponível
                          </span>
                        )}
                      </div>
                      <button
                        className="button primary"
                        onClick={() => (active ? go("treino") : void begin())}
                      >
                        {active ? "Retomar treino" : "Iniciar treino"}{" "}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                    <div className="strength-art" aria-hidden="true">
                      <span className="art-ring ring-one" />
                      <span className="art-ring ring-two" />
                      <div className="barbell">
                        <i />
                        <i />
                        <b />
                        <i />
                        <i />
                      </div>
                      <div className="art-caption">
                        STRONGER
                        <br />
                        <span>EVERY SESSION</span>
                      </div>
                    </div>
                  </div>
                  <div className="hero-footer">
                    <span className="status-dot" />
                    Sem supersets. Sem pressa. Com propósito.
                    <span>HS / 01</span>
                  </div>
                </section>
                <section className="card readiness-card">
                  <div className="section-label">
                    <span>COMO VOCÊ ESTÁ?</span>
                    <Heart size={18} />
                  </div>
                  <div className="readiness-glyph">
                    <Leaf size={40} />
                  </div>
                  <h3>Comece pelo seu estado.</h3>
                  <p>
                    O treino se adapta à execução. Sono, dor e fadiga ajudam a
                    decidir o próximo passo.
                  </p>
                  {state.readiness.find((r) => r.date === dateKey()) ? (
                    <div className="readiness-values">
                      <strong>
                        {
                          state.readiness.find((r) => r.date === dateKey())
                            ?.sleep
                        }{" "}
                        h <small>de sono</small>
                      </strong>
                      <strong>
                        {
                          state.readiness.find((r) => r.date === dateKey())
                            ?.pain
                        }
                        /10 <small>dor</small>
                      </strong>
                    </div>
                  ) : (
                    <span className="subtle">
                      Check-in de hoje ainda não registrado
                    </span>
                  )}
                  <button
                    className="button secondary full"
                    onClick={() => go("recuperacao")}
                  >
                    Fazer check-in <ArrowRight size={16} />
                  </button>
                </section>
              </div>
              <div className="stat-grid">
                <Stat
                  label="PESO CORPORAL"
                  value={`${state.profile.bodyweight}`}
                  unit="kg"
                  sub="Atualize no seu perfil"
                  icon={Activity}
                />
                <Stat
                  label="SESSÕES CONCLUÍDAS"
                  value={String(
                    state.sessions.filter((s) => s.finishedAt).length,
                  )}
                  unit="sessões"
                  sub="Somente registros reais"
                  icon={Check}
                />
                <Stat
                  label="PROGRESSO DOS TREINOS"
                  value={String(
                    Math.round(
                      (new Set(
                        cycleSessions
                          .filter((s) => s.finishedAt && s.plan.week === week)
                          .map((s) => s.plan.day),
                      ).size /
                        6) *
                        100,
                    ),
                  )}
                  unit="%"
                  sub="Dos 6 planos da semana selecionada"
                  icon={Flame}
                />
                <Stat
                  label="FASE ATUAL"
                  value={WEEKS[week - 1].phase}
                  sub={`Semana ${week} de 12`}
                  icon={Target}
                />
              </div>
              <section className="card week-card">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">
                      O PLANO É SIMPLES. A EXECUÇÃO É SUA.
                    </span>
                    <h3>Seus treinos A–F</h3>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setShowAll(true);
                      go("treino");
                    }}
                  >
                    Ver todos os treinos <ArrowRight size={15} />
                  </button>
                </div>
                <div className="week-strip">
                  {TRAINING_DAYS.map((d) => {
                    const summary = makePlan(week, d);
                    return (
                      <button
                        key={d}
                        className={`day-card ${day === d ? "today" : ""}`}
                        onClick={() => {
                          chooseDay(d);
                        }}
                      >
                        <span>
                          {workoutName(d)} · {WEEKDAY_LABELS[d - 1]}
                        </span>
                        <div className="day-icon">
                          <Dumbbell size={20} />
                        </div>
                        <strong>
                          {summary.pr
                            ? `Teste: ${summary.exercises[0]?.name ?? summary.focus}`
                            : summary.focus}
                        </strong>
                        <small>
                          {!summary.exercises.length && !summary.pull
                            ? "Sem treino de força"
                            : summary.pull
                              ? `One-arm · RPE ≤ ${oapuProtocol(week, d).rpe}`
                              : `RPE principal ≤ ${summary.exercises[0]?.rpe ?? WEEKS[week - 1].rpe}`}
                        </small>
                      </button>
                    );
                  })}
                </div>
                <p className="subtle">
                  Distribuição sugerida em sete dias: one-arm 3× (A/C/E), dip 2×
                  (C/F), agachamento 2× (B/F) e terra sozinho em D. Domingo é
                  descanso. As letras continuam
                  livres, sem bloqueio por data. Na semana de testes, priorize
                  recuperação e não force todos os PRs.
                </p>
              </section>
              <div className="bottom-grid">
                <section className="card">
                  <div className="section-title">
                    <div>
                      <span className="eyebrow">SEUS QUATRO MOVIMENTOS</span>
                      <h3>Uma base mais forte</h3>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("evolucao")}
                    >
                      Performance <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="lift-list">
                    {LIFTS.map((l) => {
                      const metrics = liftMetrics(state.sessions, l.id);
                      const best = metrics
                        .filter((m) => m.estimate !== null)
                        .reduce((n, m) => Math.max(n, m.estimate!), 0);
                      return (
                        <div className="lift-row" key={l.id}>
                          <span className="lift-symbol">
                            <Dumbbell size={18} />
                          </span>
                          <div>
                            <strong>{l.name}</strong>
                            <small>
                              {l.weighted
                                ? "e1RM de peso total"
                                : "e1RM estimado"}
                            </small>
                          </div>
                          <strong>
                            {best ? `${best.toFixed(1)} kg` : "—"}
                            <small>
                              {best
                                ? "Epley · estimativa"
                                : "Aguardando execução"}
                            </small>
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="card principle">
                  <span className="eyebrow">O SEU PROCESSO</span>
                  <h3>
                    A qualidade de hoje
                    <br />é a força de amanhã.
                  </h3>
                  <p>
                    Os seus máximos antigos são história. As cargas de agora são
                    construídas com técnica, RPE e recuperação.
                  </p>
                  <div className="principle-bottom">
                    <span className="circle-mark">12</span>
                    <span>
                      semanas de evolução
                      <br />
                      <small>Acumulação → Intensificação → Peaking</small>
                    </span>
                  </div>
                </section>
              </div>
            </>
          )}
          {page === "treino" && (
            <>
              <PageHeading
                eyebrow="SEUS TREINOS, NO SEU RITMO"
                title="Treinos A–F"
                text="Abra qualquer treino quando quiser. Consulte o plano completo ou registre suas séries sem cronômetro e sem travas de calendário."
              />
              <PlanSelect
                week={week}
                day={day}
                setWeek={chooseWeek}
                setDay={chooseDay}
              />
              <div
                className="view-switch"
                aria-label="Visualização dos treinos"
              >
                <button
                  className={showAll ? "button secondary" : "button primary"}
                  aria-pressed={!showAll}
                  onClick={() => setShowAll(false)}
                >
                  Treino completo
                </button>
                <button
                  className={showAll ? "button primary" : "button secondary"}
                  aria-pressed={showAll}
                  onClick={() => setShowAll(true)}
                >
                  Todos os treinos
                </button>
              </div>
              {showAll ? (
                <div className="whole-week">
                  {TRAINING_DAYS.map((index) => (
                    <PlanPreview
                      key={index}
                      plan={makePlan(
                        week,
                        index,
                        state.profile,
                        state.sessions,
                      )}
                      onOpen={() => {
                        chooseDay(index);
                      }}
                    />
                  ))}
                </div>
              ) : active ? (
                <Workout
                  key={active.id}
                  session={active}
                  state={state}
                  run={run}
                  onExit={() => go("inicio")}
                />
              ) : (
                <PlanPreview plan={plan} onBegin={() => void begin()} />
              )}
            </>
          )}
          {page === "ciclo" && (
            <>
              <PageHeading
                eyebrow="VISÃO DE LONGO PRAZO"
                title="12 semanas. Um propósito."
                text="Construa volume, desenvolva força, chegue pronto. Os treinos de volume mantêm seus próprios limites de esforço."
              />
              <div className="phase-legend">
                {["Reentrada", "Acumulação", "Intensificação", "Pico", "Teste PR"].map(
                  (p, i) => (
                    <Tag key={p} muted={i !== 0}>
                      {String(i + 1).padStart(2, "0")} / {p}
                    </Tag>
                  ),
                )}
              </div>
              <div className="cycle-grid">
                {WEEKS.map((wk) => (
                  <button
                    className={`card week-tile ${week === wk.week ? "chosen" : ""}`}
                    key={wk.week}
                    onClick={() => {
                      chooseWeek(wk.week);
                      go("treino");
                    }}
                  >
                    <div>
                      <span className="eyebrow">
                        SEMANA {String(wk.week).padStart(2, "0")}
                      </span>
                      {wk.week === week && <Tag>Atual</Tag>}
                    </div>
                    <h3>{wk.label}</h3>
                    <p>{wk.phase}</p>
                    <div className="week-prescription">
                      <strong>
                        {wk.week === 12
                          ? "Até 3 tentativas"
                          : waveSummary(makePlan(wk.week, 2).exercises[0])}
                      </strong>
                      <span>
                        {wk.percent}% RM · RPE ≤ {wk.rpe}
                      </span>
                    </div>
                    <small>
                      {wk.week === 12
                        ? "Testes com prontidão · sem 105% automático"
                        : "Referência do squat; cada movimento tem dose própria"}
                    </small>
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>
            </>
          )}
          {page === "evolucao" && (
            <Suspense fallback={<p>Carregando gráficos…</p>}>
              <Performance state={state} />
            </Suspense>
          )}
          {page === "recuperacao" && <Recovery state={state} run={run} />}
          {page === "historico" && (
            <>
              <PageHeading
                eyebrow="CADA SESSÃO CONTA"
                title="Seu histórico"
                text="Execução registrada, sem dados de demonstração. Sessões parciais continuam identificadas."
              />
              {state.sessions.length === 0 ? (
                <section className="card">
                  <Empty
                    title="Sua história começa no primeiro treino"
                    text="As séries e os tempos aparecerão aqui depois que você iniciar uma sessão."
                  />
                </section>
              ) : (
                [...state.sessions].reverse().map((s) => (
                  <details className="card history-item" key={s.id}>
                    <summary>
                      <div>
                        <span className="eyebrow">
                          {localDate(s.date).toLocaleDateString("pt-BR")} ·
                          SEMANA {s.plan.week}
                        </span>
                        <h3>{s.plan.name}</h3>
                      </div>
                      <Tag muted={!s.finishedAt}>
                        {s.finishedAt ? "Finalizada" : "Em andamento"}
                      </Tag>
                      <span>{s.sets.length} séries</span>
                    </summary>
                    <p>
                      Peso corporal registrado: {s.bodyweight} kg. Modelo:{" "}
                      {s.version}.
                    </p>
                    {s.sets.map((set) => (
                      <div className="history-set" key={set.id}>
                        <strong>
                          {
                            s.plan.exercises.find(
                              (e) => e.id === set.exerciseId,
                            )?.name
                          }{" "}
                          · série {set.index + 1}
                        </strong>
                        <span>
                          {set.load} kg
                          {(set.assistance ?? 0) > 0
                            ? ` · assistência ${set.assistance} kg`
                            : ""}{" "}
                          · {set.amount}{" "}
                          {s.plan.exercises.find((e) => e.id === set.exerciseId)
                            ?.unit === "seconds"
                            ? "s"
                            : s.plan.exercises.find(
                                  (e) => e.id === set.exerciseId,
                                )?.unit === "meters"
                              ? "m"
                              : "reps"}{" "}
                          · RPE {set.rpe} {!set.successful && "· falhou"}
                        </span>
                      </div>
                    ))}
                    {s.oapu.map((log) => (
                      <p key={log.id}>
                        OAPU {log.side}: {log.reps} reps, {log.hold} s, RPE{" "}
                        {log.rpe}, {log.assistance}. {log.symptoms}
                      </p>
                    ))}
                    {s.decisions.map((d, i) => (
                      <p key={i}>
                        <strong>{d.decision}</strong> — {d.reason}
                      </p>
                    ))}
                    {s.sets.length === 0 && (
                      <p>Nenhuma série de força registrada.</p>
                    )}
                  </details>
                ))
              )}
            </>
          )}
          {page === "perfil" && <Profile state={state} run={run} go={go} />}
          <footer className="main-footer">
            <span>
              HYBRID STRENGTH <span className="lime">/</span> BUILT FOR THE LONG
              RUN
            </span>
            <span>Dados locais · Exporte sua cópia</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Navegação principal">
        {NAV.filter((n) =>
          ["inicio", "treino", "ciclo", "evolucao", "perfil"].includes(n.page),
        ).map(({ page: p, icon: Icon }) => (
          <button
            key={p}
            onClick={() => go(p)}
            className={page === p ? "selected" : ""}
            aria-current={page === p ? "page" : undefined}
          >
            <Icon size={21} />
            <span>
              {
                {
                  inicio: "Início",
                  treino: "Treino",
                  ciclo: "Ciclo",
                  evolucao: "Evolução",
                  perfil: "Perfil",
                }[p as "inicio"]
              }
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
function Stat({
  label,
  value,
  unit,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  icon: LucideIcon;
}) {
  return (
    <section className={`card stat ${value.length > 8 ? "word-value" : ""}`}>
      <div>
        <span className="eyebrow">{label}</span>
        <Icon size={18} />
      </div>
      <h3>
        {value} <small>{unit}</small>
      </h3>
      <p>{sub}</p>
    </section>
  );
}
function PageHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
function PlanSelect({
  week,
  day,
  setWeek,
  setDay,
}: {
  week: number;
  day: number;
  setWeek: (n: number) => void;
  setDay: (n: number) => void;
}) {
  return (
    <div className="plan-select">
      <Field label="Semana">
        <select value={week} onChange={(e) => setWeek(Number(e.target.value))}>
          {WEEKS.map((w) => (
            <option key={w.week} value={w.week}>
              S{w.week} · {w.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Treino">
        <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {TRAINING_DAYS.map((d) => (
            <option key={d} value={d}>
              {makePlan(week, d).name} · {makePlan(week, d).focus}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function LoadBasis({ exercise: e }: { exercise: Exercise }) {
  return (
    <small className="subtle">
      {e.percent !== undefined
        ? `${e.percent}% do RM${e.weighted ? " (só lastro)" : ""}`
        : "Carga por RPE"}
      {e.rm !== undefined
        ? ` · RM ${e.rm} kg${e.weighted ? " de lastro" : ""} · ${e.rmSource === "historical" ? "histórico provisório" : "atual"}`
        : " · RM não informado"}
      {" "}
      · RPE ≤ {e.rpe}
      {e.scheduledPercent !== undefined &&
      e.percent !== undefined &&
      Math.abs(e.scheduledPercent - e.percent) > 0.01
        ? ` · alvo semanal ${e.scheduledPercent}%, limitado/ajustado pela progressão e arredondamento`
        : ""}
    </small>
  );
}

function PlanPreview({
  plan,
  onBegin,
  onOpen,
}: {
  plan: ReturnType<typeof makePlan>;
  onBegin?: () => void;
  onOpen?: () => void;
}) {
  return (
    <section
      className="card full-plan"
      aria-label={`Plano completo: ${plan.name}`}
    >
      <div className="section-title">
        <div>
          <Tag>
            Semana {plan.week} · {WEEKS[plan.week - 1].phase}
          </Tag>
          <h2>{plan.name}</h2>
          <p>{plan.focus}</p>
          <small>
            Bloco {Math.ceil(plan.week / 4)} · acessórios estáveis por quatro
            semanas, com progressão pela execução
          </small>
        </div>
        {onOpen && (
          <button className="button secondary" onClick={onOpen}>
            Abrir {plan.name}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
      {plan.pull && (
        <div className="protocol-preview">
          <strong>OAPU · {oapuProtocol(plan.week, plan.day).title}</strong>
          <p>
            {oapuProtocol(plan.week, plan.day).skill}
            <br />
            {oapuProtocol(plan.week, plan.day).support}
          </p>
          <small>
            RPE máximo {oapuProtocol(plan.week, plan.day).rpe}. Referência sem
            contagem regressiva ou bloqueio dos demais exercícios.
          </small>
        </div>
      )}
      <p className="subtle">
        {ROTATION}. Selecione a semana de preparação (1–12) em que está; esta
        distribuição é uma sugestão semanal, sem bloquear outros treinos.
      </p>
      <div className="exercise-preview">
        {plan.exercises.map((e, i) => (
          <article className="prescription" key={e.id}>
            <span className="exercise-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>{e.name}</h3>
              <p>{e.note || "Confirme a carga pelo esforço e pela técnica."}</p>
            </div>
            <strong>
              {waveSummary(e)}
              <small>
                {e.unit === "seconds"
                  ? "segundos"
                  : e.unit === "meters"
                    ? "metros"
                    : "repetições"}{" "}
                · RPE ≤ {e.rpe}
              </small>
            </strong>
            <strong>
              {loadDescription(e)}
              <LoadBasis exercise={e} />
              <small>Descanso sugerido: {time(e.rest)}</small>
            </strong>
          </article>
        ))}
      </div>
      {!plan.exercises.length && (
        <p>
          {plan.pull
            ? "Treino técnico de OAPU, sem testes de força."
            : "Descanso e recuperação, sem teste de força."}
        </p>
      )}
      {onBegin && (
        <button className="button primary" onClick={onBegin}>
          Iniciar treino
          <ArrowRight size={17} />
        </button>
      )}
    </section>
  );
}
function Workout({
  session,
  state,
  run,
  onExit,
}: {
  session: Session;
  state: AppState;
  run: Run;
  onExit: () => void;
}) {
  const [finish, setFinish] = useState(false);
  const completed = session.sets.length;
  const total = session.plan.exercises.reduce((n, e) => n + e.sets, 0);
  async function update(change: (s: Session) => Session) {
    await commit((s) => ({
      ...s,
      sessions: s.sessions.map((x) => (x.id === session.id ? change(x) : x)),
    }));
  }
  return (
    <>
      <section className="card session-header">
        <div className="session-name">
          <button
            className="icon-button"
            aria-label="Voltar ao início"
            onClick={onExit}
          >
            <ArrowRight size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div>
            <h2>{workoutName(session.plan.day)}</h2>
            <small>
              Semana {session.plan.week} · {session.plan.focus}
            </small>
          </div>
          <Tag>No seu ritmo</Tag>
        </div>
        <p className="subtle">
          Todos os exercícios estão abaixo. Você pode alternar para outro
          treino; seus registros ficam preservados.
        </p>
        <button
          className="button secondary"
          onClick={() =>
            void run(
              () =>
                update((s) => {
                  const fresh = makePlan(s.plan.week, s.plan.day);
                  const refreshed = {
                    ...s.plan,
                    exercises: s.plan.exercises.map((old) => {
                      if (s.sets.some((log) => log.exerciseId === old.id))
                        return old;
                      const current = fresh.exercises.find(
                        (e) =>
                          e.id === old.id ||
                          alternatives(e).some(([id]) => id === old.id),
                      );
                      return current
                        ? { ...old, ...current, id: old.id, name: old.name }
                        : old;
                    }),
                  };
                  const updated = planLoads(
                    refreshed,
                    {
                      ...state.profile,
                      bodyweight: s.bodyweight,
                    },
                    state.sessions,
                  );
                  return {
                    ...s,
                    plan: {
                      ...updated,
                      exercises: updated.exercises.map((e) =>
                        s.sets.some((log) => log.exerciseId === e.id)
                          ? s.plan.exercises.find((old) => old.id === e.id)!
                          : e,
                      ),
                    },
                    decisions: [
                      ...s.decisions,
                      {
                        at: Date.now(),
                        reason:
                          "Dose, RPE e RM/% atualizados apenas nos exercícios sem séries registradas.",
                        decision:
                          "Prescrições recalculadas; histórico executado preservado.",
                      },
                    ],
                  };
                }),
              "Cargas recalculadas nos exercícios ainda não registrados.",
            )
          }
        >
          Atualizar cargas e % pelos meus RMs
        </button>
      </section>
      {session.plan.pull && (
        <details className="card optional-oapu" open>
          <summary>
            One-arm pull-up · prioridade: registrar séries por braço
          </summary>
          <Oapu session={session} state={state} update={update} run={run} />
        </details>
      )}
      <div className="complete-workout">
        {session.plan.exercises.map((e) => (
          <ExerciseCard
            key={`${e.id}:${e.rm}:${e.percent}:${e.load}:${e.assistance}:${e.sets}:${JSON.stringify(e.setTargets)}`}
            exercise={e}
            session={session}
            state={state}
            update={update}
            run={run}
          />
        ))}
      </div>
      {!session.plan.exercises.length && (
        <section className="card">
          <Empty
            title={
              session.plan.pull ? "Treino técnico" : "Descanso e recuperação"
            }
            text={
              session.plan.pull
                ? "Consulte o protocolo de OAPU acima. Não há teste de força neste treino."
                : "Não há exercício ou teste de força prescrito nesta sessão."
            }
          />
        </section>
      )}
      <div className="session-bottom">
        <span>
          {completed}/{total} séries de força registradas · sem limite de tempo
        </span>
        <button className="button secondary" onClick={() => setFinish(true)}>
          Finalizar sessão
          <Check size={17} />
        </button>
      </div>
      {finish && (
        <ConfirmDialog onClose={() => setFinish(false)}>
          <h2 id="finish-title">Encerrar por hoje?</h2>
          <p>
            {completed} de {total} séries registradas. Séries não executadas
            ficam vazias.
          </p>
          <div className="button-row">
            <button
              className="button secondary"
              autoFocus
              onClick={() => setFinish(false)}
            >
              Continuar treino
            </button>
            <button
              className="button primary"
              onClick={() =>
                void run(
                  () =>
                    update((s) => ({
                      ...s,
                      finishedAt: Date.now(),
                      restUntil: null,
                    })),
                  "Sessão salva no histórico local.",
                )
              }
            >
              Confirmar término
            </button>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
function ConfirmDialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="card dialog native-dialog"
      aria-labelledby="finish-title"
      onCancel={onClose}
    >
      {children}
    </dialog>
  );
}
function Stepper({
  label,
  value,
  setValue,
  step = 1,
  min = 0,
  max = 1000,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <Field label={label}>
      <div className="stepper">
        <button
          type="button"
          aria-label={`Diminuir ${label}`}
          onClick={() =>
            setValue(String(Math.max(min, Number(value || 0) - step)))
          }
        >
          <Minus size={16} />
        </button>
        <input
          aria-label={label}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          aria-label={`Aumentar ${label}`}
          onClick={() =>
            setValue(String(Math.min(max, Number(value || 0) + step)))
          }
        >
          <Plus size={16} />
        </button>
      </div>
    </Field>
  );
}
function ExerciseCard({
  exercise: e,
  session,
  state,
  update,
  run,
}: {
  exercise: Exercise;
  session: Session;
  state: AppState;
  update: (change: (s: Session) => Session) => Promise<void>;
  run: Run;
}) {
  const done = session.sets.filter((s) => s.exerciseId === e.id);
  const planned = (i: number) =>
    e.setTargets?.[i] ??
    e.attempts?.[i] ?? { load: e.load, assistance: e.assistance ?? 0 };
  const initialIndex = Math.min(done.length, e.sets - 1);
  const initialLog = done.find((log) => log.index === initialIndex);
  const [index, setIndex] = useState(initialIndex);
  const [load, setLoad] = useState(() => {
    const value = initialLog?.load ?? planned(initialIndex).load;
    return value === null ? "" : String(value);
  });
  const [assistance, setAssistance] = useState(
    String(initialLog?.assistance ?? planned(initialIndex).assistance),
  );
  const [amount, setAmount] = useState(
    initialLog ? String(initialLog.amount) : "",
  );
  const [rpe, setRpe] = useState(initialLog ? String(initialLog.rpe) : "");
  const [ready, setReady] = useState(initialLog?.ready ?? false);
  const [successful, setSuccessful] = useState(initialLog?.successful ?? true);
  const existing = done.find((s) => s.index === index);
  const recovery = state.readiness.find((r) => r.date === dateKey());
  const progression =
    session.plan.pr || !!e.setTargets?.length
      ? null
      : accessoryProgression(
          e,
          state.sessions,
          session.id,
          state.profile.increment,
          recovery,
        );
  const variants = alternatives(e);
  const last = done.at(-1);
  const lastTargetRpe = last
    ? (e.setTargets?.[last.index]?.rpe ?? e.rpe)
    : e.rpe;
  const advice =
    last &&
    !session.plan.pr &&
    last.rpe >= lastTargetRpe + 1 &&
    (last.assistance ?? 0) === 0
      ? suggestion(
          last.load,
          last.rpe,
          lastTargetRpe,
          state.profile.increment,
          recovery?.pain,
        )
      : null;
  function selectSeries(i: number) {
    setIndex(i);
    const old = done.find((s) => s.index === i);
    setLoad(
      old
        ? String(old.load)
        : planned(i).load === null
          ? ""
          : String(planned(i).load),
    );
    setAssistance(String(old?.assistance ?? planned(i).assistance));
    setAmount(old ? String(old.amount) : "");
    setRpe(old ? String(old.rpe) : "");
    setSuccessful(old?.successful ?? true);
    setReady(old?.ready ?? false);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run(
      async () => {
        if (
          load === "" ||
          amount === "" ||
          rpe === "" ||
          (e.weighted && assistance === "")
        )
          throw new Error("Preencha carga, quantidade e RPE real.");
        const baseline = last?.load ?? e.load;
        if (
          (recovery?.pain ?? 0) > 3 &&
          baseline !== null &&
          Number(load) - (e.weighted ? Number(assistance) : 0) >
            baseline -
              (e.weighted ? (last?.assistance ?? e.assistance ?? 0) : 0)
        )
          throw new Error("Progressão bloqueada por dor acima de 3/10.");
        await update((s) => {
          const prev = s.sets.find(
            (x) => x.exerciseId === e.id && x.index === index,
          );
          const base = prev
            ? { ...s, sets: s.sets.filter((x) => x.id !== prev.id) }
            : s;
          const next = addSet(
            base,
            e,
            {
              index,
              load: Number(load),
              amount: Number(amount),
              rpe: Number(rpe),
              ready,
              successful,
              assistance: e.weighted ? Number(assistance) : 0,
            },
            Date.now(),
          );
          return prev
            ? {
                ...next,
                restUntil: s.restUntil,
                sets: next.sets.map((x) =>
                  x.id === prev.id
                    ? { ...x, completedAt: prev.completedAt }
                    : x,
                ),
              }
            : next;
        });
        if (!existing) {
          setIndex(Math.min(index + 1, e.sets - 1));
          if (e.attempts || e.setTargets) {
            const next = planned(Math.min(index + 1, e.sets - 1));
            setLoad(next.load === null ? "" : String(next.load));
            setAssistance(String(next.assistance));
          }
          setAmount("");
          setRpe("");
        }
      },
      existing ? "Série corrigida." : "Série registrada no aparelho.",
    );
  }
  return (
    <section
      className="card active-exercise"
      aria-label={`Exercício: ${e.name}`}
    >
      <div className="section-title">
        <h2>{e.name}</h2>
        <Tag>{e.priority === 0 ? "Principal" : "Acessório"}</Tag>
      </div>
      <div className="prescription-grid">
        <div>
          <span>
            Séries ×{" "}
            {e.unit === "reps"
              ? "reps"
              : e.unit === "seconds"
                ? "segundos"
                : "metros"}
          </span>
          <strong>{waveSummary(e)}</strong>
        </div>
        <div>
          <span>{e.weighted ? "Lastro prescrito" : "Carga prescrita"}</span>
          <strong>{loadDescription(e)}</strong>
        </div>
        <div>
          <span>RPE máximo</span>
          <strong>{e.rpe}</strong>
        </div>
        <div>
          <span>Descanso</span>
          <strong>{time(e.rest)}</strong>
        </div>
      </div>
      <LoadBasis exercise={e} />
      {e.attempts && (
        <p className="subtle">
          Referências:{" "}
          {e.attempts
            .map(
              (a, i) =>
                `tentativa ${i + 1}: ${a.percent}% → ${e.weighted ? "+" : ""}${a.load} kg`,
            )
            .join(" · ")}
          . Avance somente com prontidão e dentro do RPE.
        </p>
      )}
      {e.note && <p className="subtle">{e.note}</p>}
      {variants.length > 1 && (
        <Field label="Substituição equivalente">
          <select
            value={e.id}
            disabled={done.length > 0}
            onChange={(event) => {
              const variant = event.target.value;
              void run(
                () => update((s) => substitute(s, e.id, variant)),
                "Variação alterada. Defina a carga desta variação.",
              );
            }}
          >
            {variants.map(([id, name]) => (
              <option value={id} key={id}>
                {name}
              </option>
            ))}
          </select>
          <small>
            {done.length
              ? "Troca disponível na próxima sessão para preservar suas séries."
              : "Escolha antes da primeira série. Cada variação tem seu próprio histórico."}
          </small>
        </Field>
      )}
      {e.id === "dip-volume" && e.sets > 2 && done.length === 0 && (
        <button
          className="button secondary"
          onClick={() =>
            void run(
              () => update(reducePushVolume),
              "Dip reduzido para 2 séries.",
            )
          }
        >
          Recuperação baixa: reduzir dip para 2 séries
        </button>
      )}
      {progression && (
        <div className="advice">
          <div>
            <strong>Última execução finalizada desta variação</strong>
            <p>{progression.summary}</p>
            <p>{progression.reason}</p>
            {progression.load !== null && (
              <>
                <p>
                  Sugestão: {progression.load} kg × {progression.amount}{" "}
                  {e.unit === "meters"
                    ? "m"
                    : e.unit === "seconds"
                      ? "s"
                      : "reps"}
                  . Incremento configurado: {state.profile.increment} kg.
                </p>
                <button
                  className="text-button"
                  disabled={done.length > 0}
                  onClick={() =>
                    void run(async () => {
                      await update((s) => ({
                        ...s,
                        decisions: [
                          ...s.decisions,
                          {
                            at: Date.now(),
                            reason: `${e.name}: ${progression.reason}`,
                            decision: `Sugestão aceita: ${progression.load} kg × ${progression.amount}.`,
                          },
                        ],
                      }));
                      setLoad(String(progression.load));
                      setAmount(String(progression.amount));
                    }, "Sugestão aplicada aos campos. Confirme o esforço na execução.")
                  }
                >
                  Aplicar sugestão aos campos
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="series-pills">
        {Array.from({ length: e.sets }, (_, i) => (
          <button
            key={i}
            aria-label={`Selecionar série ${i + 1}`}
            className={`${done.some((s) => s.index === i) ? "done" : ""} ${index === i ? "current" : ""}`}
            onClick={() => selectSeries(i)}
          >
            {done.some((s) => s.index === i) ? <Check size={17} /> : i + 1}
          </button>
        ))}
      </div>
      <form onSubmit={(event) => void save(event)}>
        <h3>
          {session.plan.pr ? "Tentativa" : "Série"} {index + 1}
          {existing ? " · editar registro" : ""}
        </h3>
        {e.setTargets?.[index] && (
          <p className="subtle">
            Prescrição desta série: {e.setTargets[index].reps} reps · alvo{" "}
            {e.setTargets[index].percent}% · RPE ≤ {e.setTargets[index].rpe} ·{" "}
            {e.setTargets[index].load === null
              ? "carga a definir"
              : e.setTargets[index].assistance > 0
                ? `assistência ${e.setTargets[index].assistance} kg`
                : `${e.weighted ? "+" : ""}${e.setTargets[index].load} kg`}
            . Os campos de reps e RPE real são preenchidos após executar.
          </p>
        )}
        <div className="set-inputs">
          <Stepper
            label={e.weighted ? "Lastro kg" : "Carga kg"}
            value={load}
            setValue={setLoad}
            step={state.profile.increment}
          />
          <Stepper
            label={
              e.unit === "seconds"
                ? "Segundos"
                : e.unit === "meters"
                  ? "Metros"
                  : "Repetições"
            }
            value={amount}
            setValue={setAmount}
            min={1}
          />
          <Stepper
            label="RPE real"
            value={rpe}
            setValue={setRpe}
            min={1}
            max={10}
            step={0.5}
          />
        </div>
        {e.weighted && (
          <Stepper
            label="Assistência kg (0 = sem assistência)"
            value={assistance}
            setValue={setAssistance}
            step={state.profile.increment}
            max={session.bodyweight}
          />
        )}
        {e.weighted && (
          <p className="subtle">
            Peso corporal na sessão: {session.bodyweight} kg · total{" "}
            {load === ""
              ? "—"
              : totalLoad(Number(load), session.bodyweight, true) -
                Number(assistance)}{" "}
            kg.
          </p>
        )}
        {e.rm !== undefined && load !== "" && Number.isFinite(Number(load)) && (
          <p className="subtle">
            Carga digitada:{" "}
            {(
              ((Number(load) +
                (e.weighted ? session.bodyweight : 0) -
                (e.weighted ? Number(assistance) : 0)) /
                (e.rm + (e.weighted ? session.bodyweight : 0))) *
              100
            ).toFixed(1)}
            % do RM de referência. O RPE real deve ser registrado após executar.
          </p>
        )}
        {!session.plan.pr && (
          <label className="subtle">
            <input
              type="checkbox"
              checked={successful}
              onChange={(event) => setSuccessful(event.target.checked)}
            />{" "}
            Série concluída com sucesso
          </label>
        )}
        {session.plan.pr && (
          <div className="pr-options">
            <label>
              <input
                type="checkbox"
                checked={successful}
                onChange={(event) => setSuccessful(event.target.checked)}
              />
              Tentativa bem-sucedida
            </label>
            <label>
              <input
                type="checkbox"
                checked={ready}
                onChange={(event) => setReady(event.target.checked)}
              />
              Técnica, velocidade e prontidão permitem esta tentativa
              {index === 2 ? " (obrigatório)" : ""}
            </label>
          </div>
        )}
        <button className="button primary full" type="submit">
          <Check size={19} />
          {existing
            ? "Salvar correção"
            : `Concluir ${session.plan.pr ? "tentativa" : "série"} ${index + 1}`}
        </button>
      </form>
      {advice && (
        <div className="advice">
          <CircleHelp size={18} />
          <div>
            <p>
              {advice.reason}
              {advice.load !== null ? ` Sugestão: ${advice.load} kg.` : ""}
            </p>
            <button
              className="text-button"
              onClick={() =>
                void run(
                  () =>
                    update((s) => ({
                      ...s,
                      decisions: [
                        ...s.decisions,
                        {
                          at: Date.now(),
                          reason: advice.reason,
                          decision:
                            advice.load === null
                              ? "Progressão bloqueada reconhecida"
                              : "Sugestão aplicada ao campo de carga",
                        },
                      ],
                    })).then(() => {
                      if (advice.load !== null) setLoad(String(advice.load));
                    }),
                  "Decisão registrada.",
                )
              }
            >
              {advice.load === null
                ? "Registrar ciência"
                : "Aplicar sugestão e registrar decisão"}{" "}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
function Oapu({
  session,
  state,
  update,
  run,
}: {
  session: Session;
  state: AppState;
  update: (change: (s: Session) => Session) => Promise<void>;
  run: Run;
}) {
  const p = oapuProtocol(session.plan.week, session.plan.day);
  const previous = state.sessions
    .filter(
      (s) =>
        s.id !== session.id &&
        s.finishedAt !== null &&
        s.plan.day === session.plan.day &&
        s.plan.program === PROGRAM_ID,
    )
    .sort((a, b) => b.finishedAt! - a.finishedAt!)[0];
  const [side, setSide] = useState<"D" | "E">("D");
  const [assist, setAssist] = useState("");
  const [reps, setReps] = useState("");
  const [hold, setHold] = useState("");
  const [rpe, setRpe] = useState("");
  const [symptoms, setSymptoms] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      if (!assist.trim() || reps === "" || hold === "" || rpe === "")
        throw new Error(
          "Preencha assistência, repetições, duração e RPE. Use 0 para duração ou reps não utilizados.",
        );
      if (Number(rpe) > p.rpe)
        throw new Error(
          `Teto do protocolo: RPE ${p.rpe}. Não avance até a falha.`,
        );
      const log: OapuLog = {
        id: crypto.randomUUID(),
        side,
        assistance: assist,
        reps: Number(reps),
        hold: Number(hold),
        rpe: Number(rpe),
        symptoms,
        at: Date.now(),
      };
      await update((s) => ({ ...s, oapu: [...s.oapu, log] }));
    }, "Registro de OAPU salvo.");
  }
  return (
    <section className="card oapu-card">
      <div className="section-title">
        <div>
          <span className="eyebrow">PRIORIDADE DO TREINO · SEM CRONÔMETRO</span>
          <h2>One Arm Pull-up</h2>
          <p>
            {p.title} · RPE máximo {p.rpe} · sem falha
          </p>
        </div>
      </div>
      <div className="oapu-timeline">
        {["Aquecimento", "Skill", "Assistência / isometrias", "Cooldown"].map(
          (label, i) => (
            <div key={label}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
              <small>
                {i === 0
                  ? `${p.warmup} min`
                  : i === 3
                    ? `${p.cooldown} min`
                    : "Sem limite de tempo"}
              </small>
            </div>
          ),
        )}
      </div>
      <div className="oapu-protocol">
        <p>
          <strong>{p.skill}</strong>
        </p>
        <p>{p.support}</p>
        <p>
          Registros nesta sessão: direito{" "}
          {session.oapu.filter((log) => log.side === "D").length}/{p.sets};
          esquerdo {session.oapu.filter((log) => log.side === "E").length}/
          {p.sets}. Cada registro corresponde a uma série de um braço.
        </p>
        {previous && (
          <details>
            <summary>Última sessão deste protocolo</summary>
            {previous.oapu.map((log) => (
              <p key={log.id}>
                {log.side === "D" ? "Direito" : "Esquerdo"}: {log.reps} reps ·
                assistência: {log.assistance} · RPE {log.rpe}. {log.symptoms}
              </p>
            ))}
          </details>
        )}
        <p className="subtle">
          Faça o unilateral antes das puxadas bilaterais. Alterne os braços; não
          há tempo mínimo nem limite de duração. Registre cada série e o
          tipo/quantidade de assistência para comparar condições iguais.
        </p>
      </div>
      <form onSubmit={(event) => void save(event)}>
        <div className="form-grid">
          <Field label="Lado">
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as "D" | "E")}
            >
              <option value="D">Direito</option>
              <option value="E">Esquerdo</option>
            </select>
          </Field>
          <Field label="Tipo de assistência">
            <input
              required
              value={assist}
              onChange={(e) => setAssist(e.target.value)}
              placeholder="Ex.: elástico, apoio dos pés"
              maxLength={120}
            />
          </Field>
          <Field label="Repetições">
            <input
              required
              type="number"
              min="0"
              max="100"
              step="1"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </Field>
          <Field label="Isometria (segundos)">
            <input
              required
              type="number"
              min="0"
              max="120"
              step="1"
              value={hold}
              onChange={(e) => setHold(e.target.value)}
            />
          </Field>
          <Field label="RPE do registro">
            <input
              required
              type="number"
              min="1"
              max={p.rpe}
              step="0.5"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
            />
          </Field>
          <Field label="Sintomas / observações">
            <input
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              maxLength={400}
            />
          </Field>
        </div>
        <button className="button primary" type="submit">
          Registrar lado {side} <Check size={17} />
        </button>
        <p className="subtle">
          {session.oapu.length} registros nesta sessão. Não preencha esforço ou
          duração não observados.
        </p>
      </form>
    </section>
  );
}
function Recovery({ state, run }: { state: AppState; run: Run }) {
  const old = state.readiness.find((r) => r.date === dateKey());
  const [sleep, setSleep] = useState(old ? String(old.sleep) : "");
  const [stress, setStress] = useState(old ? String(old.stress) : "");
  const [fatigue, setFatigue] = useState(old ? String(old.fatigue) : "");
  const [pain, setPain] = useState(old ? String(old.pain) : "");
  const [location, setLocation] = useState(old?.location ?? "");
  const [notes, setNotes] = useState(old?.notes ?? "");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run(
      () =>
        commit((s) => ({
          ...s,
          readiness: [
            ...s.readiness.filter((r) => r.date !== dateKey()),
            {
              id: old?.id ?? crypto.randomUUID(),
              date: dateKey(),
              sleep: Number(sleep),
              stress: Number(stress),
              fatigue: Number(fatigue),
              pain: Number(pain),
              location,
              notes,
            },
          ],
        })),
      "Check-in salvo no aparelho.",
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="RECUPERAR É PARTE DO PLANO"
        title="Como você chega hoje?"
        text="Sinais percebidos ajudam a ajustar o treino. Não representam uma medição de fadiga do sistema nervoso."
      />
      <div className="recovery-layout">
        <form className="card" onSubmit={(e) => void save(e)}>
          <div className="section-title">
            <h3>Check-in de hoje</h3>
            <Tag>{dateKey()}</Tag>
          </div>
          <div className="form-grid">
            {[
              {
                label: "Sono (horas)",
                value: sleep,
                set: setSleep,
                max: 24,
                step: 0.5,
              },
              {
                label: "Estresse (0–10)",
                value: stress,
                set: setStress,
                max: 10,
                step: 1,
              },
              {
                label: "Fadiga (0–10)",
                value: fatigue,
                set: setFatigue,
                max: 10,
                step: 1,
              },
              {
                label: "Dor (0–10)",
                value: pain,
                set: setPain,
                max: 10,
                step: 1,
              },
            ].map((f) => (
              <Field label={f.label} key={f.label}>
                <input
                  required
                  type="number"
                  min="0"
                  max={f.max}
                  step={f.step}
                  value={f.value}
                  onChange={(e) => f.set(e.target.value)}
                />
              </Field>
            ))}
            <Field label="Localização da dor">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label="Observações">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={1000}
              />
            </Field>
          </div>
          <button type="submit" className="button primary">
            Salvar check-in <Check size={17} />
          </button>
        </form>
        <section className="card principle">
          <Leaf size={34} className="lime" />
          <h3>Ouça os sinais.</h3>
          <p>
            Sono abaixo de 6 horas: considere reduzir volume ou intensidade.
          </p>
          <p>
            Dor articular ou tendínea acima de 3/10: bloqueie a progressão do
            movimento provocador. Dor persistente pede avaliação profissional.
          </p>
          <p>
            Registre as suas decisões durante a sessão. Não compense treinos
            perdidos com sessões dobradas.
          </p>
          {sleep !== "" && Number(sleep) < 6 && (
            <div className="notice">
              Sono abaixo de 6 h: revise o plano antes de aumentar a carga.
            </div>
          )}
          {pain !== "" && Number(pain) > 3 && (
            <div className="notice">
              Progressão bloqueada para o exercício que provocar dor.
            </div>
          )}
        </section>
      </div>
      <section className="card">
        <h3>Últimos check-ins</h3>
        {state.readiness.length === 0 ? (
          <Empty
            title="Um registro por dia"
            text="Seu histórico de sono, esforço e dor começa aqui."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Sono</th>
                  <th>Estresse</th>
                  <th>Fadiga</th>
                  <th>Dor</th>
                  <th>Local</th>
                </tr>
              </thead>
              <tbody>
                {[...state.readiness]
                  .reverse()
                  .slice(0, 21)
                  .map((r) => (
                    <tr key={r.id}>
                      <td>{localDate(r.date).toLocaleDateString("pt-BR")}</td>
                      <td>{r.sleep} h</td>
                      <td>{r.stress}/10</td>
                      <td>{r.fatigue}/10</td>
                      <td>{r.pain}/10</td>
                      <td>{r.location || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
function Profile({
  state,
  run,
  go,
}: {
  state: AppState;
  run: Run;
  go: (p: Page) => void;
}) {
  const [profile, setProfile] = useState(state.profile);
  const [replace, setReplace] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run(
      () =>
        commit((s) => {
          if (
            profile.cycleStart !== s.profile.cycleStart &&
            s.sessions.some((x) => x.finishedAt === null)
          )
            throw new Error(
              "Finalize a sessão antes de mudar o início do ciclo.",
            );
          return { ...s, profile };
        }),
      "Perfil atualizado.",
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="AJUSTADO PARA VOCÊ"
        title="Seu espaço de treino"
        text="Máximos históricos, estimativas e training max ficam separados. Os dados executados preservam o peso corporal da sessão."
      />
      <div className="profile-links">
        <button className="button secondary" onClick={() => go("recuperacao")}>
          <Heart size={17} /> Recuperação
        </button>
        <button className="button secondary" onClick={() => go("historico")}>
          <History size={17} /> Histórico
        </button>
      </div>
      <form className="card" onSubmit={(e) => void save(e)}>
        <h3>Perfil do atleta</h3>
        <div className="form-grid">
          <Field label="Nome">
            <input
              required
              maxLength={80}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </Field>
          <Field label="Peso corporal (kg)">
            <input
              required
              type="number"
              min="20"
              max="400"
              step="0.1"
              value={profile.bodyweight}
              onChange={(e) =>
                setProfile({ ...profile, bodyweight: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Incremento de carga (kg)">
            <input
              required
              type="number"
              min="0.1"
              max="25"
              step="0.1"
              value={profile.increment}
              onChange={(e) =>
                setProfile({ ...profile, increment: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Data de referência do ciclo">
            <input
              required
              type="date"
              value={profile.cycleStart}
              onChange={(e) =>
                setProfile({ ...profile, cycleStart: e.target.value })
              }
            />
          </Field>
        </div>
        <p className="subtle">
          Sem horários ou duração obrigatória. Treinos A–F disponíveis
          livremente. OAPU assistido. Sono e estresse são registrados no
          check-in, não presumidos diariamente.
        </p>
        <h3>Máximos — sem confundir passado e presente</h3>
        <div className="form-grid">
          {LIFTS.map((l) => (
            <div className="max-pair" key={l.id}>
              <Field
                label={`${l.name} · histórico ${l.weighted ? "de lastro " : ""}(kg)`}
              >
                <input
                  required
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={profile.historical[l.id]}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      historical: {
                        ...profile.historical,
                        [l.id]: Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
              <Field label="Training max legado (não usado nos % de RM)">
                <input
                  type="number"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={profile.trainingMax[l.id] ?? ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      trainingMax: {
                        ...profile.trainingMax,
                        [l.id]:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        <Field label="Supino · 1RM histórico (kg)">
          <input
            required
            type="number"
            min="0"
            max="1000"
            value={profile.historical.bench}
            onChange={(e) =>
              setProfile({
                ...profile,
                historical: {
                  ...profile.historical,
                  bench: Number(e.target.value),
                },
              })
            }
          />
        </Field>
        <p className="subtle">
          Training max não preenchido permanece ausente. As cargas agora usam os
          RMs de planejamento abaixo. Sem RM atual, os principais usam o
          histórico como base provisória identificada; acessórios sem RM
          continuam por RPE.
        </p>
        <h3>RMs atuais para calcular as cargas</h3>
        <p className="subtle">
          Informe o RM de cada movimento. Barra fixa e dip: informe somente o
          lastro máximo adicional; o cálculo soma seu peso corporal. Em branco,
          os cinco principais usam o histórico provisório, identificado no
          treino. O percentual é a referência e o RPE limita o esforço; reduza a
          carga se necessário.
        </p>
        <div className="form-grid">
          {[
            ...LIFTS,
            { id: "bench", name: "Supino reto", weighted: false },
          ].map((lift) => (
            <Field
              key={lift.id}
              label={`${lift.name} · RM atual ${lift.weighted ? "de lastro " : ""}(kg)`}
            >
              <input
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                value={profile.referenceRm?.[lift.id] ?? ""}
                placeholder={`Histórico provisório: ${profile.historical[lift.id as keyof typeof profile.historical]} kg`}
                onChange={(event) => {
                  const refs = { ...profile.referenceRm };
                  if (event.target.value === "") delete refs[lift.id];
                  else refs[lift.id] = Number(event.target.value);
                  setProfile({ ...profile, referenceRm: refs });
                }}
              />
            </Field>
          ))}
        </div>
        <details>
          <summary>RMs de acessórios e variações — opcional</summary>
          <p className="subtle">
            Não é necessário testar máximas de acessórios. Use uma estimativa
            conhecida ou mantenha esses exercícios por RPE. Variações e máquinas
            diferentes têm RMs separados. Sem valor, back squat pausado e
            treinos de volume usam o RM do movimento principal.
          </p>
          <div className="form-grid">
            {[
              ...new Map(
                [1, 5]
                  .flatMap((w) =>
                    TRAINING_DAYS.flatMap((d) => makePlan(w, d).exercises),
                  )
                  .filter(
                    (e) =>
                      !["squat", "deadlift", "dip", "pullup", "bench"].includes(
                        e.id,
                      ),
                  )
                  .map((e) => [e.id, e]),
              ).values(),
            ].map((e) => (
              <Field key={e.id} label={`${e.name} · RM (kg)`}>
                <input
                  type="number"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  value={profile.referenceRm?.[e.id] ?? ""}
                  onChange={(event) => {
                    const refs = { ...profile.referenceRm };
                    if (event.target.value === "") delete refs[e.id];
                    else refs[e.id] = Number(event.target.value);
                    setProfile({ ...profile, referenceRm: refs });
                  }}
                />
              </Field>
            ))}
          </div>
        </details>
        <button className="button primary" type="submit">
          Salvar perfil <Check size={17} />
        </button>
      </form>
      <section className="card">
        <div className="section-title">
          <h3>Aparência</h3>
          <button
            className="button secondary"
            onClick={() =>
              void run(() =>
                commit((s) => ({
                  ...s,
                  theme: s.theme === "dark" ? "light" : "dark",
                })),
              )
            }
          >
            Usar tema {state.theme === "dark" ? "claro" : "escuro"}
          </button>
        </div>
      </section>
      <section className="card">
        <h3>Cópia dos seus dados</h3>
        <p>
          Este aparelho é a fonte local. Um arquivo exportado permite recuperar
          seus registros em outro navegador. Não apague os dados do navegador
          sem ter uma cópia.
        </p>
        <div className="button-row">
          <button
            className="button secondary"
            onClick={() => exportState(state)}
          >
            <ArrowDownToLine size={17} />
            Exportar JSON {navigator.onLine ? "" : "(cópia local offline)"}
          </button>
        </div>
        <label className="check-line">
          <input
            type="checkbox"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
          />
          Eu exportei uma cópia e quero substituir os dados locais por um
          backup.
        </label>
        <Field label="Importar backup JSON">
          <input
            type="file"
            accept="application/json,.json"
            disabled={!replace}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                void run(async () => {
                  if (file.size > 900000)
                    throw new Error("Arquivo maior que 900 KB.");
                  const imported = decode(await file.text());
                  await commit(() => imported);
                  setReplace(false);
                }, "Backup restaurado. Reabra o perfil para revisar os valores.");
            }}
          />
        </Field>
      </section>
      <Suspense
        fallback={
          <section className="card">Carregando opções da conta…</section>
        }
      >
        <CloudPanel state={state} run={run} />
      </Suspense>
      <section className="card">
        <h3>Sobre o programa</h3>
        <p>
          e1RM: modelo Epley v1 para 1–10 repetições. Nos movimentos com lastro,
          a estimativa usa peso corporal da sessão + lastro. Uma estimativa não
          é um máximo testado.
        </p>
        <p>
          Prescrição, dados executados e sugestões ficam separados. Não existe
          treinamento até a falha no OAPU. Os treinos ficam disponíveis sem
          cronômetro obrigatório ou limite de duração.
        </p>
      </section>
    </>
  );
}
