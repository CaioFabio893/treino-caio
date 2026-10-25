import type { Exercise, Readiness, Session } from "./model";

// IDs originais continuam representando o mesmo exercício nos backups antigos.
const GROUPS = [
  [
    ["row", "Remada apoiada"],
    ["row-cable", "Remada baixa na polia"],
  ],
  [
    ["curl", "Rosca bíceps"],
    ["curl-hammer", "Rosca martelo"],
  ],
  [["facepull", "Facepull"]],
  [["extension", "Cadeira extensora"]],
  [
    ["lateral", "Elevação lateral"],
    ["lateral-cable", "Elevação lateral na polia"],
  ],
  [["farmer", "Farmer’s Walk"]],
  [
    ["row-single", "Remada serrote"],
    ["row-single-cable", "Remada unilateral na polia"],
  ],
  [
    ["reverse", "Crucifixo invertido"],
    ["reverse-machine", "Crucifixo invertido na máquina"],
  ],
  [
    ["lunge", "Passadas com halteres"],
    ["split-squat", "Agachamento dividido com halteres"],
  ],
  [
    ["hamstring", "Mesa flexora"],
    ["hamstring-seated", "Cadeira flexora"],
  ],
  [
    ["plank", "Prancha com carga"],
    ["plank-long", "Prancha com alavanca longa"],
  ],
] as const;

export function alternatives(e: Exercise) {
  return GROUPS.find((group) => group.some(([id]) => id === e.id)) ?? [];
}

export function varyAccessories(exercises: Exercise[], week: number) {
  const block = Math.floor((week - 1) / 4);
  return exercises.map((e) => {
    const group = alternatives(e);
    if (!group.length) return e;
    const [id, name] = group[block % group.length];
    const ranges: Record<string, [number, number]> = {
      row: [8, 12],
      curl: [10, 15],
      facepull: [12, 20],
      extension: [10, 15],
      lateral: [12, 20],
      farmer: [30, 40],
      "row-single": [8, 12],
      reverse: [12, 20],
      lunge: [8, 12],
      hamstring: [10, 15],
      plank: [30, 45],
    };
    const [reps, repsMax] = ranges[e.id];
    const reduced = [4, 8, 9, 10, 11].includes(week);
    return {
      ...e,
      id,
      name,
      reps,
      repsMax,
      sets: week === 11 ? 1 : reduced ? Math.min(2, e.sets) : e.sets,
      rpe: [4, 8, 11].includes(week) ? 6 : e.rpe,
      note: `Bloco ${block + 1}: mantenha esta variação durante quatro semanas. Complete a faixa antes de aumentar a carga. Carga de outra variação não é transferida.${e.perSide ? " Quantidade por lado; carga dos halteres por mão." : e.id === "farmer" ? " Distância por percurso; carga por mão." : ""}`,
    };
  });
}

export function substitute(
  session: Session,
  exerciseId: string,
  variantId: string,
): Session {
  if (session.finishedAt !== null) throw new Error("Sessão finalizada.");
  const original = session.plan.exercises.find((e) => e.id === exerciseId);
  const variant =
    original && alternatives(original).find(([id]) => id === variantId);
  if (!original || !variant) throw new Error("Substituição inválida.");
  if (session.sets.some((s) => s.exerciseId === exerciseId))
    throw new Error(
      "Este exercício já tem séries. Preserve o registro e troque na próxima sessão.",
    );
  if (variantId === exerciseId) return session;
  return {
    ...session,
    plan: {
      ...session.plan,
      exercises: session.plan.exercises.map((e) =>
        e.id === exerciseId
          ? {
              ...e,
              id: variant[0],
              name: variant[1],
              load: null,
              rm: undefined,
              rmSource: undefined,
              referenceBodyweight: undefined,
              assistance: 0,
              attempts: undefined,
              note: "Variação nova: informe seu RM próprio no perfil ou defina a carga pelo RPE. Não transferir carga ou RM de outra máquina.",
            }
          : e,
      ),
    },
    decisions: [
      ...session.decisions,
      {
        at: Date.now(),
        reason:
          "Substituição escolhida antes das séries; histórico separado por variação.",
        decision: `${original.name} → ${variant[1]}`,
      },
    ],
  };
}

export function reducePushVolume(session: Session): Session {
  if (session.finishedAt !== null || session.plan.pr)
    throw new Error(
      "Redução disponível apenas na sessão de volume em andamento.",
    );
  const e = session.plan.exercises.find((x) => x.id === "dip-volume");
  if (!e || e.sets <= 2 || session.sets.some((s) => s.exerciseId === e.id))
    throw new Error("Reduza antes de registrar as séries de dip.");
  return {
    ...session,
    plan: {
      ...session.plan,
      exercises: session.plan.exercises.map((x) =>
        x.id === e.id ? { ...x, sets: 2 } : x,
      ),
    },
    decisions: [
      ...session.decisions,
      {
        at: Date.now(),
        reason: "Ajuste opcional de recuperação do dip de volume.",
        decision: "Dip de volume reduzido para 2 séries.",
      },
    ],
  };
}

export function accessoryProgression(
  e: Exercise,
  sessions: Session[],
  currentId: string,
  increment: number,
  recovery?: Readiness,
) {
  if (!alternatives(e).length && !e.progressive && e.priority === 0)
    return null;
  const previous = sessions
    .filter(
      (s) =>
        s.id !== currentId &&
        s.finishedAt !== null &&
        s.sets.some((x) => x.exerciseId === e.id),
    )
    .sort((a, b) => b.finishedAt! - a.finishedAt!)[0];
  if (!previous) return null;
  const prescription = previous.plan.exercises.find((x) => x.id === e.id)!;
  const sets = previous.sets
    .filter((x) => x.exerciseId === e.id)
    .sort((a, b) => a.index - b.index);
  const summary = sets
    .map(
      (s) =>
        `${s.load} kg × ${s.amount} ${e.unit === "meters" ? "m" : e.unit === "seconds" ? "s" : "reps"} (RPE ${s.rpe})`,
    )
    .join("; ");
  const base = {
    summary,
    load: null as number | null,
    amount: e.reps,
    reason: "",
  };
  if (
    prescription.unit !== e.unit ||
    Boolean(prescription.perSide) !== Boolean(e.perSide)
  )
    return {
      ...base,
      reason: "Medição diferente: defina a carga manualmente.",
    };
  if ((recovery?.pain ?? 0) > 3)
    return {
      ...base,
      reason:
        "Dor acima de 3/10: sem sugestão de progressão. Evite o movimento provocador.",
    };
  const load = sets[0].load;
  if (
    sets.length !== prescription.sets ||
    (!e.progressive && sets.length < e.sets) ||
    sets.some(
      (s, i) =>
        s.index !== i ||
        !s.successful ||
        s.load !== load ||
        (s.assistance ?? 0) > 0,
    ) ||
    (e.assistance ?? 0) > 0
  )
    return {
      ...base,
      reason:
        "Registro parcial, falha ou cargas diferentes: complete uma execução consistente antes de progredir.",
    };
  if (sets.some((s) => s.rpe > e.rpe || s.amount < e.reps))
    return {
      ...base,
      reason:
        "Esforço acima do alvo ou quantidade insuficiente: ajuste manualmente para baixo antes de progredir.",
    };
  if (
    (recovery?.sleep ?? 8) < 6 ||
    (recovery?.fatigue ?? 0) >= 7 ||
    (recovery?.stress ?? 0) >= 8 ||
    e.rpe <= 6
  )
    return {
      ...base,
      reason:
        "Recuperação baixa ou semana de redução: não aumentar automaticamente; escolha uma carga mais leve.",
    };
  const top = e.repsMax ?? e.reps;
  if (
    e.progressive &&
    (e.reps !== prescription.reps || e.sets !== prescription.sets)
  )
    return {
      ...base,
      load,
      reason:
        "A dose mudou nesta semana: use a carga anterior apenas como referência e ajuste pelo novo RPE. Sem aumento automático pela troca de semana.",
    };
  const increase = prescription.rpe > 6 && sets.every((s) => s.amount >= top);
  if (
    increase &&
    (!Number.isFinite(increment) || increment <= 0 || load + increment > 1000)
  )
    return {
      ...base,
      reason: "Confira o incremento de carga nas configurações.",
    };
  return {
    ...base,
    load: increase ? Math.round((load + increment) * 1000) / 1000 : load,
    amount: increase
      ? e.reps
      : Math.min(top, Math.min(...sets.map((s) => s.amount)) + 1),
    reason: increase
      ? "Todas as séries chegaram ao topo da faixa dentro do RPE. Aumento opcional de um incremento; retorne ao início da faixa."
      : "Mantenha a carga e avance a quantidade dentro da faixa, respeitando o RPE.",
  };
}
