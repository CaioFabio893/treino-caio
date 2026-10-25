import { describe, expect, it } from "vitest";
import {
  addSet,
  initialState,
  liftMetrics,
  makePlan,
  startSession,
} from "./engine";
import { loadDescription, percentLoad, planLoads } from "./loads";
import { substitute } from "./accessories";

describe("prescrição por %RM e RPE", () => {
  it("calcula kg em cada semana mantendo o RPE planejado", () => {
    const profile = initialState().profile;
    profile.referenceRm = { squat: 200 };
    expect(makePlan(1, 2, profile).exercises[0]).toMatchObject({
      percent: 75,
      load: 150,
      rpe: 7,
      rm: 200,
      rmSource: "current",
    });
    expect(makePlan(4, 2, profile).exercises[0]).toMatchObject({
      percent: 60,
      load: 120,
      rpe: 6,
    });
    expect(makePlan(10, 2, profile).exercises[0]).toMatchObject({
      percent: 92.5,
      load: 185,
      rpe: 8.5,
    });
  });
  it("marca o histórico como provisório e prioriza RM atual sem mudar o histórico", () => {
    const profile = initialState().profile;
    expect(makePlan(1, 3, profile).exercises[0]).toMatchObject({
      load: 127.5,
      rmSource: "historical",
    });
    profile.referenceRm = { bench: 120 };
    expect(makePlan(1, 3, profile).exercises[0]).toMatchObject({
      load: 90,
      rmSource: "current",
    });
    expect(profile.historical.bench).toBe(170);
  });
  it("usa PC + RM do lastro, não percentual só do lastro", () => {
    expect(percentLoad(40, 75, 2.5, 100)).toEqual({ load: 5, assistance: 0 });
    const p = initialState().profile;
    expect(makePlan(1, 1, p).exercises[0]).toMatchObject({
      load: 5,
      referenceBodyweight: 100,
      rm: 40,
    });
  });
  it("indica assistência quando a meta fica abaixo do PC, sem lastro negativo", () => {
    expect(percentLoad(40, 60, 2.5, 100)).toEqual({
      load: 0,
      assistance: 17.5,
    });
    const e = makePlan(4, 1, initialState().profile).exercises[0];
    expect(loadDescription(e)).toContain("Assistência 17.5");
  });
  it("arredonda a carga para baixo e a assistência para cima", () => {
    expect(percentLoad(173, 75, 2.5).load).toBe(127.5);
    expect(() => percentLoad(100, 105, 2.5)).toThrow();
    expect(() => percentLoad(NaN, 75, 2.5)).toThrow();
    expect(() => percentLoad(100, 75, 0)).toThrow();
  });
  it("acessórios só ganham kg com RM próprio e não copiam RM de outro exercício", () => {
    const profile = initialState().profile;
    expect(makePlan(1, 1, profile).exercises[1].load).toBeNull();
    profile.referenceRm = { row: 100 };
    expect(makePlan(1, 1, profile).exercises[1]).toMatchObject({
      load: 65,
      percent: 65,
    });
    expect(makePlan(5, 1, profile).exercises[1].load).toBeNull();
  });
  it("remove metadados de RM ao apagar referência ou trocar variação", () => {
    const profile = initialState().profile;
    profile.referenceRm = { row: 100 };
    const plan = makePlan(1, 1, profile);
    const cleared = planLoads(plan, { ...profile, referenceRm: {} });
    expect(cleared.exercises[1]).toMatchObject({
      load: null,
      rm: undefined,
      rmSource: undefined,
    });
    const s = startSession(initialState(), plan, 1000);
    const changed = substitute(s, "row", "row-cable");
    expect(changed.plan.exercises[1].rm).toBeUndefined();
    expect(plan.exercises[1].rm).toBe(100);
  });
  it("usa RM do squat no pausado com % menor, permitindo RM específico", () => {
    const p = initialState().profile;
    p.referenceRm = { squat: 200 };
    expect(makePlan(1, 6, p).exercises[0]).toMatchObject({
      rm: 200,
      percent: 60,
      load: 120,
    });
    p.referenceRm["paused-squat"] = 150;
    expect(makePlan(1, 6, p).exercises[0].load).toBe(90);
  });
  it("PR tem referências 90/95/100%, sem 105% automático", () => {
    const p = initialState().profile;
    p.referenceRm = { bench: 100 };
    expect(makePlan(12, 3, p).exercises[0].attempts).toEqual([
      { percent: 90, load: 90, assistance: 0 },
      { percent: 95, load: 95, assistance: 0 },
      { percent: 100, load: 100, assistance: 0 },
    ]);
  });
  it("série assistida não vira recorde de barra com lastro", () => {
    const state = initialState();
    const s = startSession(state, makePlan(4, 1, state.profile), 1000);
    const e = s.plan.exercises[0];
    const log = {
      index: 0,
      load: 0,
      assistance: 17.5,
      amount: 5,
      rpe: 6,
      successful: true,
      ready: false,
    };
    const saved = addSet(s, e, log, 2000);
    expect(saved.sets[0].assistance).toBe(17.5);
    expect(liftMetrics([saved], "pullup")).toEqual([]);
    expect(() => addSet(s, e, { ...log, load: 10 }, 2000)).toThrow();
    expect(() => addSet(s, e, { ...log, assistance: 200 }, 2000)).toThrow();
  });
  it("preserva a prescrição da sessão após editar o perfil", () => {
    const state = initialState();
    state.profile.referenceRm = { bench: 100 };
    const session = startSession(state, makePlan(1, 3, state.profile), 1000);
    state.profile.referenceRm.bench = 200;
    expect(session.plan.exercises[0].load).toBe(75);
    expect(makePlan(1, 3, state.profile).exercises[0].load).toBe(150);
  });
});
