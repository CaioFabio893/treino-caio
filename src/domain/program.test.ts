import { describe, expect, it } from "vitest";
import {
  addSet,
  initialState,
  liftMetrics,
  makePlan,
  startSession,
} from "./engine";
import { accessoryProgression } from "./accessories";
import {
  oapuProtocol,
  PROGRAM_WEEKS,
  ROTATION,
  TRAINING_DAYS,
} from "./program";

describe("programação de força, hipertrofia e one-arm", () => {
  it("mantém três unilaterais, dois dips e dois back squats nos blocos normais", () => {
    for (let week = 1; week < 12; week++) {
      const plans = TRAINING_DAYS.map((day) => makePlan(week, day));
      expect(plans.filter((p) => p.pull).map((p) => p.day)).toEqual([1, 3, 5]);
      expect(
        plans
          .flatMap((p) => p.exercises)
          .filter((e) => ["dip", "dip-volume"].includes(e.id)),
      ).toHaveLength(2);
      expect(
        plans
          .flatMap((p) => p.exercises)
          .filter((e) => ["squat", "paused-squat"].includes(e.id)),
      ).toHaveLength(2);
    }
  });
  it("varia semanalmente a dose pesada e reduz acessórios antes dos testes", () => {
    expect(PROGRAM_WEEKS).toHaveLength(12);
    expect(makePlan(2, 2).exercises[0].rpe).toBeGreaterThan(
      makePlan(1, 2).exercises[0].rpe,
    );
    expect(makePlan(7, 2).exercises[0].reps).toBeLessThan(
      makePlan(1, 2).exercises[0].reps,
    );
    for (const week of [7, 11]) {
      const p = makePlan(week, 4);
      expect(
        p.exercises
          .filter((e) => e.priority > 1)
          .every((e) => e.sets <= 2 && e.rpe <= 6),
      ).toBe(true);
      expect(oapuProtocol(week, 1).rpe).toBeLessThanOrEqual(6.5);
    }
    expect(ROTATION).toContain("Sáb F → Dom descanso");
  });
  it("dip pesado está em C, terra sozinho em D e agachamento pesado em B", () => {
    for (const week of [1, 5, 9, 12]) {
      expect(makePlan(week, 3).exercises[0]).toMatchObject({
        id: "dip",
        progressive: true,
        load: null,
      });
      expect(makePlan(week, 2).exercises[0].id).toBe("squat");
      expect(makePlan(week, 4).exercises[0].id).toBe("deadlift");
    }
    expect(makePlan(5, 3).exercises[1].id).toBe("bench");
    expect(makePlan(5, 6).exercises.map((e) => e.id)).toContain("bench-volume");
    for (const day of [1, 2, 3, 5, 6])
      expect(
        makePlan(5, day).exercises.some((e) => e.id === "deadlift"),
      ).toBe(false);
  });
  it("tem strongman de academia em D e F", () => {
    expect(makePlan(5, 4).exercises.some((e) => e.id === "farmer")).toBe(true);
    const f = makePlan(5, 6).exercises.map((e) => e.id);
    expect(f).toContain("db-clean-press");
    expect(f).toContain("sled-carry");
  });
  it("sugere progressão do dip apenas após execução completa e controlada", () => {
    let session = startSession(initialState(), makePlan(5, 3), 1000);
    const e = session.plan.exercises[0];
    for (let index = 0; index < e.sets; index++)
      session = addSet(
        session,
        e,
        {
          index,
          load: 80,
          amount: e.reps,
          rpe: 7,
          ready: false,
          successful: true,
        },
        2000 + index,
      );
    session = { ...session, finishedAt: 3000 };
    expect(accessoryProgression(e, [session], "next", 2.5)?.load).toBe(82.5);
    const changed = makePlan(6, 3).exercises[0];
    expect(accessoryProgression(changed, [session], "next", 2.5)).toMatchObject(
      { load: 80, amount: 5 },
    );
    expect(session.sets[0].load).toBe(80);
  });
  it("não retoma plano legado como se fosse novo nem altera seus registros", () => {
    const state = initialState();
    const old = startSession(state, makePlan(1, 1), 1000);
    delete old.plan.program;
    old.plan.name = "Pull antigo";
    state.sessions = [old];
    const next = startSession(state, makePlan(1, 1), 2000);
    expect(next.id).not.toBe(old.id);
    expect(next.plan.name).toBe("Treino A");
    expect(old.plan.name).toBe("Pull antigo");
  });
  it("PR do terra é single, exige prontidão na terceira e conta só sucesso", () => {
    const state = initialState();
    const s = startSession(state, makePlan(12, 4), 1000);
    const e = s.plan.exercises[0];
    const input = {
      index: 2,
      load: 100,
      amount: 1,
      rpe: 9,
      ready: false,
      successful: true,
    };
    expect(() => addSet(s, e, input, 2000)).toThrow();
    expect(() =>
      addSet(s, e, { ...input, ready: true, amount: 2 }, 2000),
    ).toThrow();
    const saved = addSet(s, e, { ...input, ready: true }, 2000);
    expect(liftMetrics([saved], "deadlift")[0]).toMatchObject({
      total: 100,
      tested: true,
    });
  });
});
