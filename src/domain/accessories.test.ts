import { describe, expect, it } from "vitest";
import {
  accessoryProgression,
  reducePushVolume,
  substitute,
} from "./accessories";
import { addSet, initialState, makePlan, startSession } from "./engine";
import type { Readiness } from "./model";

function execution(id = "row", amount = 12, rpe = 7, count?: number) {
  let s = startSession(initialState(), makePlan(3, 1), 100000);
  if (id === "farmer")
    s.plan.exercises.push({
      ...s.plan.exercises[1],
      id: "farmer",
      name: "Farmer",
      sets: 3,
      reps: 30,
      repsMax: 40,
      rpe: 7,
      unit: "meters",
    });
  const e = s.plan.exercises.find((x) => x.id === id)!;
  for (let index = 0; index < (count ?? e.sets); index++)
    s = addSet(
      s,
      e,
      { index, load: 20, amount, rpe, successful: true, ready: false },
      100001 + index,
    );
  return { ...s, finishedAt: 200000 };
}
const target = makePlan(3, 1).exercises.find((e) => e.id === "row")!;
const recovery: Readiness = {
  id: "r",
  date: "2026-10-18",
  sleep: 8,
  stress: 2,
  fatigue: 2,
  pain: 0,
  location: "",
  notes: "",
};

describe("acessórios por bloco e progressão optativa", () => {
  it("mantém a variação no bloco e muda no bloco seguinte sem mudar os lifts", () => {
    expect(makePlan(1, 1).exercises.map((e) => e.id)).toEqual(
      makePlan(3, 1).exercises.map((e) => e.id),
    );
    expect(makePlan(5, 1).exercises[1].id).toBe("row-cable");
    expect(makePlan(5, 1).exercises[0].id).toBe("pullup");
    expect(makePlan(5, 1).exercises[0].sets).toBe(4);
  });
  it("reduz acessórios no deload, peaking, taper e os retira dos testes PR", () => {
    expect(makePlan(7, 1).exercises[1]).toMatchObject({ sets: 2, rpe: 6 });
    expect(makePlan(9, 1).exercises[1].sets).toBe(4);
    expect(makePlan(11, 1).exercises[1].sets).toBe(2);
    expect(makePlan(12, 1).exercises.map((e) => e.id)).toEqual(["pullup"]);
  });
  it("propõe um incremento e volta à base apenas com todas as séries no topo", () => {
    const s = execution();
    expect(accessoryProgression(target, [s], "new", 2.5)).toMatchObject({
      load: 22.5,
      amount: 8,
    });
    expect(s.sets[0].load).toBe(20);
  });
  it("mantém a carga e progride repetições quando ainda não atingiu o topo", () => {
    expect(
      accessoryProgression(target, [execution("row", 10)], "new", 2.5),
    ).toMatchObject({ load: 20, amount: 11 });
  });
  it("não aumenta com registro parcial, falha, RPE alto ou cargas diferentes", () => {
    const failed = execution();
    failed.sets[0].successful = false;
    const varied = execution();
    varied.sets[1].load = 22.5;
    for (const s of [
      execution("row", 12, 8, 2),
      failed,
      execution("row", 12, 9),
      varied,
    ])
      expect(accessoryProgression(target, [s], "new", 2.5)?.load).toBeNull();
  });
  it("bloqueia sugestões por dor, sono baixo, fadiga ou semana de redução", () => {
    for (const r of [
      { ...recovery, pain: 4 },
      { ...recovery, sleep: 5 },
      { ...recovery, fatigue: 8 },
    ])
      expect(
        accessoryProgression(target, [execution()], "new", 2.5, r)?.load,
      ).toBeNull();
    expect(
      accessoryProgression({ ...target, rpe: 6 }, [execution()], "new", 2.5)
        ?.load,
    ).toBeNull();
  });
  it("não usa sessão aberta, a própria sessão ou histórico de outra variação", () => {
    const s = execution();
    expect(
      accessoryProgression(target, [{ ...s, finishedAt: null }], "new", 2.5),
    ).toBeNull();
    expect(accessoryProgression(target, [s], s.id, 2.5)).toBeNull();
    expect(
      accessoryProgression({ ...target, id: "row-cable" }, [s], "new", 2.5),
    ).toBeNull();
  });
  it("troca sem transferir carga ou apagar histórico e bloqueia troca após série", () => {
    const s = startSession(initialState(), makePlan(1, 1));
    const changed = substitute(s, "row", "row-cable");
    expect(changed.plan.exercises[1]).toMatchObject({
      id: "row-cable",
      load: null,
    });
    expect(s.plan.exercises[1].id).toBe("row");
    expect(changed.decisions).toHaveLength(1);
    expect(() => substitute(execution(), "row", "row-cable")).toThrow();
    const active = { ...execution(), finishedAt: null };
    expect(() => substitute(active, "row", "row-cable")).toThrow();
  });
  it("farmer progride distância antes da carga, mantendo a unidade metros", () => {
    const e = execution("farmer", 35, 7).plan.exercises.find(
      (x) => x.id === "farmer",
    )!;
    expect(
      accessoryProgression(e, [execution("farmer", 35, 7)], "new", 2.5),
    ).toMatchObject({ load: 20, amount: 36 });
    expect(
      accessoryProgression(e, [execution("farmer", 40, 7)], "new", 2.5),
    ).toMatchObject({ load: 22.5, amount: 30 });
  });
  it("reduz dip por escolha, preserva squat/supino e bloqueia alteração de séries registradas", () => {
    const s = startSession(initialState(), makePlan(1, 6));
    const next = reducePushVolume(s);
    expect(next.plan.exercises.find((e) => e.id === "dip-volume")?.sets).toBe(
      2,
    );
    expect(next.plan.exercises.filter((e) => e.id !== "dip-volume")).toEqual(
      s.plan.exercises.filter((e) => e.id !== "dip-volume"),
    );
    expect(() => reducePushVolume(next)).toThrow();
  });
});
