import { describe, expect, it } from "vitest";
import {
  addSet,
  currentWeek,
  e1rm,
  elapsed,
  initialState,
  liftMetrics,
  makePlan,
  monday,
  percentage,
  roundLoad,
  startSession,
  suggestion,
  totalLoad,
} from "./engine";
import type { AppState, Session } from "./model";
const MONDAY = new Date("2026-10-19T18:30:00-03:00").getTime();
function state(): AppState {
  const s = initialState();
  s.profile.cycleStart = "2026-10-19";
  return s;
}
function session(): Session {
  return startSession(state(), makePlan(1, 1), MONDAY);
}
describe("cargas e estimativas", () => {
  it("calcula percentual de TM validado e rejeita valores inválidos", () => {
    expect(percentage(160, 75)).toBe(120);
    expect(() => percentage(0, 80)).toThrow();
    expect(() => percentage(160, NaN)).toThrow();
  });
  it("arredonda pelo incremento configurado e rejeita incremento inválido", () => {
    expect(roundLoad(131, 2.5)).toBe(130);
    expect(roundLoad(131.25, 2.5)).toBe(132.5);
    expect(() => roundLoad(50, 0)).toThrow();
    expect(() => roundLoad(NaN, 2.5)).toThrow();
  });
  it("Epley tem caso de single e domínio de 1–10 reps", () => {
    expect(e1rm(100, 6)).toBe(120);
    expect(e1rm(125, 1)).toBe(125);
    expect(e1rm(100, 11)).toBeNull();
    expect(e1rm(100, 0)).toBeNull();
    expect(e1rm(100, 1.5)).toBeNull();
  });
  it("separa lastro do peso corporal", () => {
    expect(totalLoad(25, 100, true)).toBe(125);
    expect(totalLoad(130, 100, false)).toBe(130);
  });
  it("regride por RPE e bloqueia progressão por dor", () => {
    expect(suggestion(100, 8, 7, 2.5).load).toBe(95);
    expect(suggestion(100, 9, 7, 2.5).load).toBe(92.5);
    expect(suggestion(100, 6, 7, 2.5).load).toBe(102.5);
    expect(suggestion(100, 6, 7, 2.5, 4).load).toBeNull();
    expect(suggestion(100, 7, 7, 2.5, 3).load).toBe(100);
  });
});
describe("ciclo de 12 semanas", () => {
  it("gera 72 planos livres A–F sem orçamento de tempo", () => {
    const plans = Array.from({ length: 12 }, (_, i) =>
      [1, 2, 3, 4, 5, 6].map((d) => makePlan(i + 1, d)),
    ).flat();
    expect(plans).toHaveLength(72);
    for (const p of plans) {
      expect(p.pull).toBe([1, 3, 5].includes(p.day));
      expect(p.valid).toBe(true);
      expect(p.removed).toEqual([]);
    }
    expect(() => makePlan(1, 0)).toThrow();
    expect(() => makePlan(1, 7)).toThrow();
  });
  it("supino é progressivo e cargas iniciais não copiam máximos históricos", () => {
    expect(makePlan(1, 1).exercises[0]).toMatchObject({
      id: "pullup",
      sets: 3,
      reps: 6,
      load: null,
      rpe: 6,
    });
    expect(makePlan(1, 3).exercises[0]).toMatchObject({
      id: "bench",
      progressive: true,
      load: null,
    });
  });
  it("deloads e taper reduzem dose e esforço", () => {
    expect(makePlan(4, 1).exercises[0]).toMatchObject({
      sets: 2,
      reps: 5,
      rpe: 6,
    });
    expect(makePlan(8, 4).exercises[0]).toMatchObject({
      sets: 2,
      reps: 3,
      rpe: 6,
    });
    expect(makePlan(11, 2).exercises[0]).toMatchObject({
      sets: 2,
      reps: 2,
      rpe: 6,
    });
    expect(
      makePlan(7, 6).exercises.find((e) => e.id === "dip-volume")?.rpe,
    ).toBeLessThanOrEqual(7.5);
  });
  it("S12 separa cinco testes e preserva um treino unilateral leve", () => {
    expect([1, 2, 3, 4, 6].map((d) => makePlan(12, d).exercises[0].id)).toEqual(
      ["pullup", "squat", "bench", "deadlift", "dip"],
    );
    expect(makePlan(12, 5).exercises).toHaveLength(0);
    expect(makePlan(12, 5).pr).toBe(false);
  });
  it("calendário considera segunda e dias civis, não diferença de horário/DST", () => {
    expect(monday(new Date("2026-10-18T12:00:00"))).toBe("2026-10-12");
    expect(currentWeek("2026-10-19", "2026-10-26")).toBe(2);
    expect(currentWeek("2026-10-19", "2026-12-28")).toBe(11);
  });
});
describe("sessões reais", () => {
  it("nomeia A–F mantendo os seis planos e sem impor duração máxima", () => {
    expect([1, 2, 3, 4, 5, 6].map((i) => makePlan(1, i).name)).toEqual([
      "Treino A",
      "Treino B",
      "Treino C",
      "Treino D",
      "Treino E",
      "Treino F",
    ]);
    const longPlan = {
      ...makePlan(1, 2),
      valid: false,
      estimatedSeconds: 9000,
    };
    expect(startSession(state(), longPlan, MONDAY).plan.exercises).toEqual(
      longPlan.exercises,
    );
  });
  it("permite iniciar em qualquer dia, incluindo fim de semana e qualquer semana", () => {
    const saturday = new Date("2026-10-17T18:30:00-03:00").getTime();
    expect(startSession(state(), makePlan(1, 1), saturday).date).toBe(
      "2026-10-17",
    );
    expect(startSession(state(), makePlan(2, 1), MONDAY).id).toBe(
      "2026-10-19:w2:d1:oapu-strength-12w-v2:r1",
    );
    expect(startSession(state(), makePlan(1, 2), MONDAY).id).toBe(
      "2026-10-19:w1:d2:oapu-strength-12w-v2:r1",
    );
  });
  it("retoma a sessão ativa e permite refazer treino concluído", () => {
    const s = state();
    const first = session();
    s.sessions = [first];
    // Retoma a mesma sessão ativa sem duplicar.
    expect(startSession(s, makePlan(1, 1), MONDAY)).toEqual(first);
    // Pode abrir outro treino mesmo com um em andamento.
    expect(startSession(s, makePlan(1, 2), MONDAY + 86400000).id).toBe(
      "2026-10-19:w1:d2:oapu-strength-12w-v2:r1",
    );
    // Refazer um treino concluído cria uma nova execução.
    const done = { ...first, finishedAt: first.startedAt + 1800000 };
    s.sessions = [done];
    expect(startSession(s, makePlan(1, 1), MONDAY + 172800000).id).toBe(
      "2026-10-19:w1:d1:oapu-strength-12w-v2:r2",
    );
  });
  it("força pode ser registrada imediatamente sem aguardar OAPU", () => {
    const s = session();
    const e = s.plan.exercises[0];
    const input = {
      index: 0,
      load: 10,
      amount: 6,
      rpe: 7,
      successful: true,
      ready: false,
    };
    expect(addSet(s, e, input, MONDAY).sets).toHaveLength(1);
    expect(addSet(s, e, input, MONDAY + 1800000).sets).toHaveLength(1);
  });
  it("grava zero de lastro, exige valores observados e evita série duplicada", () => {
    const s = session(),
      e = s.plan.exercises[0],
      input = {
        index: 0,
        load: 0,
        amount: 6,
        rpe: 7,
        successful: true,
        ready: false,
      };
    const saved = addSet(s, e, input, MONDAY + 1800000);
    expect(saved.sets[0].load).toBe(0);
    expect(addSet(saved, e, input, MONDAY + 1801000).sets).toHaveLength(1);
    expect(() =>
      addSet(s, e, { ...input, amount: 0 }, MONDAY + 1800000),
    ).toThrow();
    expect(() =>
      addSet(s, e, { ...input, rpe: NaN }, MONDAY + 1800000),
    ).toThrow();
  });
  it("relógio conta timestamps, atravessa navegação e não finaliza aos 80 min", () => {
    const s = session();
    expect(elapsed(s, MONDAY + 4800000)).toBe(4800);
    expect(s.finishedAt).toBeNull();
    expect(
      elapsed({ ...s, finishedAt: MONDAY + 120000 }, MONDAY + 600000),
    ).toBe(120);
  });
  it("terceira tentativa exige prontidão e falha não vira recorde", () => {
    const s = state();
    const p = makePlan(12, 1);
    const sess = { ...session(), plan: p };
    const e = p.exercises[0];
    const input = {
      index: 2,
      load: 40,
      amount: 1,
      rpe: 9,
      successful: false,
      ready: false,
    };
    expect(() => addSet(sess, e, input, MONDAY + 1800000)).toThrow();
    const saved = addSet(sess, e, { ...input, ready: true }, MONDAY + 1800000);
    s.sessions = [saved];
    expect(liftMetrics(s.sessions, "pullup")).toHaveLength(0);
  });
  it("o peso corporal histórico não muda com alterações do perfil", () => {
    const s = session();
    const saved = addSet(
      s,
      s.plan.exercises[0],
      { index: 0, load: 25, amount: 1, rpe: 7, successful: true, ready: false },
      MONDAY + 1800000,
    );
    const profile = state().profile;
    profile.bodyweight = 110;
    expect(liftMetrics([saved], "pullup")[0].total).toBe(125);
    expect(saved.sets[0].bodyweight).toBe(100);
  });
});
