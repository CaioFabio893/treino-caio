import type {
  AppState,
  Exercise,
  Lift,
  Plan,
  Profile,
  Session,
  SetLog,
  Week,
} from "./model";
import { MODEL_VERSION } from "./model";

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
export const WEEKS: Week[] = [
  [4, 6, 7, "Base técnica"],
  [4, 5, 7.5, "Construir consistência"],
  [4, 4, 8, "Consolidar carga"],
  [3, 5, 6, "Deload"],
  [4, 4, 8, "Intensificar"],
  [4, 3, 8.5, "Força específica"],
  [5, 2, 9, "Duplas de qualidade"],
  [3, 3, 6, "Deload"],
  [3, 2, 9, "Preparar máximos"],
  [2, 1, 9, "Singles técnicos"],
  [2, 2, 7, "Taper"],
  [3, 1, 9, "PR Test"],
].map((row, i) => ({
  week: i + 1,
  phase:
    i < 4
      ? "Acumulação"
      : i < 8
        ? "Intensificação"
        : i === 11
          ? "PR Test"
          : "Peaking",
  sets: Number(row[0]),
  reps: Number(row[1]),
  rpe: Number(row[2]),
  label: String(row[3]),
}));

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
function ex(
  id: string,
  name: string,
  sets: number,
  reps: number,
  load: number | null,
  rpe: number,
  rest = 90,
  priority = 2,
  extra: Partial<Exercise> = {},
): Exercise {
  return {
    id,
    name,
    sets,
    reps,
    load,
    rpe,
    rest,
    priority,
    ramp: 0,
    unit: "reps",
    ...extra,
  };
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
export function makePlan(week: number, day: number): Plan {
  if (
    !Number.isInteger(week) ||
    week < 1 ||
    week > 12 ||
    day < 1 ||
    day > 5 ||
    !Number.isInteger(day)
  )
    throw new Error("Semana/dia inválido ou descanso");
  const w = WEEKS[week - 1];
  const pull = [1, 3, 5].includes(day);
  const main = (id: Lift, load: number) =>
    ex(
      id,
      LIFTS.find((l) => l.id === id)!.name,
      w.sets,
      w.reps,
      load,
      w.rpe,
      180,
      0,
      {
        lift: id,
        weighted: id === "dip" || id === "pullup",
        ramp: 300,
        note:
          week === 1
            ? "Carga inicial de referência. Confirme pelo RPE."
            : "Referência inicial, não progressão automática. Ajuste usando execução, RPE e recuperação.",
      },
    );
  let exercises: Exercise[] = [];
  if (day === 1)
    exercises = [
      main("pullup", 10),
      ex("row", "Remada apoiada", 3, 8, null, 8),
      ex("curl", "Rosca bíceps", 2, 10, null, 8, 60, 3, { repsMax: 12 }),
      ex("facepull", "Facepull", 2, 12, null, 8, 60, 4, { repsMax: 15 }),
    ];
  if (day === 2)
    exercises = [
      main("squat", 130),
      main("dip", 50),
      ex("extension", "Cadeira extensora", 2, 12, null, 8, 60, 3, {
        repsMax: 15,
      }),
      ex("lateral", "Elevação lateral", 2, 12, null, 8, 60, 4, { repsMax: 15 }),
      ex("farmer", "Farmer’s Walk", 3, 30, null, 7, 90, 2, { unit: "meters" }),
    ];
  if (day === 3)
    exercises = [
      ex("pullup-volume", "Pull-up técnico", 3, 6, 0, 7, 120, 0, {
        repsMax: 8,
        weighted: true,
        ramp: 240,
        note: "Peso corporal ou assistência. Registre a assistência nas observações da sessão; não como lastro negativo.",
      }),
      ex("row-single", "Remada serrote", 3, 10, null, 8, 90, 2, {
        perSide: true,
      }),
      ex("reverse", "Crucifixo invertido", 2, 12, null, 8, 60, 3, {
        repsMax: 15,
      }),
    ];
  if (day === 4)
    exercises = [
      ex("paused-squat", "Back Squat pausado", 3, 8, 110, 7, 150, 0, {
        ramp: 240,
      }),
      ex("bench", "Supino reto", 3, 6, 105, 7, 150, 0, { ramp: 180 }),
      ex("dip-volume", "Weighted Dip volume", 3, 8, 30, 7, 120, 0, {
        weighted: true,
      }),
      ex("lunge", "Passadas com halteres", 2, 10, null, 7, 90, 2, {
        perSide: true,
      }),
    ];
  if (day === 5)
    exercises = [
      main("deadlift", 145),
      ex("hamstring", "Mesa flexora", 3, 12, null, 8),
      ex("plank", "Prancha com carga", 3, 30, null, 7, 60, 3, {
        unit: "seconds",
        repsMax: 45,
      }),
    ];
  if ([4, 8, 11].includes(week))
    exercises = exercises.map((e) =>
      e.lift
        ? e
        : { ...e, sets: Math.min(e.sets, 2), rpe: Math.min(e.rpe, w.rpe) },
    );
  if (week === 12)
    exercises =
      day === 3
        ? []
        : [
            main(
              (
                { 1: "pullup", 2: "squat", 4: "dip", 5: "deadlift" } as Record<
                  number,
                  Lift
                >
              )[day],
              ({ 1: 10, 2: 130, 4: 50, 5: 145 } as Record<number, number>)[day],
            ),
          ];
  return {
    week,
    day,
    pull,
    pr: week === 12,
    name: pull
      ? `Pull ${day === 1 ? "01" : day === 3 ? "02" : "03"}`
      : `Push & Legs ${day === 2 ? "01" : "02"}`,
    focus: [
      "Força técnica",
      "Squat + Dip",
      "Volume técnico",
      "Volume + controle",
      "Hinge + baixa fadiga",
    ][day - 1],
    ...budget(exercises, pull),
  };
}
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
      s.finishedAt === null &&
      s.plan.week === plan.week &&
      s.plan.day === plan.day,
  );
  if (active) return active;
  if (!plan.valid)
    throw new Error("Plano excede 80 minutos e precisa de correção.");
  // Treinos podem ser refeitos: cada início cria uma execução única do mesmo dia.
  const run =
    state.sessions.filter(
      (s) => s.plan.week === plan.week && s.plan.day === plan.day,
    ).length + 1;
  const key = `${sessionKey(state.profile, plan.week, plan.day)}:r${run}`;
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
  if (session.plan.pull && now - session.startedAt < 1800000)
    throw new Error("Os primeiros 30 minutos são exclusivos de OAPU.");
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
    input.rpe > 10
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
    restUntil: now + exercise.rest * 1000,
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
export function liftMetrics(sessions: Session[], lift: Lift) {
  return sessions.flatMap((s) =>
    s.sets
      .filter((set) => set.exerciseId === lift && set.successful)
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
