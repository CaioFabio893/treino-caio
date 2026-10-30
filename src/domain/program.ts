import type { Exercise, Plan, Profile, Session, Week } from "./model";
import { HEAVY_PERCENT, planLoads } from "./loads";
import { applyWave, hypertrophySets, REDUCED_WEEKS } from "./waves";
import { varyAccessories } from "./accessories";

export const PROGRAM_ID = "oapu-strength-waves-v5";
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
// Semanas 1–3: reentrada; 7 e 11: deload; 12: teste conservador.
export const PROGRAM_WEEKS: Week[] = [
  [4, 6, 6, "Reentrada leve"],
  [4, 6, 6.5, "Reentrada"],
  [4, 6, 7, "Fechar a reentrada"],
  [4, 6, 7, "Volume base"],
  [4, 6, 7.5, "Acumular volume"],
  [5, 5, 8, "Consolidar a base"],
  [3, 5, 6, "Deload"],
  [5, 4, 8, "Força"],
  [5, 3, 8.5, "Força pesada"],
  [4, 4, 9, "Top set + reduções"],
  [3, 3, 6, "Deload e taper"],
  [3, 1, 9.5, "Teste de PR conservador"],
].map((row, i) => ({
  week: i + 1,
  sets: Number(row[0]),
  reps: Number(row[1]),
  rpe: Number(row[2]),
  label: String(row[3]),
  percent: HEAVY_PERCENT[i],
  phase:
    i < 3
      ? "Reentrada"
      : i < 6
        ? "Acumulação"
        : i < 9
          ? "Intensificação"
          : i < 11
            ? "Pico"
            : "Teste PR",
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

// One-arm: A (dia 1) força, C (dia 3) técnica leve, E (dia 5) volume excêntrico.
const FORCE_SETS = [4, 4, 4, 5, 5, 5, 3, 5, 6, 5, 3, 2];
const FORCE_RPE = [6, 6.5, 7, 7, 7.5, 8, 6, 8, 8, 9, 6.5, 6];
const VOLUME_SETS = [4, 4, 5, 5, 5, 6, 3, 5, 5, 4, 2, 3];
const VOLUME_RPE = [6, 6.5, 6.5, 7, 7, 7.5, 5, 7, 7.5, 7.5, 6, 10];

export function oapuProtocol(week: number, day: number) {
  const reduced = REDUCED_WEEKS.includes(week);
  const technical = day === 3;
  const volume = day === 5;
  const sets = technical
    ? reduced
      ? 2
      : 4
    : volume
      ? VOLUME_SETS[week - 1]
      : FORCE_SETS[week - 1];
  const reps = technical || week === 12 ? 1 : volume || week <= 6 ? 2 : 1;
  const rpe = technical
    ? 6
    : volume
      ? VOLUME_RPE[week - 1]
      : FORCE_RPE[week - 1];
  const test = week === 12 && volume;
  return {
    title: test
      ? "Teste de one-arm (3 tentativas)"
      : technical
        ? "Prime técnico leve"
        : volume
          ? "Volume unilateral excêntrico"
          : "Força unilateral prioritária",
    sets,
    reps,
    rpe,
    skill: `One-arm pull-up assistido · ${sets}×${reps} por braço`,
    support: test
      ? "Tentativas por RPE, da assistência menor para a maior; pare se a técnica cair. Sem negativas máximas obrigatórias."
      : technical
        ? "Singles leves só para técnica, antes do dip pesado. Pare longe da falha."
        : "Registre cada lado e a assistência. Quando completar todas as séries dentro do RPE, reduza a assistência em cerca de 2,5% do peso corporal na semana seguinte. Excêntrico de 5 s no dia de volume.",
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
  const reduced = REDUCED_WEEKS.includes(week);
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
      accessory("row", "Remada pesada com peito apoiado", 3, 8),
      accessory("curl", "Rosca bíceps", 3, 10),
      accessory("hang-hold", "Hang isométrico na pegada de one-arm", 2, 15, {
        repsMax: 20,
        unit: "seconds",
      }),
    ];
  if (day === 2)
    exercises = [
      heavy("squat", "Back squat"),
      accessory("leg-press", "Leg press", 3, 10, { repsMax: 15 }),
      accessory("extension", "Cadeira extensora", 3, 12),
      accessory("calf-standing", "Panturrilha em pé", 3, 12, { repsMax: 15 }),
    ];
  if (day === 3)
    exercises = [
      heavy("dip", "Dip com lastro", true),
      heavy("bench", "Supino reto com barra"),
      accessory("lateral", "Elevação lateral", 3, 15),
      accessory("triceps-rope", "Tríceps na polia", 2, 10, { repsMax: 15 }),
    ];
  if (day === 4)
    exercises = [
      heavy("deadlift", "Levantamento terra (convencional ou trap bar)"),
      exercise(
        "overhead-press",
        "Desenvolvimento militar (strict ou push press)",
        3,
        6,
        {
          repsMax: 8,
          priority: 1,
          progressive: true,
          rpe: week <= 2 || reduced ? 6 : 7,
          rest: 150,
        },
      ),
      accessory("hamstring", "Mesa flexora", 3, 12),
      accessory("farmer", "Farmer walk pesado", 4, 30, {
        repsMax: 40,
        unit: "meters",
        priority: 1,
        rest: 120,
      }),
      accessory("cable-crunch", "Abdominal na polia", 3, 12, { repsMax: 15 }),
    ];
  if (day === 5)
    exercises = [
      volume("pullup-volume", "Barra com lastro — volume", true),
      accessory("lat-pulldown", "Puxada neutra", 3, 10),
      accessory("row-single", "Remada unilateral", 3, 10, { perSide: true }),
      accessory("facepull", "Facepull", 3, 15),
      accessory("curl", "Rosca bíceps", 3, 10),
    ];
  if (day === 6)
    exercises = [
      volume("dip-volume", "Dip — volume", true),
      volume("paused-squat", "Back squat pausado"),
      volume("bench-volume", "Supino reto — volume"),
      exercise("db-clean-press", "Clean and press com halteres", 4, 5, {
        priority: 1,
        rest: 120,
        note: "Strongman de academia (substitui o log). Carga por mão; técnica antes de peso.",
      }),
      accessory(
        "sled-carry",
        "Sled push/drag ou carry com sandbag/anilha",
        4,
        20,
        { unit: "meters", priority: 1, rest: 120 },
      ),
      accessory("lateral", "Elevação lateral", 3, 15),
    ];
  exercises = varyAccessories(exercises, week).map((e) => {
    const waved = applyWave(e, week);
    if (waved.setTargets) return waved;
    return {
      ...e,
      sets: Math.max(1, hypertrophySets(e, week)),
      rpe:
        REDUCED_WEEKS.includes(week) || week <= 2
          ? 6
          : week <= 4
            ? 7
            : week <= 7
              ? 7.5
              : 8,
    };
  });
  const pr = week === 12 && (day <= 4 || day === 6);
  if (week === 12) {
    const tests = ["pullup", "squat", "dip", "deadlift", "", "bench"] as const;
    const names = [
      "Barra fixa com lastro",
      "Back squat",
      "Dip com lastro",
      "Levantamento terra",
      "",
      "Supino reto com barra",
    ];
    exercises =
      day === 5
        ? []
        : [
            applyWave(
              heavy(tests[day - 1], names[day - 1], [1, 3].includes(day)),
              week,
            ),
          ];
  }
  const plan: Plan = {
    program: PROGRAM_ID,
    week,
    day,
    name: `Treino ${"ABCDEF"[day - 1]}`,
    focus:
      week === 12 && day === 6
        ? "Teste de supino"
        : week === 12 && day === 5
          ? "Teste de one-arm"
          : [
              "One-arm força + barra pesada",
              "Agachamento pesado + pernas",
              "Dip pesado + supino + one-arm leve",
              "Terra + press + posterior + carries",
              "One-arm volume + costas",
              "Dip e supino de volume + squat 2 + strongman",
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
