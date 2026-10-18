import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
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
import type { LucideIcon } from "lucide-react";
import type {
  AppState,
  Exercise,
  OapuLog,
  Page,
  Session,
} from "./domain/model";
import {
  addSet,
  currentWeek,
  dateKey,
  DAYS,
  elapsed,
  LIFTS,
  liftMetrics,
  localDate,
  makePlan,
  OAPU,
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
function useNow() {
  const [now, set] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => set(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
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
  const now = useNow();
  const [page, setPage] = useState<Page>("inicio");
  const [week, setWeek] = useState(() => currentWeek(state.profile.cycleStart));
  const [day, setDay] = useState(() =>
    new Date().getDay() >= 1 && new Date().getDay() <= 5
      ? new Date().getDay()
      : 1,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const active = state.sessions.find((s) => s.finishedAt === null);
  const cycleSessions = state.sessions.filter((s) =>
    s.id.startsWith(`${state.profile.cycleStart}:`),
  );
  const plan = makePlan(week, day);
  const w = WEEKS[week - 1];
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
    await run(async () => {
      await commit((s) => {
        const created = startSession(s, plan);
        if (created.finishedAt)
          throw new Error(
            "Este treino já foi finalizado. Consulte o histórico; não criaremos outra sessão.",
          );
        return s.sessions.some((x) => x.id === created.id)
          ? s
          : { ...s, sessions: [...s.sessions, created] };
      });
      go("treino");
    });
  }
  return (
    <div
      className={`app-shell ${page === "treino" && active ? "training-mode" : ""}`}
    >
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
                width: `${(currentWeek(state.profile.cycleStart) / 12) * 100}%`,
              }}
            />
          </div>
          <small>Semana {currentWeek(state.profile.cycleStart)} de 12</small>
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
                  Semana {currentWeek(state.profile.cycleStart)}{" "}
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="dashboard-grid">
                <section className="hero">
                  <div className="hero-top">
                    <Tag>
                      {active ? "SESSÃO EM ANDAMENTO" : "TREINO DE HOJE"}
                    </Tag>
                    <span className="eyebrow">{w.phase.toUpperCase()}</span>
                  </div>
                  <div className="hero-content">
                    <div className="hero-copy">
                      <span className="eyebrow">
                        {DAYS[day].toUpperCase()} · SEMANA {week}
                      </span>
                      <h2>
                        Força com
                        <br />
                        <span className="outline-text">intenção.</span>
                      </h2>
                      <p>
                        {plan.name} · {plan.focus}. Execute com controle e respeite
                        o seu RPE.
                      </p>
                      <div className="hero-facts">
                        <span>
                          <Clock3 size={16} /> Até 80 min
                        </span>
                        <span>
                          <Dumbbell size={16} /> {plan.exercises.length} exercícios
                        </span>
                        {plan.pull && (
                          <span>
                            <Target size={16} /> OAPU · 30 min
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
                  label="ADERÊNCIA SEMANAL"
                  value={String(
                    Math.round(
                      (cycleSessions.filter(
                        (s) =>
                          s.finishedAt &&
                          s.plan.week === currentWeek(state.profile.cycleStart),
                      ).length /
                        5) *
                        100,
                    ),
                  )}
                  unit="%"
                  sub="5 sessões planejadas nesta semana"
                  icon={Flame}
                />
                <Stat
                  label="FASE ATUAL"
                  value={WEEKS[currentWeek(state.profile.cycleStart) - 1].phase}
                  sub={`Semana ${currentWeek(state.profile.cycleStart)} de 12`}
                  icon={Target}
                />
              </div>
              <section className="card week-card">
                <div className="section-title">
                  <div>
                    <span className="eyebrow">
                      O PLANO É SIMPLES. A EXECUÇÃO É SUA.
                    </span>
                    <h3>Sua semana de treino</h3>
                  </div>
                  <button className="text-button" onClick={() => go("ciclo")}>
                    Ver ciclo completo <ArrowRight size={15} />
                  </button>
                </div>
                <div className="week-strip">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      className={`day-card ${new Date(now).getDay() === d ? "today" : ""}`}
                      onClick={() => {
                        setDay(d);
                        setWeek(currentWeek(state.profile.cycleStart));
                        go("treino");
                      }}
                    >
                      <span>{DAYS[d]}</span>
                      <div className="day-icon">
                        <Dumbbell size={20} />
                      </div>
                      <strong>
                        {[1, 3, 5].includes(d) ? "Pull" : "Push & Legs"}
                      </strong>
                      <small>
                        {[1, 3, 5].includes(d)
                          ? "OAPU + força"
                          : "Força + volume"}
                      </small>
                    </button>
                  ))}
                </div>
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
          {page === "treino" &&
            (active ? (
              <Workout
                session={active}
                state={state}
                now={now}
                run={run}
                onExit={() => go("inicio")}
              />
            ) : (
              <>
                <PageHeading
                  eyebrow="EXECUÇÃO COM INTENÇÃO"
                  title="Seu próximo treino"
                  text="Escolha o treino e comece quando quiser. Cada sessão fica salva no histórico."
                />
                <PlanSelect
                  week={week}
                  day={day}
                  setWeek={setWeek}
                  setDay={setDay}
                />
                <section className="card plan-overview">
                  <div>
                    <Tag>
                      {w.phase} · Semana {week}
                    </Tag>
                    <h2>{plan.name}</h2>
                    <p>{plan.focus}</p>
                    <div className="hero-facts">
                      <span>
                        <Clock3 size={16} />
                        {Math.ceil(plan.estimatedSeconds / 60)} min estimados
                      </span>
                      {plan.pull && (
                        <span>
                          <Target size={16} />
                          OAPU nos primeiros 30 min
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => void begin()}
                  >
                    Iniciar treino <ArrowRight size={17} />
                  </button>
                </section>
                {plan.removed.length > 0 && (
                  <p className="notice">
                    Ajuste de tempo: removidos {plan.removed.join(", ")}.
                  </p>
                )}
                <div className="exercise-preview">
                  {plan.exercises.map((e, i) => (
                    <section className="card prescription" key={e.id}>
                      <span className="exercise-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>{e.name}</h3>
                        <p>
                          {e.note ||
                            "Confirme a carga pelo esforço e pela técnica."}
                        </p>
                      </div>
                      <strong>
                        {e.sets}×{e.reps}
                        {e.repsMax ? `–${e.repsMax}` : ""}
                        <small>RPE ≤ {e.rpe}</small>
                      </strong>
                      <strong>
                        {e.load === null
                          ? "A definir"
                          : `${e.weighted ? "+" : ""}${e.load} kg`}
                        <small>{time(e.rest)} de descanso</small>
                      </strong>
                    </section>
                  ))}
                </div>
                <p className="subtle">
                  Aquecimento, rampas, descansos e transições incluídos na
                  estimativa. Cargas iniciais são referências; não são
                  percentuais dos máximos antigos.
                </p>
              </>
            ))}
          {page === "ciclo" && (
            <>
              <PageHeading
                eyebrow="VISÃO DE LONGO PRAZO"
                title="12 semanas. Um propósito."
                text="Construa volume, desenvolva força, chegue pronto. Os dias de volume mantêm seus próprios limites de esforço."
              />
              <div className="phase-legend">
                {["Acumulação", "Intensificação", "Peaking", "PR Test"].map(
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
                      setWeek(wk.week);
                      go("treino");
                    }}
                  >
                    <div>
                      <span className="eyebrow">
                        SEMANA {String(wk.week).padStart(2, "0")}
                      </span>
                      {wk.week === currentWeek(state.profile.cycleStart) && (
                        <Tag>Atual</Tag>
                      )}
                    </div>
                    <h3>{wk.label}</h3>
                    <p>{wk.phase}</p>
                    <div className="week-prescription">
                      <strong>
                        {wk.week === 12
                          ? "Até 3 tentativas"
                          : `${wk.sets} × ${wk.reps}`}
                      </strong>
                      <span>RPE ≤ {wk.rpe}</span>
                    </div>
                    <small>
                      {wk.week === 12
                        ? "Testes com prontidão · sem 105% automático"
                        : "5 dias · dois dias de recuperação"}
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
                      <span>
                        {s.sets.length} séries · {time(elapsed(s, now))}
                      </span>
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
                          {set.load} kg · {set.amount}{" "}
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
      <Field label="Dia de treino">
        <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>
              {DAYS[d]} · {makePlan(week, d).name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Workout({
  session,
  state,
  now,
  run,
  onExit,
}: {
  session: Session;
  state: AppState;
  now: number;
  run: Run;
  onExit: () => void;
}) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [finish, setFinish] = useState(false);
  const seconds = elapsed(session, now);
  const oapuActive = session.plan.pull && seconds < 1800;
  const ex = session.plan.exercises[exerciseIndex];
  const rest = Math.max(
    0,
    Math.ceil(((session.restUntil ?? now) - now) / 1000),
  );
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
      <section className="session-header card">
        <div className="session-name">
          <button
            className="icon-button"
            aria-label="Voltar ao início"
            onClick={onExit}
          >
            <ArrowRight size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <Dumbbell size={22} />
          <div>
            <h2>{session.plan.name}</h2>
            <small>
              Semana {session.plan.week} · {session.plan.focus}
            </small>
          </div>
          <Tag>{oapuActive ? "OAPU" : "FORÇA"}</Tag>
        </div>
        <div className="clocks">
          <div>
            <span>Decorrido</span>
            <strong>{time(seconds)}</strong>
          </div>
          <div>
            <span>Restante até 80 min</span>
            <strong>{time(4800 - seconds)}</strong>
          </div>
          <div>
            <span>Limite previsto</span>
            <strong>
              {new Date(session.startedAt + 4800000).toLocaleTimeString(
                "pt-BR",
                { hour: "2-digit", minute: "2-digit" },
              )}
            </strong>
          </div>
        </div>
        <div className="session-progress">
          <i style={{ width: `${Math.min(100, (seconds / 4800) * 100)}%` }} />
        </div>
      </section>
      {seconds >= 3600 && (
        <div className="notice" role="status">
          {seconds >= 4800
            ? "80 minutos atingidos. Finalize quando for seguro; a sessão continua aberta."
            : seconds >= 4500
              ? "75 minutos: priorize concluir com qualidade."
              : seconds >= 4200
                ? "70 minutos: evite iniciar acessórios de baixa prioridade."
                : "60 minutos: confira o tempo restante."}{" "}
          Acessórios removíveis:{" "}
          {session.plan.exercises
            .filter((e) => e.priority > 0)
            .map((e) => e.name)
            .join(", ") || "nenhum"}
          .
        </div>
      )}
      {oapuActive ? (
        <Oapu session={session} seconds={seconds} update={update} run={run} />
      ) : (
        <>
          {session.plan.pull && (
            <div className="notice">
              <Check size={17} /> Bloco de 30 minutos encerrado. Revise seus
              registros de OAPU no histórico.
            </div>
          )}
          <div className="exercise-tabs" aria-label="Exercícios">
            {session.plan.exercises.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setExerciseIndex(i)}
                className={i === exerciseIndex ? "selected" : ""}
              >
                <span>{i + 1}</span>
                {e.name}
                <small>
                  {session.sets.filter((s) => s.exerciseId === e.id).length}/
                  {e.sets}
                </small>
              </button>
            ))}
          </div>
          {ex ? (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              session={session}
              state={state}
              now={now}
              update={update}
              run={run}
            />
          ) : (
            <section className="card">
              <Empty
                title="Sessão técnica leve"
                text="Hoje não há teste de força. O bloco de OAPU é o foco da sessão."
              />
            </section>
          )}
          {rest > 0 && (
            <section className="rest-panel card" aria-label="Descanso">
              <div>
                <span className="eyebrow">DESCANSO</span>
                <small>Respire. Prepare a próxima série.</small>
              </div>
              <div className="rest-controls">
                <button
                  className="icon-button"
                  aria-label="Diminuir descanso em 15 segundos"
                  onClick={() =>
                    void run(() =>
                      update((s) => ({
                        ...s,
                        restUntil: Math.max(now, (s.restUntil ?? now) - 15000),
                      })),
                    )
                  }
                >
                  <Minus />
                </button>
                <strong>{time(rest)}</strong>
                <button
                  className="icon-button"
                  aria-label="Aumentar descanso em 15 segundos"
                  onClick={() =>
                    void run(() =>
                      update((s) => ({
                        ...s,
                        restUntil: (s.restUntil ?? now) + 15000,
                      })),
                    )
                  }
                >
                  <Plus />
                </button>
              </div>
              <button
                className="button secondary"
                onClick={() =>
                  void run(() => update((s) => ({ ...s, restUntil: null })))
                }
              >
                Pular descanso <ChevronRight size={16} />
              </button>
            </section>
          )}
        </>
      )}
      <div className="session-bottom">
        <span>
          {completed}/{total} séries de força registradas · o relógio segue em
          tempo real
        </span>
        <button className="button secondary" onClick={() => setFinish(true)}>
          Finalizar sessão <Check size={17} />
        </button>
      </div>
      {finish && (
        <ConfirmDialog onClose={() => setFinish(false)}>
          <h2 id="finish-title">Encerrar por hoje?</h2>
          <p>
            {completed} de {total} séries registradas. Séries não executadas
            ficam vazias. O histórico preserva os seus registros.
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
  now,
  update,
  run,
}: {
  exercise: Exercise;
  session: Session;
  state: AppState;
  now: number;
  update: (change: (s: Session) => Session) => Promise<void>;
  run: Run;
}) {
  const done = session.sets.filter((s) => s.exerciseId === e.id);
  const [index, setIndex] = useState(() => Math.min(done.length, e.sets - 1));
  const [load, setLoad] = useState(e.load === null ? "" : String(e.load));
  const [amount, setAmount] = useState("");
  const [rpe, setRpe] = useState("");
  const [ready, setReady] = useState(false);
  const [successful, setSuccessful] = useState(true);
  const existing = done.find((s) => s.index === index);
  const recovery = state.readiness.find((r) => r.date === dateKey());
  const last = done.at(-1);
  const advice = last
    ? suggestion(
        last.load,
        last.rpe,
        e.rpe,
        state.profile.increment,
        recovery?.pain,
      )
    : null;
  function selectSeries(i: number) {
    setIndex(i);
    const old = done.find((s) => s.index === i);
    setLoad(old ? String(old.load) : e.load === null ? "" : String(e.load));
    setAmount(old ? String(old.amount) : "");
    setRpe(old ? String(old.rpe) : "");
    setSuccessful(old?.successful ?? true);
    setReady(old?.ready ?? false);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run(
      async () => {
        if (load === "" || amount === "" || rpe === "")
          throw new Error("Preencha carga, quantidade e RPE real.");
        const baseline = last?.load ?? e.load;
        if (
          (recovery?.pain ?? 0) > 3 &&
          baseline !== null &&
          Number(load) > baseline
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
            },
            now,
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
          setAmount("");
          setRpe("");
        }
      },
      existing ? "Série corrigida." : "Série registrada no aparelho.",
    );
  }
  return (
    <section className="card active-exercise">
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
          <strong>
            {e.sets} × {e.reps}
            {e.repsMax ? `–${e.repsMax}` : ""}
          </strong>
        </div>
        <div>
          <span>{e.weighted ? "Lastro prescrito" : "Carga prescrita"}</span>
          <strong>
            {e.load === null
              ? "A definir"
              : `${e.weighted ? "+" : ""}${e.load} kg`}
          </strong>
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
      {e.note && <p className="subtle">{e.note}</p>}
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
          <p className="subtle">
            Peso corporal na sessão: {session.bodyweight} kg · total{" "}
            {load === ""
              ? "—"
              : totalLoad(Number(load), session.bodyweight, true)}{" "}
            kg.
          </p>
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
  seconds,
  update,
  run,
}: {
  session: Session;
  seconds: number;
  update: (change: (s: Session) => Session) => Promise<void>;
  run: Run;
}) {
  const p = OAPU[session.plan.day as 1 | 3 | 5];
  const [side, setSide] = useState<"D" | "E">("D");
  const [assist, setAssist] = useState("");
  const [reps, setReps] = useState("");
  const [hold, setHold] = useState("");
  const [rpe, setRpe] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const block =
    seconds < p.warmup * 60 ? 0 : seconds < (30 - p.cooldown) * 60 ? 1 : 3;
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
          <span className="eyebrow">BLOCO EXCLUSIVO · 30 MINUTOS</span>
          <h2>One Arm Pull-up</h2>
          <p>
            {p.title} · RPE máximo {p.rpe} · sem falha
          </p>
        </div>
        <div className="oapu-clock">
          <Target size={20} />
          <strong>{time(1800 - seconds)}</strong>
          <span>restantes</span>
        </div>
      </div>
      <div className="oapu-timeline">
        {["Aquecimento", "Skill", "Assistência / isometrias", "Cooldown"].map(
          (label, i) => (
            <div
              className={
                i === block || (i === 2 && block === 1) ? "current" : ""
              }
              key={label}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
              <small>
                {i === 0
                  ? `${p.warmup} min`
                  : i === 3
                    ? `${p.cooldown} min`
                    : "Dentro do orçamento técnico"}
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
        <p className="subtle">
          {30 - p.warmup - p.cooldown} minutos compartilhados entre skill,
          assistência, descansos e transições. Alterne os braços. O bloco não
          pode ser pulado para iniciar a força antes de 30 min.
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
          <Field label="Segunda-feira inicial do ciclo">
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
          Janela de referência: 18h30–20h. Limite efetivo de sessão: 80 min.
          OAPU assistido. Sono e estresse são registrados no check-in, não
          presumidos diariamente.
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
              <Field label="Training max validado (opcional)">
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
          Training max não preenchido permanece ausente. As cargas prescritas
          são referências do programa; não aplicamos percentuais automaticamente
          aos máximos antigos ou ao lastro.
        </p>
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
          treinamento até a falha no OAPU. O relógio geral segue mesmo fora da
          tela, sem pausa do limite total.
        </p>
      </section>
    </>
  );
}
