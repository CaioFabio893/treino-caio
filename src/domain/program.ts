import type { Exercise, Plan, Profile, Session, Week } from "./model";
import { HEAVY_PERCENT, planLoads } from "./loads";
import { varyAccessories } from "./accessories";

export const PROGRAM_ID = "oapu-strength-weekly-v3";
export const TRAINING_DAYS = [1, 2, 3, 4, 5, 6];
export const WEEKDAY_LABELS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
export const ROTATION =
  "Seg A → Ter B → Qua C → Qui D → Sex E → Sáb F → Dom descanso";

// Prescrição dos movimentos pesados; os dias de volume e técnica têm dose própria.
export const PROGRAM_WEEKS: Week[] = [
  [3, 6, 6, "Base e calibração"],
  [3, 6, 6.5, "Acumular volume"],
  [3, 6, 7, "Consolidar a base"],
  [2, 5, 6, "Deload"],
  [3, 5, 7, "Intensificar"],
  [3, 4, 7.5, "Força progressiva"],
  [3, 3, 8, "Triplas controladas"],
  [2, 3, 6, "Deload"],
  [3, 3, 8, "Especificidade"],
  [2, 2, 8, "Duplas submáximas"],
  [2, 2, 6, "Taper"],
  [3, 1, 8.5, "PR com prontidão"],
].map((row, i) => ({
  week: i + 1,
  sets: Number(row[0]),
  reps: Number(row[1]),
  rpe: Number(row[2]),
  label: String(row[3]),
  percent: HEAVY_PERCENT[i],
  phase:
    i < 4
      ? "Acumulação"
      : i < 8
        ? "Intensificação"
        : i < 11
          ? "Peaking"
          : "PR Test",
}));

function exercise(
  id: string,
  name: string,
  sets: number,
  reps: number,
  extra: Partial<Exercise> = {},
): Exercise {
  return {
    id,
    name,
    sets,
    reps,
    load: null,
    rpe: 8,
    rest: 90,
    ramp: 0,
    priority: 2,
    unit: "reps",
    ...extra,
  };
}

export function oapuProtocol(week: number, day: number) {
  const reduced = [4, 8, 11, 12].includes(week);
  const block = Math.floor((week - 1) / 4);
  const technical = day === 3;
  const sets = reduced ? 2 : day === 5 ? 2 : 3;
  const reps = technical
    ? 2
    : day === 5
      ? block === 0
        ? "3–4"
        : "2–3"
      : block === 0
        ? "2–3"
        : "1–2";
  const rpe =
    reduced || week <= 2
      ? 6
      : technical
        ? 6
        : day === 5
          ? 7
          : block === 0
            ? 7
            : 8;
  return {
    title: technical
      ? "Técnica com mais assistência"
      : day === 5
        ? "Volume unilateral controlado"
        : "Força unilateral prioritária",
    sets,
    reps,
    rpe,
    skill: `One-arm pull-up assistido · ${sets}×${reps} por braço`,
    support:
      week === 12
        ? "Compare a assistência com registros anteriores. Tentativa livre somente se já estiver preparado; sem negativas máximas obrigatórias."
        : "Registre cada lado e a assistência. Reduza assistência apenas após completar as séries com amplitude e controle, sem dor.",
    warmup: 7,
    cooldown: 5,
  };
}

export function makeProgramPlan(
  week: number,
  day: number,
  profile?: Profile,
  sessions?: Session[],
): Plan {
  if (
    !Number.isInteger(week) ||
    week < 1 ||
    week > 12 ||
    !TRAINING_DAYS.includes(day)
  )
    throw new Error("Semana ou índice de treino inválido.");
  const w = PROGRAM_WEEKS[week - 1];
  const reduced = [4, 8, 11, 12].includes(week);
  const heavy = (id: string, name: string, weighted = false): Exercise =>
    exercise(
      id,
      name,
      id === "deadlift" && week !== 12 ? Math.min(3, w.sets) : w.sets,
      w.reps,
      {
        priority: 0,
        rest: 180,
        ramp: 240,
        weighted,
        progressive: true,
        rpe: w.rpe,
        ...(["pullup", "squat", "dip", "deadlift"].includes(id)
          ? { lift: id as Exercise["lift"] }
          : {}),
        note: "Carga inicial a definir pelo RPE atual, não pelos recordes antigos. Sugestões do histórico são opcionais; sem aumento obrigatório por semana.",
      },
    );
  const volume = (id: string, name: string, weighted = false): Exercise =>
    exercise(id, name, reduced ? 2 : 3, week < 5 ? 6 : week < 9 ? 5 : 4, {
      repsMax: week < 5 ? 8 : week < 9 ? 7 : 6,
      priority: 0,
      rest: 150,
      weighted,
      progressive: true,
      rpe: reduced || week <= 2 ? 6 : 7,
    });
  const accessory = (
    id: string,
    name: string,
    sets: number,
    reps: number,
    extra: Partial<Exercise> = {},
  ) => exercise(id, name, sets, reps, extra);
  let exercises: Exercise[] = [];
  if (day === 1)
    exercises = [
      heavy("pullup", "Barra fixa com lastro", true),
      {
        ...heavy("deadlift", "Levantamento terra"),
        sets: Math.min(2, w.sets),
        note: "Depois do one-arm e da barra. Terra com volume controlado; reduza a carga se a fadiga das puxadas elevar o RPE.",
      },
      accessory("row", "Remada apoiada", 2, 8),
      accessory("hamstring", "Mesa flexora", 2, 10),
      accessory("curl", "Rosca bíceps", 2, 10),
    ];
  if (day === 2)
    exercises = [
      heavy("dip", "Dip com lastro", true),
      heavy("bench", "Supino reto com barra"),
      accessory("lateral", "Elevação lateral", 2, 12),
      accessory("triceps-rope", "Tríceps na polia", 2, 10, { repsMax: 15 }),
    ];
  if (day === 3)
    exercises = [
      heavy("squat", "Back squat"),
      accessory("row-single", "Remada serrote", 2, 8, { perSide: true }),
      accessory("leg-press", "Leg press", 2, 10, { repsMax: 15 }),
      accessory("extension", "Cadeira extensora", 2, 12),
      accessory("calf-standing", "Panturrilha em pé", 2, 10, { repsMax: 15 }),
    ];
  if (day === 4)
    exercises = [
      exercise("overhead-press", "Desenvolvimento militar", 2, 6, {
        repsMax: 8,
        priority: 1,
        progressive: true,
        rpe: week <= 2 || reduced ? 6 : 7,
        rest: 150,
      }),
      accessory("cable-fly", "Crucifixo na polia", 2, 12, { repsMax: 15 }),
      accessory("lateral", "Elevação lateral", 2, 12),
      accessory("reverse", "Crucifixo invertido", 2, 12),
      accessory("triceps-rope", "Tríceps na polia", 2, 10, { repsMax: 15 }),
    ];
  if (day === 5)
    exercises = [
      volume("pullup-volume", "Barra com lastro — volume", true),
      {
        ...volume("paused-squat", "Back squat pausado"),
        reps: week < 9 ? 4 : 3,
        repsMax: week < 9 ? 6 : 5,
      },
      accessory("facepull", "Facepull", 2, 12),
      accessory("hamstring", "Mesa flexora", 2, 10),
      accessory("cable-crunch", "Abdominal na polia", 2, 10, { repsMax: 15 }),
    ];
  if (day === 6)
    exercises = [
      {
        ...volume("dip-volume", "Dip — volume", true),
        repsMax: week < 5 ? 10 : week < 9 ? 8 : 6,
      },
      accessory("lateral", "Elevação lateral", 2, 12),
      accessory("triceps-overhead", "Tríceps acima da cabeça na polia", 2, 10, {
        repsMax: 15,
      }),
      accessory("chest-press", "Supino na máquina", 2, 10, { repsMax: 15 }),
    ];
  exercises = varyAccessories(exercises, week).map((e) => {
    if (e.priority <= 1)
      return reduced && !e.lift
        ? { ...e, sets: Math.min(e.sets, 2), rpe: Math.min(e.rpe, w.rpe) }
        : e;
    // Acessórios crescem na base; menor volume conforme o pico se aproxima.
    const cap =
      week === 11
        ? 1
        : [4, 8, 9, 10, 12].includes(week)
          ? 2
          : week === 1
            ? 2
            : 3;
    return {
      ...e,
      sets: Math.min(e.sets, cap),
      rpe: reduced || week <= 2 ? 6 : week < 7 ? 7 : 7.5,
    };
  });
  const pr = week === 12 && day <= 5;
  if (week === 12) {
    const tests = ["pullup", "dip", "squat", "bench", "deadlift"] as const;
    const names = [
      "Barra fixa com lastro",
      "Dip com lastro",
      "Back squat",
      "Supino reto com barra",
      "Levantamento terra",
    ];
    exercises =
      day <= 5
        ? [heavy(tests[day - 1], names[day - 1], [1, 2].includes(day))]
        : [];
  }
  const plan: Plan = {
    program: PROGRAM_ID,
    week,
    day,
    name: `Treino ${"ABCDEF"[day - 1]}`,
    focus:
      week === 12 && day === 6
        ? "Descanso e recuperação"
        : [
            "One-arm + barra pesada + terra",
            "Dip pesado + supino reto",
            "One-arm técnico + back squat",
            "Desenvolvimento + hipertrofia",
            "One-arm + barra e squat de volume",
            "Dip de volume + acessórios",
          ][day - 1],
    pull: [1, 3, 5].includes(day),
    pr,
    exercises,
    removed: [],
    estimatedSeconds: 0,
    valid: true,
  };
  return profile ? planLoads(plan, profile, sessions) : plan;
}
