export const MODEL_VERSION = "hs-v1-epley" as const;
export type Lift = "squat" | "deadlift" | "dip" | "pullup";
export type Page =
  | "inicio"
  | "treino"
  | "ciclo"
  | "evolucao"
  | "recuperacao"
  | "historico"
  | "perfil";
export interface Profile {
  name: string;
  bodyweight: number;
  increment: number;
  cycleStart: string;
  historical: Record<Lift | "bench", number>;
  trainingMax: Record<Lift, number | null>;
}
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  repsMax?: number;
  load: number | null;
  rpe: number;
  rest: number;
  ramp: number;
  priority: number;
  lift?: Lift;
  weighted?: boolean;
  unit: "reps" | "seconds" | "meters";
  perSide?: boolean;
  note?: string;
}
export interface Plan {
  day: number;
  week: number;
  name: string;
  focus: string;
  pull: boolean;
  pr: boolean;
  exercises: Exercise[];
  estimatedSeconds: number;
  removed: string[];
  valid: boolean;
}
export interface SetLog {
  id: string;
  exerciseId: string;
  index: number;
  load: number;
  amount: number;
  rpe: number;
  bodyweight: number;
  completedAt: number;
  successful: boolean;
  ready: boolean;
}
export interface OapuLog {
  id: string;
  side: "D" | "E";
  assistance: string;
  reps: number;
  hold: number;
  rpe: number;
  symptoms: string;
  at: number;
}
export interface Session {
  id: string;
  date: string;
  startedAt: number;
  finishedAt: number | null;
  plan: Plan;
  sets: SetLog[];
  oapu: OapuLog[];
  bodyweight: number;
  restUntil: number | null;
  decisions: { at: number; reason: string; decision: string }[];
  version: typeof MODEL_VERSION;
}
export interface Readiness {
  id: string;
  date: string;
  sleep: number;
  stress: number;
  fatigue: number;
  pain: number;
  location: string;
  notes: string;
}
export interface AppState {
  schema: 1;
  profile: Profile;
  sessions: Session[];
  readiness: Readiness[];
  theme: "dark" | "light";
}
export interface Week {
  week: number;
  phase: string;
  sets: number;
  reps: number;
  rpe: number;
  label: string;
}
