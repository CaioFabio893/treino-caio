import { useSyncExternalStore } from "react";
import type { AppState } from "../domain/model";
import { initialState } from "../domain/engine";
const KEY = "hybrid-strength:v1";
const listeners = new Set<() => void>();
let snapshot: AppState = initialState();
let warning = "";
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const number = (x: unknown, min = 0, max = 1000) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
export function decode(raw: string): AppState {
  if (raw.length > 900000)
    throw new Error("Arquivo maior que o limite de 900 KB.");
  const x: unknown = JSON.parse(raw);
  if (
    !record(x) ||
    x.schema !== 1 ||
    !record(x.profile) ||
    !Array.isArray(x.sessions) ||
    !Array.isArray(x.readiness) ||
    !["dark", "light"].includes(String(x.theme))
  )
    throw new Error("Backup incompatível.");
  const p = x.profile;
  if (
    typeof p.name !== "string" ||
    p.name.length > 80 ||
    !number(p.bodyweight, 20, 400) ||
    !number(p.increment, 0.1, 25) ||
    typeof p.cycleStart !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(p.cycleStart) ||
    !Number.isFinite(new Date(`${p.cycleStart}T12:00:00`).getTime()) ||
    !record(p.historical) ||
    !record(p.trainingMax)
  )
    throw new Error("Perfil inválido.");

  if (
    !["squat", "deadlift", "dip", "pullup", "bench"].every((k) =>
      number((p.historical as Record<string, unknown>)[k]),
    ) ||
    !["squat", "deadlift", "dip", "pullup"].every(
      (k) =>
        p.trainingMax &&
        ((p.trainingMax as Record<string, unknown>)[k] === null ||
          number((p.trainingMax as Record<string, unknown>)[k], 0.1)),
    )
  )
    throw new Error("Máximos inválidos.");
  const ids = new Set<string>();
  if (
    p.referenceRm !== undefined &&
    (!record(p.referenceRm) ||
      Object.entries(p.referenceRm).some(
        ([key, value]) =>
          !/^[a-z][a-z0-9-]{0,60}$/.test(key) || !number(value, 0.1),
      ))
  )
    throw new Error("RMs de planejamento inválidos.");
  for (const s of x.sessions) {
    if (
      !record(s) ||
      typeof s.id !== "string" ||
      ids.has(s.id) ||
      typeof s.date !== "string" ||
      !number(s.startedAt, 1, 1e14) ||
      !(
        s.finishedAt === null ||
        number(s.finishedAt, s.startedAt as number, 1e14)
      ) ||
      !number(s.bodyweight, 20, 400) ||
      !record(s.plan) ||
      !Array.isArray(s.sets) ||
      !Array.isArray(s.oapu) ||
      !Array.isArray(s.decisions) ||
      s.version !== "hs-v1-epley" ||
      !(s.restUntil === null || number(s.restUntil, 0, 1e14))
    )
      throw new Error("Sessão inválida/duplicada.");
    ids.add(s.id);
    const plan = s.plan;
    if (
      !number(plan.week, 1, 12) ||
      !number(plan.day, 1, 6) ||
      !(plan.program === undefined || typeof plan.program === "string") ||
      typeof plan.name !== "string" ||
      typeof plan.focus !== "string" ||
      typeof plan.pull !== "boolean" ||
      typeof plan.pr !== "boolean" ||
      typeof plan.valid !== "boolean" ||
      !number(plan.estimatedSeconds, 0, 86400) ||
      !Array.isArray(plan.exercises) ||
      !Array.isArray(plan.removed) ||
      !plan.removed.every((v) => typeof v === "string")
    )
      throw new Error("Plano inválido.");
    for (const e of plan.exercises)
      if (
        !record(e) ||
        typeof e.id !== "string" ||
        typeof e.name !== "string" ||
        !(e.progressive === undefined || typeof e.progressive === "boolean") ||
        !(e.percent === undefined || number(e.percent, 0, 100)) ||
        !(
          e.scheduledPercent === undefined ||
          number(e.scheduledPercent, 0.1, 100)
        ) ||
        !(e.rm === undefined || number(e.rm, 0.1)) ||
        !(
          e.rmSource === undefined ||
          ["current", "historical"].includes(String(e.rmSource))
        ) ||
        !(
          e.referenceBodyweight === undefined ||
          number(e.referenceBodyweight, 0, 400)
        ) ||
        !(e.assistance === undefined || number(e.assistance, 0, 400)) ||
        !(
          e.setTargets === undefined ||
          (Array.isArray(e.setTargets) &&
            e.setTargets.length === e.sets &&
            e.setTargets.every(
              (target) =>
                record(target) &&
                number(target.reps, 1, 100) &&
                Number.isInteger(target.reps) &&
                number(target.percent, 0.1, 100) &&
                number(target.rpe, 1, 10) &&
                (target.load === null || number(target.load)) &&
                number(target.assistance, 0, 400),
            ))
        ) ||
        !(
          e.attempts === undefined ||
          (Array.isArray(e.attempts) &&
            e.attempts.length === 3 &&
            e.attempts.every(
              (a) =>
                record(a) &&
                number(a.percent, 0.1, 100) &&
                number(a.load) &&
                number(a.assistance, 0, 400),
            ))
        ) ||
        !number(e.sets, 1, 30) ||
        !number(e.reps, 1) ||
        !(e.repsMax === undefined || number(e.repsMax, Number(e.reps))) ||
        !(e.load === null || number(e.load)) ||
        !number(e.rpe, 1, 10) ||
        !number(e.rest, 0, 3600) ||
        !number(e.ramp, 0, 3600) ||
        !number(e.priority, 0, 100) ||
        !["reps", "seconds", "meters"].includes(String(e.unit))
      )
        throw new Error("Exercício inválido.");
    const setIds = new Set<string>();
    for (const set of s.sets) {
      if (
        !record(set) ||
        typeof set.id !== "string" ||
        setIds.has(set.id) ||
        typeof set.exerciseId !== "string" ||
        !plan.exercises.some(
          (e) =>
            record(e) &&
            e.id === set.exerciseId &&
            number(set.index, 0, Number(e.sets) - 1),
        ) ||
        !number(set.load) ||
        !(
          set.assistance === undefined ||
          (number(set.assistance, 0, Number(s.bodyweight)) &&
            (set.assistance === 0 ||
              (set.load === 0 &&
                !plan.pr &&
                plan.exercises.some(
                  (e) =>
                    record(e) && e.id === set.exerciseId && e.weighted === true,
                ))))
        ) ||
        !number(set.amount, 1) ||
        !number(set.rpe, 1, 10) ||
        !number(set.bodyweight, 20, 400) ||
        !number(set.completedAt, 1, 1e14) ||
        typeof set.successful !== "boolean" ||
        typeof set.ready !== "boolean"
      )
        throw new Error("Série inválida/duplicada.");
      setIds.add(set.id);
    }
    for (const log of s.oapu)
      if (
        !record(log) ||
        typeof log.id !== "string" ||
        !["D", "E"].includes(String(log.side)) ||
        typeof log.assistance !== "string" ||
        !number(log.reps, 0, 100) ||
        !number(log.hold, 0, 120) ||
        !number(log.rpe, 1, 10) ||
        typeof log.symptoms !== "string" ||
        !number(log.at, 1, 1e14)
      )
        throw new Error("OAPU inválido.");
    for (const d of s.decisions)
      if (
        !record(d) ||
        !number(d.at, 1, 1e14) ||
        typeof d.reason !== "string" ||
        typeof d.decision !== "string"
      )
        throw new Error("Decisão inválida.");
  }
  for (const r of x.readiness)
    if (
      !record(r) ||
      typeof r.id !== "string" ||
      typeof r.date !== "string" ||
      !number(r.sleep, 0, 24) ||
      !number(r.stress, 0, 10) ||
      !number(r.fatigue, 0, 10) ||
      !number(r.pain, 0, 10) ||
      typeof r.location !== "string" ||
      typeof r.notes !== "string"
    )
      throw new Error("Recuperação inválida.");
  return x as unknown as AppState;
}
try {
  const raw = localStorage.getItem(KEY);
  if (raw) snapshot = decode(raw);
} catch {
  warning =
    "Não foi possível ler o armazenamento. Exporte/guarde o arquivo existente antes de substituir dados.";
}
function notify() {
  listeners.forEach((fn) => fn());
}
if (typeof window !== "undefined")
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    try {
      snapshot = event.newValue ? decode(event.newValue) : initialState();
      notify();
    } catch {
      warning = "Dados de outra aba inválidos; atualização rejeitada.";
      notify();
    }
  });
export function useStore() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => snapshot,
  );
}
export function storageWarning() {
  return warning;
}
export async function commit(update: (state: AppState) => AppState) {
  if (!navigator.locks)
    throw new Error(
      "Este navegador precisa de suporte a Web Locks para gravar com segurança. Use Chrome/Edge atualizado em localhost ou HTTPS.",
    );
  await navigator.locks.request(KEY, () => {
    const raw = localStorage.getItem(KEY);
    const current = raw ? decode(raw) : snapshot;
    const next = update(current);
    const encoded = JSON.stringify(next);
    decode(encoded);
    localStorage.setItem(KEY, encoded);
    snapshot = next;
    warning = "";
    notify();
  });
}
export function exportState(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hybrid-strength-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
