import type { Exercise } from "./model";

// Prescrições individuais; o primeiro percentual de cada faixa é a entrada.
// Um bloco é [séries, reps, % de referência, RPE máximo].
type Block = [number, number, number, number];
type Wave = Block[];
const SQUAT: Wave[] = [
  [[3, 6, 60, 6]],
  [[4, 6, 62.5, 7]],
  [[5, 5, 67.5, 7]],
  [[2, 5, 50, 6]],
  [[4, 5, 70, 7.5]],
  [[5, 4, 72.5, 8]],
  [
    [1, 3, 80, 8],
    [3, 3, 75, 7.5],
  ],
  [[2, 3, 55, 6]],
  [
    [1, 2, 82.5, 8],
    [3, 3, 77.5, 7.5],
  ],
  [
    [1, 1, 85, 8.5],
    [3, 2, 80, 8],
  ],
  [
    [1, 1, 82.5, 8],
    [2, 2, 72.5, 6.5],
  ],
  [[3, 1, 80, 8.5]],
];
const PAUSED: Wave[] = [
  [[2, 8, 50, 6]],
  [[3, 8, 52.5, 6.5]],
  [[3, 8, 55, 7]],
  [[2, 5, 45, 6]],
  [[4, 6, 57.5, 7]],
  [[3, 7, 60, 7]],
  [[4, 5, 62.5, 7]],
  [[2, 5, 50, 6]],
  [[3, 5, 65, 7]],
  [[3, 4, 65, 7]],
  [[2, 3, 55, 6]],
  [[1, 3, 45, 5]],
];
const DIP: Wave[] = [
  [[3, 6, 60, 6]],
  [[4, 5, 65, 7]],
  [[4, 4, 70, 7.5]],
  [[2, 5, 50, 6]],
  [[4, 4, 72.5, 7.5]],
  [[4, 3, 75, 8]],
  [
    [1, 2, 82.5, 8],
    [3, 3, 75, 7.5],
  ],
  [[2, 3, 55, 6]],
  [
    [1, 2, 85, 8],
    [3, 2, 80, 8],
  ],
  [
    [1, 1, 87.5, 8.5],
    [2, 2, 80, 8],
  ],
  [
    [1, 1, 82.5, 8],
    [1, 3, 65, 6],
  ],
  [[3, 1, 80, 8.5]],
];
const BENCH: Wave[] = [
  [[3, 6, 60, 6]],
  [[3, 7, 60, 7]],
  [[4, 5, 67.5, 7]],
  [[2, 5, 50, 6]],
  [[4, 5, 70, 7.5]],
  [[4, 4, 72.5, 7.5]],
  [
    [1, 3, 80, 8],
    [2, 4, 70, 7],
  ],
  [[2, 4, 55, 6]],
  [
    [1, 2, 82.5, 8],
    [3, 3, 75, 7.5],
  ],
  [
    [1, 1, 85, 8.5],
    [2, 3, 75, 7],
  ],
  [
    [1, 1, 80, 7.5],
    [1, 3, 65, 6],
  ],
  [[3, 1, 80, 8.5]],
];
const PULL: Wave[] = [
  [[3, 5, 60, 6]],
  [[3, 6, 62.5, 6.5]],
  [[4, 4, 67.5, 7]],
  [[2, 4, 50, 6]],
  [[4, 4, 70, 7]],
  [[3, 3, 75, 7.5]],
  [
    [1, 2, 80, 8],
    [2, 3, 72.5, 7],
  ],
  [[2, 3, 55, 6]],
  [
    [1, 2, 82.5, 8],
    [2, 2, 75, 7],
  ],
  [
    [1, 1, 85, 8],
    [2, 2, 77.5, 7],
  ],
  [[2, 2, 65, 6]],
  [[3, 1, 80, 8.5]],
];
const DEADLIFT: Wave[] = [
  [[2, 5, 60, 6]],
  [[3, 5, 62.5, 6.5]],
  [[3, 4, 67.5, 7]],
  [[2, 3, 50, 6]],
  [[3, 4, 70, 7]],
  [[4, 3, 72.5, 7.5]],
  [
    [1, 2, 80, 8],
    [2, 3, 70, 7],
  ],
  [[2, 3, 55, 6]],
  [
    [1, 2, 82.5, 8],
    [2, 2, 75, 7],
  ],
  [
    [1, 1, 85, 8],
    [2, 2, 75, 7],
  ],
  [[2, 1, 70, 6]],
  [[3, 1, 80, 8.5]],
];
const DIP_VOLUME: Wave[] = [
  [[3, 8, 55, 6]],
  [[3, 9, 55, 6.5]],
  [[4, 7, 60, 7]],
  [[2, 6, 45, 6]],
  [[4, 7, 60, 7]],
  [[3, 8, 62.5, 7]],
  [[4, 6, 65, 7.5]],
  [[2, 5, 50, 6]],
  [[3, 6, 65, 7]],
  [[3, 5, 67.5, 7]],
  [[2, 4, 50, 6]],
  [[1, 5, 40, 5]],
];
const PULL_VOLUME: Wave[] = [
  [[2, 8, 55, 6]],
  [[3, 7, 57.5, 6.5]],
  [[3, 8, 57.5, 7]],
  [[2, 5, 45, 6]],
  [[3, 7, 60, 7]],
  [[3, 6, 62.5, 7]],
  [[3, 5, 65, 7]],
  [[2, 4, 50, 6]],
  [[3, 5, 65, 7]],
  [[2, 6, 62.5, 7]],
  [[2, 3, 50, 6]],
  [[1, 3, 40, 5]],
];
const PRESS: Wave[] = [
  [[2, 8, 55, 6]],
  [[3, 7, 55, 6.5]],
  [[3, 6, 60, 7]],
  [[2, 5, 45, 6]],
  [[3, 6, 62.5, 7]],
  [[4, 5, 65, 7.5]],
  [[3, 4, 67.5, 7.5]],
  [[2, 4, 50, 6]],
  [[3, 4, 70, 7.5]],
  [[2, 3, 72.5, 8]],
  [[2, 3, 50, 6]],
  [[1, 5, 40, 5]],
];
const WAVES: Record<string, Wave[]> = {
  squat: SQUAT,
  "paused-squat": PAUSED,
  dip: DIP,
  bench: BENCH,
  pullup: PULL,
  deadlift: DEADLIFT,
  "dip-volume": DIP_VOLUME,
  "pullup-volume": PULL_VOLUME,
  "overhead-press": PRESS,
};

export function applyWave(e: Exercise, week: number): Exercise {
  const blocks = WAVES[e.id]?.[week - 1];
  if (!blocks) return e;
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

export function hypertrophySets(e: Exercise, week: number, day: number) {
  if (week <= 2) return 2;
  if (e.id === "triceps-rope") return 2;
  if ([4, 8].includes(week)) return 2;
  if (week === 11) return 1;
  if (week === 12) return 0;
  const family = e.id.replace(/-cable$|-machine$|-seated$/g, "");
  const frequent = family === "lateral" || e.id === "triceps-rope";
  if ([9, 10].includes(week)) return frequent ? 2 : 3;
  if (week === 6 && ["leg-press", "calf-standing"].includes(e.id)) return 4;
  return frequent && day !== 4 ? 2 : 3;
}
