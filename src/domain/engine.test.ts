import { describe, expect, it } from "vitest";
import {
  addSet,
  budget,
  currentWeek,
  e1rm,
  elapsed,
  estimate,
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
describe("ciclo e orçamento temporal", () => {
  it("gera 60 prescrições válidas com Pull somente seg/qua/sex", () => {
    const plans = Array.from({ length: 12 }, (_, i) =>
      [1, 2, 3, 4, 5].map((d) => makePlan(i + 1, d)),
    ).flat();
    expect(plans).toHaveLength(60);
    for (const p of plans) {
      expect(p.pull).toBe([1, 3, 5].includes(p.day));
      expect(p.valid).toBe(true);
      expect(p.estimatedSeconds).toBeLessThanOrEqual(4800);
    }
    expect(() => makePlan(1, 0)).toThrow();
    expect(() => makePlan(1, 6)).toThrow();
  });
  it("preserva o microciclo inicial e identifica o supino como complementar", () => {
    const mon = makePlan(1, 1);
    expect(mon.exercises[0]).toMatchObject({
      id: "pullup",
      sets: 4,
      reps: 6,
      load: 10,
      rpe: 7,
    });
    expect(makePlan(1, 2).exercises[0].load).toBe(130);
    expect(makePlan(1, 5).exercises[0].load).toBe(145);
    expect(
      makePlan(1, 4).exercises.find((e) => e.id === "bench")?.lift,
    ).toBeUndefined();
  });
  it("deload e taper reduzem séries e esforço sem mexer no teto dos dias de volume", () => {
    expect(makePlan(4, 1).exercises[0]).toMatchObject({
      sets: 3,
      reps: 5,
      rpe: 6,
    });
    expect(makePlan(8, 5).exercises[0]).toMatchObject({
      sets: 3,
      reps: 3,
      rpe: 6,
    });
    expect(makePlan(11, 2).exercises[0]).toMatchObject({
      sets: 2,
      reps: 2,
      rpe: 7,
    });
    expect(makePlan(7, 3).exercises[0].rpe).toBe(7);
    expect(makePlan(7, 4).exercises[0].reps).toBe(8);
  });
  it("S12 tem um teste por dia e quarta exclusivamente técnica", () => {
    expect(makePlan(12, 1).exercises[0].id).toBe("pullup");
    expect(makePlan(12, 2).exercises[0].id).toBe("squat");
    expect(makePlan(12, 3).exercises).toHaveLength(0);
    expect(makePlan(12, 4).exercises[0].id).toBe("dip");
    expect(makePlan(12, 5).exercises[0].id).toBe("deadlift");
  });
  it("remove acessórios por prioridade e preserva aquecimento, rampas e OAPU", () => {
    const p = makePlan(1, 1);
    const main = p.exercises[0];
    const result = budget(p.exercises, true, estimate([main], true));
    expect(result.exercises.map((e) => e.id)).toEqual(["pullup"]);
    expect(result.removed[0]).toBe("Facepull");
    expect(result.estimatedSeconds).toBe(1800 + 300 + 4 * 6 * 4 + 3 * 180 + 60);
    expect(result.valid).toBe(true);
    expect(budget([main], true, 1800).valid).toBe(false);
  });
  it("aceita exatamente 80 minutos e sinaliza o que não pode reduzir", () => {
    const e = {
      ...makePlan(1, 1).exercises[0],
      sets: 1,
      reps: 10,
      rest: 0,
      ramp: 2900,
    };
    expect(budget([e], true).estimatedSeconds).toBe(4800);
    expect(budget([{ ...e, ramp: 2901 }], true).valid).toBe(false);
  });
  it("calendário considera segunda e dias civis, não diferença de horário/DST", () => {
    expect(monday(new Date("2026-10-18T12:00:00"))).toBe("2026-10-12");
    expect(currentWeek("2026-10-19", "2026-10-26")).toBe(2);
    expect(currentWeek("2026-10-19", "2026-12-28")).toBe(11);
  });
});
describe("sessões reais", () => {
  it("permite iniciar em qualquer dia, incluindo fim de semana e qualquer semana", () => {
    const saturday = new Date("2026-10-17T18:30:00-03:00").getTime();
    expect(startSession(state(), makePlan(1, 1), saturday).date).toBe(
      "2026-10-17",
    );
    expect(startSession(state(), makePlan(2, 1), MONDAY).id).toBe(
      "2026-10-19:w2:d1",
    );
    expect(startSession(state(), makePlan(1, 2), MONDAY).id).toBe(
      "2026-10-19:w1:d2",
    );
  });
  it("retoma a mesma sessão e não abre duas ativas", () => {
    const s = state();
    const first = session();
    s.sessions = [first];
    expect(startSession(s, makePlan(1, 1), MONDAY)).toEqual(first);
    expect(() => startSession(s, makePlan(1, 2), MONDAY + 86400000)).toThrow();
  });
  it("primeiros 30 min de Pull bloqueiam força; limite exato libera", () => {
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
    expect(() => addSet(s, e, input, MONDAY + 1799999)).toThrow();
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
