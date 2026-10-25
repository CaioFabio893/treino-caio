import { beforeEach, expect, it, vi } from "vitest";
import { initialState, makePlan, startSession } from "../domain/engine";
import { substitute } from "../domain/accessories";
beforeEach(() => {
  vi.resetModules();
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
  });
  let queue = Promise.resolve();
  vi.stubGlobal("navigator", {
    locks: {
      request: (_key: string, fn: () => void) => {
        queue = queue.then(fn);
        return queue;
      },
    },
  });
});
it("preserva snapshots antigos e substituições novas no mesmo backup", async () => {
  const { decode } = await import("./store");
  const state = initialState();
  const original = startSession(state, makePlan(1, 1));
  const legacy = structuredClone(original);
  legacy.plan.exercises[1] = {
    ...legacy.plan.exercises[1],
    reps: 8,
    repsMax: undefined,
    note: undefined,
  };
  const changed = substitute(
    { ...original, id: `${original.id}:other` },
    "row",
    "row-cable",
  );
  state.sessions = [legacy, changed];
  const restored = decode(JSON.stringify(state));
  expect(restored.sessions[0].plan.exercises[1].id).toBe("row");
  expect(restored.sessions[0].plan.exercises[1].repsMax).toBeUndefined();
  expect(restored.sessions[1].plan.exercises[1].id).toBe("row-cable");
  expect(restored.sessions[1].decisions).toHaveLength(1);
});
it("aceita backup válido e rejeita corrupção e números fora de faixa", async () => {
  const { decode } = await import("./store");
  const s = initialState();
  expect(decode(JSON.stringify(s))).toEqual(s);
  expect(() => decode("{")).toThrow();
  expect(() =>
    decode(JSON.stringify({ ...s, profile: { ...s.profile, bodyweight: 0 } })),
  ).toThrow();
  expect(() => decode(JSON.stringify({ ...s, schema: 7 }))).toThrow();
});
it("persiste duas atualizações sem perder a primeira", async () => {
  const { commit, decode } = await import("./store");
  await Promise.all([
    commit((s) => ({ ...s, profile: { ...s.profile, name: "Atleta" } })),
    commit((s) => ({ ...s, profile: { ...s.profile, bodyweight: 102 } })),
  ]);
  const saved = decode(localStorage.getItem("hybrid-strength:v1")!);
  expect(saved.profile.name).toBe("Atleta");
  expect(saved.profile.bodyweight).toBe(102);
});
it("duas tentativas de início sob lock resultam em uma sessão", async () => {
  const { commit, decode } = await import("./store");
  const now = new Date("2026-10-19T18:30:00-03:00").getTime();
  await commit((s) => ({
    ...s,
    profile: { ...s.profile, cycleStart: "2026-10-19" },
  }));
  const begin = () =>
    commit((s) => {
      const session = startSession(s, makePlan(1, 1), now);
      return s.sessions.some((x) => x.id === session.id)
        ? s
        : { ...s, sessions: [...s.sessions, session] };
    });
  await Promise.all([begin(), begin()]);
  expect(
    decode(localStorage.getItem("hybrid-strength:v1")!).sessions,
  ).toHaveLength(1);
});
it("erro de armazenamento não é reportado como sucesso", async () => {
  const { commit } = await import("./store");
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  });
  await expect(commit((s) => s)).rejects.toThrow("QuotaExceededError");
});
it("preserva snapshots antigos e mais de um treino em andamento", async () => {
  const { decode } = await import("./store");
  const state = initialState();
  const legacy = startSession(state, makePlan(1, 1), Date.now());
  legacy.id = "registro-anterior";
  legacy.plan.name = "Pull 01";
  legacy.restUntil = Date.now() + 120000;
  const other = startSession(state, makePlan(1, 5), Date.now());
  state.sessions = [legacy, other];
  expect(decode(JSON.stringify(state))).toEqual(state);
});
