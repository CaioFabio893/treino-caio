import type { Exercise, Plan, Profile, Session } from "./model";

export const HEAVY_PERCENT = [
  60, 62.5, 65, 50, 67.5, 70, 72.5, 55, 75, 77.5, 60, 80,
];
const VOLUME_PERCENT = [55, 57.5, 60, 45, 60, 62.5, 65, 50, 65, 67.5, 50, 55];
const PARENTS: Record<string, string> = {
  "pullup-volume": "pullup",
  "dip-volume": "dip",
  "paused-squat": "squat",
};
const MAIN = ["squat", "deadlift", "bench", "pullup", "dip"];

export function gradualLoad(
  e: Exercise,
  plan: Plan,
  profile: Profile,
  sessions: Session[],
  rm: number,
  scheduled: { load: number; assistance: number },
) {
  const bw = e.weighted ? profile.bodyweight : 0;
  const baseline = percentLoad(rm, percentageFor(e, 1), profile.increment, bw);
  const prior = sessions
    .filter(
      (s) =>
        s.finishedAt !== null &&
        s.plan.program === plan.program &&
        s.id.startsWith(`${profile.cycleStart}:`) &&
        s.plan.exercises.some((x) => x.id === e.id) &&
        s.sets.some((x) => x.exerciseId === e.id),
    )
    .sort((a, b) => b.finishedAt! - a.finishedAt!)[0];
  if (!prior) {
    const target =
      scheduled.load - scheduled.assistance <=
      baseline.load - baseline.assistance
        ? scheduled
        : baseline;
    return {
      target,
      reason:
        "Sem execução recente registrada deste movimento: manter a carga leve da primeira semana, mesmo ao selecionar semanas posteriores.",
    };
  }
  const old = prior.plan.exercises.find((x) => x.id === e.id)!;
  const logs = prior.sets
    .filter((x) => x.exerciseId === e.id)
    .sort((a, b) => a.index - b.index);
  const net = Math.min(...logs.map((x) => x.load - (x.assistance ?? 0)));
  const complete =
    logs.length === old.sets &&
    logs.every(
      (x, i) =>
        x.index === i &&
        x.successful &&
        x.amount >= (old.repsMax ?? old.reps) &&
        x.rpe <= Math.min(old.rpe, e.rpe) &&
        x.rpe <= 8 &&
        x.load === logs[0].load &&
        (x.assistance ?? 0) === (logs[0].assistance ?? 0),
    );
  const changedBw = e.weighted && prior.bodyweight !== profile.bodyweight;
  const step =
    complete && !changedBw && profile.increment <= 2.5 ? profile.increment : 0;
  let ceiling = changedBw
    ? Math.min(net, baseline.load - baseline.assistance)
    : net + step;
  if (logs.some((x) => !x.successful || x.rpe >= e.rpe + 1)) {
    const effective = (bw + net) * 0.95 - bw;
    ceiling = Math.min(
      ceiling,
      Math.floor((effective + 1e-8) / profile.increment) * profile.increment,
    );
  }
  const requested = scheduled.load - scheduled.assistance;
  const capped = Math.min(requested, ceiling);
  return {
    target:
      capped < 0
        ? { load: 0, assistance: Math.min(bw, -capped) }
        : { load: capped, assistance: 0 },
    reason: step
      ? "Aumento limitado a um incremento (máximo 2,5 kg), após execução completa dentro do RPE; o calendário não autoriza saltos."
      : "Sem critérios para aumentar: carga mantida ou reduzida. Complete a dose com controle e dentro do RPE antes de subir.",
  };
}

export function referenceFor(e: Exercise, profile: Profile) {
  const own = profile.referenceRm?.[e.id];
  const parent = PARENTS[e.id] ?? e.id;
  const current = own ?? profile.referenceRm?.[parent];
  if (current !== undefined && Number.isFinite(current) && current > 0)
    return { rm: current, source: "current" as const };
  if (MAIN.includes(parent)) {
    const rm = profile.historical[parent as keyof Profile["historical"]];
    if (Number.isFinite(rm) && rm > 0)
      return { rm, source: "historical" as const };
  }
  return null;
}

// Nunca arredondar para cima da carga percentual proposta.
export function percentLoad(
  rm: number,
  percent: number,
  increment: number,
  bodyweight = 0,
) {
  if (
    ![rm, percent, increment, bodyweight].every(Number.isFinite) ||
    rm <= 0 ||
    percent <= 0 ||
    percent > 100 ||
    increment <= 0 ||
    bodyweight < 0
  )
    throw new Error("RM, percentual ou incremento inválido.");
  const external = ((rm + bodyweight) * percent) / 100 - bodyweight;
  const load = Math.max(
    0,
    Math.floor((external + 1e-8) / increment) * increment,
  );
  const assistance =
    external < 0
      ? Math.min(
          bodyweight,
          Math.ceil((-external - 1e-8) / increment) * increment,
        )
      : 0;
  return {
    load: Number(load.toFixed(3)),
    assistance: Number(assistance.toFixed(3)),
  };
}

export function percentageFor(e: Exercise, week: number) {
  if (MAIN.includes(e.id)) return HEAVY_PERCENT[week - 1];
  if (e.id === "paused-squat") return VOLUME_PERCENT[week - 1] - 5;
  if (e.id === "pullup-volume" || e.id === "dip-volume")
    return VOLUME_PERCENT[week - 1];
  if (e.id === "overhead-press")
    return [4, 8, 11, 12].includes(week) ? 55 : week < 5 ? 67.5 : 70;
  // Acessórios: faixa mais alta de reps usa referência mais leve, sempre subordinada ao RPE.
  return [4, 8, 11, 12].includes(week)
    ? 40
    : (e.repsMax ?? e.reps) >= 15
      ? 50
      : 55;
}

export function planLoads(
  plan: Plan,
  profile: Profile,
  sessions?: Session[],
): Plan {
  return {
    ...plan,
    exercises: plan.exercises.map((e) => {
      const ref = referenceFor(e, profile);
      const percent = percentageFor(e, plan.week);
      if (!ref)
        return {
          ...e,
          percent,
          load: null,
          rm: undefined,
          rmSource: undefined,
          referenceBodyweight: undefined,
          assistance: 0,
          attempts: undefined,
          note: `Informe o RM deste exercício no perfil para calcular kg; até lá, escolha a carga pelo RPE.${e.perSide ? " Quantidade por lado; carga por mão para halteres." : ""}`,
        };
      const bw = e.weighted ? profile.bodyweight : 0;
      let calculated = percentLoad(ref.rm, percent, profile.increment, bw);
      let capNote = "";
      if (sessions !== undefined) {
        const limited = gradualLoad(
          e,
          plan,
          profile,
          sessions,
          ref.rm,
          calculated,
        );
        calculated = limited.target;
        capNote = limited.reason;
      }
      const attempts = undefined;
      return {
        ...e,
        percent:
          sessions !== undefined
            ? Number(
                (
                  ((bw + calculated.load - calculated.assistance) /
                    (bw + ref.rm)) *
                  100
                ).toFixed(2),
              )
            : percent,
        scheduledPercent: percent,
        rm: ref.rm,
        rmSource: ref.source,
        referenceBodyweight: bw,
        ...calculated,
        attempts,
        note: `${ref.source === "historical" ? "RM histórico provisório: confirme seu RM atual no perfil." : "RM atual informado no perfil."} Percentual é ponto de partida; reduza a carga se exceder RPE ${e.rpe}. Comece confortável; não force a carga para cumprir o calendário. ${capNote} Arredondamento conservador ao incremento configurado.${bw ? " Percentual sobre peso corporal + RM de lastro; kg prescritos são lastro ou assistência." : ""}${e.perSide ? " Repetições por lado; carga por mão para halteres." : ""}${e.id === "paused-squat" && !profile.referenceRm?.[e.id] ? " Referência do back squat livre com percentual menor para a pausa." : ""}${plan.pr ? " Janela opcional de teste: sem escalada automática para 100% do RM antigo. Escolha cada tentativa pelo desempenho recente e prontidão; pode repetir uma carga confortável em vez de testar PR." : ""}`,
      };
    }),
  };
}

export function loadDescription(e: Exercise) {
  if (e.load === null) return "Informe o RM ou defina pelo RPE";
  if ((e.assistance ?? 0) > 0)
    return `Assistência ${e.assistance} kg · lastro 0 kg`;
  return `${e.weighted ? "+" : ""}${e.load} kg`;
}
