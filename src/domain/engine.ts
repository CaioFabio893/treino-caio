import type {
  AppState,
  Exercise,
  Lift,
  Plan,
  Profile,
  Session,
  SetLog,
} from "./model";
import { MODEL_VERSION } from "./model";
import { makeProgramPlan, PROGRAM_WEEKS } from "./program";

export const LIFTS: { id: Lift; name: string; weighted: boolean }[] = [
  { id: "squat", name: "Back Squat", weighted: false },
  { id: "deadlift", name: "Deadlift", weighted: false },
  { id: "dip", name: "Weighted Dip", weighted: true },
  { id: "pullup", name: "Weighted Pull-up", weighted: true },
];
export const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function localDate(value: string) {
  return new Date(`${value}T12:00:00`);
}
export function monday(date = new Date()) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return dateKey(copy);
}
export function currentWeek(start: string, today = dateKey()) {
  const day = (s: string) => {
    const d = localDate(s);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  return Math.max(
    1,
    Math.min(12, Math.floor((day(today) - day(start)) / 604800000) + 1),
  );
}
export function initialState(): AppState {
  return {
    schema: 1,
    theme: "dark",
    profile: {
      name: "Caio",
      bodyweight: 100,
      increment: 2.5,
      cycleStart: monday(),
      historical: {
        squat: 200,
        deadlift: 220,
        bench: 170,
        dip: 110,
        pullup: 40,
      },
      trainingMax: { squat: null, deadlift: null, dip: null, pullup: null },
    },
    sessions: [],
    readiness: [],
  };
}
export const WEEKS = PROGRAM_WEEKS;
export function roundLoad(value: number, increment: number) {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    !Number.isFinite(increment) ||
    increment <= 0
  )
    throw new Error("Carga/incremento inválido");
  return Math.round((value + Number.EPSILON) / increment) * increment;
}
export function percentage(tm: number, percent: number) {
  if (
    !Number.isFinite(tm) ||
    tm <= 0 ||
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > 100
  )
    throw new Error("Training max/percentual inválido");
  return (tm * percent) / 100;
}
export function e1rm(load: number, reps: number) {
  if (
    !Number.isFinite(load) ||
    load < 0 ||
    !Number.isInteger(reps) ||
    reps < 1 ||
    reps > 10
  )
    return null;
  return reps === 1 ? load : load * (1 + reps / 30);
}
export function totalLoad(load: number, bodyweight: number, weighted: boolean) {
  return load + (weighted ? bodyweight : 0);
}
export function suggestion(
  load: number,
  actual: number,
  target: number,
  increment: number,
  pain = 0,
) {
  if (pain > 3)
    return {
      load: null,
      reason:
        "Dor acima de 3/10: progressão bloqueada. Evite o movimento provocador; dor persistente pede avaliação profissional.",
    };
  if (actual >= target + 2)
    return {
      load: Math.floor((load * 0.925) / increment) * increment,
      reason: "RPE ≥2 pontos acima: reduzir 5–10% e avaliar corte de séries.",
    };
  if (actual >= target + 1)
    return {
      load: Math.floor((load * 0.9625) / increment) * increment,
      reason:
        "RPE ≥1 ponto acima: reduzir 2,5–5% antes do arredondamento conservador.",
    };
  if (actual < target - 0.5 && actual < 9)
    return {
      load: roundLoad(load * 1.025, increment),
      reason:
        "Abaixo do alvo: aumento conservador opcional de 2,5%, respeitando o teto de esforço.",
    };
  return { load, reason: "Manter a carga e observar técnica e recuperação." };
}
export function estimate(exercises: Exercise[], pull: boolean) {
  return (
    (pull ? 1800 : 480) +
    exercises.reduce(
      (n, e) =>
        n +
        e.ramp +
        e.sets *
          (e.unit === "seconds"
            ? e.reps
            : e.unit === "meters"
              ? 40
              : e.reps * 4 * (e.perSide ? 2 : 1)) +
        Math.max(0, e.sets - 1) * e.rest +
        60,
      0,
    )
  );
}
export function budget(exercises: Exercise[], pull: boolean, limit = 4800) {
  const kept = [...exercises];
  const removed: string[] = [];
  while (estimate(kept, pull) > limit) {
    const candidates = kept
      .filter((e) => e.priority > 0)
      .sort((a, b) => b.priority - a.priority);
    if (!candidates.length) break;
    const candidate = candidates[0];
    kept.splice(kept.indexOf(candidate), 1);
    removed.push(candidate.name);
  }
  return {
    exercises: kept,
    removed,
    estimatedSeconds: estimate(kept, pull),
    valid: estimate(kept, pull) <= limit,
  };
}
export function workoutName(index: number) {
  return `Treino ${"ABCDEF"[index - 1] ?? "?"}`;
}
export const makePlan = makeProgramPlan;
export const OAPU = {
  1: {
    title: "Força técnica",
    warmup: 7,
    cooldown: 5,
    rpe: 7,
    skill: "OAPU assistido · 4×2 por braço",
    support: "Isometria assistida · 2×5 s por braço",
  },
  3: {
    title: "Volume técnico",
    warmup: 7,
    cooldown: 5,
    rpe: 6,
    skill: "OAPU assistido · 3×4 por braço",
    support: "Controle escapular · 2×5 por braço",
  },
  5: {
    title: "Baixa fadiga",
    warmup: 8,
    cooldown: 6,
    rpe: 5,
    skill: "OAPU muito assistido · 3×2 por braço",
    support: "Isometria leve · 2×3 s por braço",
  },
};
export function sessionKey(profile: Profile, week: number, day: number) {
  return `${profile.cycleStart}:w${week}:d${day}`;
}
export function startSession(
  state: AppState,
  plan: Plan,
  now = Date.now(),
): Session {
  const date = new Date(now);
  // Retoma a sessão ativa deste mesmo treino (idempotente, sem duplicar).
  const active = state.sessions.find(
    (s) =>
      s.id.startsWith(`${state.profile.cycleStart}:`) &&
      s.finishedAt === null &&
      s.plan.week === plan.week &&
      s.plan.day === plan.day &&
      s.plan.program === plan.program,
  );
  if (active) return active;

  // Treinos podem ser refeitos: cada início cria uma execução única do mesmo dia.
  const run =
    state.sessions.filter(
      (s) => s.plan.week === plan.week && s.plan.day === plan.day,
    ).length + 1;
  const key = `${sessionKey(state.profile, plan.week, plan.day)}${plan.program ? `:${plan.program}` : ""}:r${run}`;
  return {
    id: key,
    date: dateKey(date),
    startedAt: now,
    finishedAt: null,
    plan: structuredClone(plan),
    sets: [],
    oapu: [],
    bodyweight: state.profile.bodyweight,
    restUntil: null,
    decisions: [],
    version: MODEL_VERSION,
  };
}
export function addSet(
  session: Session,
  exercise: Exercise,
  input: Omit<SetLog, "id" | "completedAt" | "exerciseId" | "bodyweight">,
  now = Date.now(),
): Session {
  if (session.finishedAt) throw new Error("Sessão já finalizada.");

  if (!session.plan.exercises.some((e) => e.id === exercise.id))
    throw new Error("Exercício fora da sessão.");
  if (
    !Number.isInteger(input.index) ||
    input.index < 0 ||
    input.index >= exercise.sets
  )
    throw new Error("Série inválida.");
  if (
    !Number.isFinite(input.load) ||
    input.load < 0 ||
    input.load > 1000 ||
    !Number.isInteger(input.amount) ||
    input.amount < 1 ||
    input.amount > 1000 ||
    !Number.isFinite(input.rpe) ||
    input.rpe < 1 ||
    input.rpe > 10 ||
    (input.assistance !== undefined &&
      (!Number.isFinite(input.assistance) ||
        input.assistance < 0 ||
        input.assistance > session.bodyweight ||
        (input.assistance > 0 &&
          (!exercise.weighted || input.load > 0 || session.plan.pr))))
  )
    throw new Error("Preencha carga, quantidade e RPE válidos.");
  if (session.plan.pr && input.index === 2 && !input.ready)
    throw new Error("Terceira tentativa exige prontidão confirmada.");
  if (session.plan.pr && input.amount !== 1)
    throw new Error("Tentativa de PR exige uma repetição.");
  const id = `${exercise.id}:${input.index}`;
  if (session.sets.some((s) => s.id === id)) return session;
  return {
    ...session,
    sets: [
      ...session.sets,
      {
        ...input,
        id,
        exerciseId: exercise.id,
        bodyweight: session.bodyweight,
        completedAt: now,
      },
    ],
    restUntil: null,
  };
}
export function elapsed(session: Session, now = Date.now()) {
  return Math.max(
    0,
    Math.floor(((session.finishedAt ?? now) - session.startedAt) / 1000),
  );
}
export function time(value: number) {
  const s = Math.max(0, Math.floor(value));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
export function liftMetrics(sessions: Session[], lift: Lift | "bench") {
  return sessions.flatMap((s) =>
    s.sets
      .filter(
        (set) =>
          set.exerciseId === lift &&
          set.successful &&
          !(set.assistance && set.assistance > 0),
      )
      .map((set) => ({
        date: s.date,
        load: set.load,
        total: totalLoad(
          set.load,
          set.bodyweight,
          lift === "dip" || lift === "pullup",
        ),
        estimate: e1rm(
          totalLoad(
            set.load,
            set.bodyweight,
            lift === "dip" || lift === "pullup",
          ),
          set.amount,
        ),
        tested: s.plan.pr && set.amount === 1,
      })),
  );
}
