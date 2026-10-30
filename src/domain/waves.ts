import type { Exercise } from "./model";

// Prescrições individuais; o primeiro percentual de cada faixa é a entrada.
// Um bloco é [séries, reps, % de referência, RPE máximo].
type Block = [number, number, number, number];
type Wave = Block[];

export const DELOAD_WEEKS = [7, 11];
export const REDUCED_WEEKS = [7, 11, 12];

// Pesados (agachamento, dip, barra): mesma onda por movimento, % do 1RM de cada um.
const HEAVY: Wave[] = [
  [[4, 6, 60, 6]],
  [[4, 6, 62.5, 6.5]],
  [[4, 6, 65, 7]],
  [[4, 6, 67.5, 7]],
  [[4, 6, 70, 7.5]],
  [[5, 5, 72.5, 8]],
  [[3, 5, 60, 6]],
  [[5, 4, 77.5, 8]],
  [[5, 3, 80, 8.5]],
  [
    [1, 3, 85, 9],
    [3, 4, 77.5, 8],
  ],
  [[3, 3, 65, 6]],
  [
    [1, 1, 85, 7],
    [1, 1, 92.5, 9],
    [1, 1, 95, 9.5],
  ],
];
// Dias de volume (squat pausado, dip e barra de volume); semana 12 sem volume.
const VOLUME: Wave[] = [
  [[3, 8, 52.5, 6]],
  [[3, 8, 55, 6.5]],
  [[3, 8, 57.5, 6.5]],
  [[3, 8, 60, 6.5]],
  [[3, 8, 62.5, 7]],
  [[3, 8, 65, 7.5]],
  [[2, 6, 50, 5]],
  [[3, 6, 67.5, 7]],
  [[3, 6, 70, 7.5]],
  [[3, 5, 72.5, 7.5]],
  [[2, 4, 55, 5]],
  [],
];
const DEADLIFT: Wave[] = [
  [[3, 5, 55, 6]],
  [[3, 5, 60, 6.5]],
  [[3, 5, 62.5, 7]],
  [[3, 5, 65, 7]],
  [[3, 4, 70, 7.5]],
  [[4, 4, 75, 8]],
  [[2, 4, 60, 6]],
  [[4, 3, 77.5, 8]],
  [[4, 3, 80, 8.5]],
  [
    [1, 3, 85, 9],
    [2, 3, 77.5, 8],
  ],
  [[2, 3, 60, 6]],
  [
    [1, 1, 85, 7],
    [1, 1, 92.5, 9],
    [1, 1, 95, 9.5],
  ],
];
const PRESS: Wave[] = [
  [[3, 8, 55, 6]],
  [[3, 8, 57.5, 6.5]],
  [[3, 8, 60, 7]],
  [[3, 8, 60, 7]],
  [[4, 6, 65, 7.5]],
  [[4, 6, 67.5, 8]],
  [[2, 6, 52.5, 6]],
  [[4, 5, 72.5, 8]],
  [[4, 4, 75, 8.5]],
  [[4, 3, 80, 8.5]],
  [[2, 4, 60, 6]],
  [],
];
const WAVES: Record<string, Wave[]> = {
  squat: HEAVY,
  dip: HEAVY,
  pullup: HEAVY,
  bench: HEAVY,
  "bench-volume": VOLUME,
  "paused-squat": VOLUME,
  "dip-volume": VOLUME,
  "pullup-volume": VOLUME,
  deadlift: DEADLIFT,
  "overhead-press": PRESS,
};

export function applyWave(e: Exercise, week: number): Exercise {
  const blocks = WAVES[e.id]?.[week - 1];
  if (!blocks?.length) return e;
  const setTargets = blocks.flatMap(([sets, reps, percent, rpe]) =>
    Array.from({ length: sets }, () => ({
      reps,
      percent,
      rpe,
      load: null,
      assistance: 0,
    })),
  );
  return {
    ...e,
    sets: setTargets.length,
    reps: setTargets[0].reps,
    repsMax: undefined,
    percent: setTargets[0].percent,
    rpe: Math.max(...setTargets.map((s) => s.rpe)),
    setTargets,
  };
}

export function waveSummary(e: Exercise) {
  if (!e.setTargets?.length)
    return `${e.sets} × ${e.reps}${e.repsMax ? `–${e.repsMax}` : ""}`;
  const groups: {
    count: number;
    reps: number;
    percent: number;
    rpe: number;
  }[] = [];
  for (const s of e.setTargets) {
    const last = groups.at(-1);
    if (
      last &&
      last.reps === s.reps &&
      last.percent === s.percent &&
      last.rpe === s.rpe
    )
      last.count++;
    else
      groups.push({ count: 1, reps: s.reps, percent: s.percent, rpe: s.rpe });
  }
  return groups
    .map((s) => `${s.count}×${s.reps} · ${s.percent}% · RPE ≤ ${s.rpe}`)
    .join(" + ");
}

// Séries semanais dos secundários: base por semana; compostos usam a base,
// isoladores menores (tríceps, rosca, facepull, abdômen, hang) uma série a menos.
const HYPERTROPHY_BASE = [3, 3, 4, 4, 4, 4, 2, 4, 4, 3, 2, 0];
const ISOLATION = ["triceps-rope", "triceps-overhead", "curl", "facepull", "cable-crunch", "hang-hold"];

export function hypertrophySets(e: Exercise, week: number) {
  const base = HYPERTROPHY_BASE[week - 1];
  if (base === 0) return 0;
  const family = e.id.replace(/-cable$|-machine$|-seated$|-hammer$/g, "");
  if (ISOLATION.includes(family)) return Math.max(2, base - 1);
  return base;
}
