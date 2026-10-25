import type { Exercise, Plan, Profile } from "./model";

export const HEAVY_PERCENT = [
  75, 77.5, 80, 60, 82.5, 85, 87.5, 65, 90, 92.5, 72.5, 90,
];
const VOLUME_PERCENT = [65, 67.5, 70, 55, 70, 72.5, 75, 60, 75, 77.5, 60, 60];
const PARENTS: Record<string, string> = {
  "pullup-volume": "pullup",
  "dip-volume": "dip",
  "paused-squat": "squat",
};
const MAIN = ["squat", "deadlift", "bench", "pullup", "dip"];

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
    ? 45
    : (e.repsMax ?? e.reps) >= 15
      ? 55
      : 65;
}

export function planLoads(plan: Plan, profile: Profile): Plan {
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
      const calculated = percentLoad(ref.rm, percent, profile.increment, bw);
      const attempts = plan.pr
        ? [90, 95, 100].map((p) => {
            const target = percentLoad(ref.rm, p, profile.increment, bw);
            return { percent: p, ...target, assistance: 0 };
          })
        : undefined;
      return {
        ...e,
        percent,
        rm: ref.rm,
        rmSource: ref.source,
        referenceBodyweight: bw,
        ...(attempts?.[0] ?? calculated),
        attempts,
        note: `${ref.source === "historical" ? "RM histórico provisório: confirme seu RM atual no perfil." : "RM atual informado no perfil."} Percentual é ponto de partida; reduza a carga se exceder RPE ${e.rpe}. Arredondamento conservador ao incremento configurado.${bw ? " Percentual sobre peso corporal + RM de lastro; kg prescritos são lastro ou assistência." : ""}${e.perSide ? " Repetições por lado; carga por mão para halteres." : ""}${e.id === "paused-squat" && !profile.referenceRm?.[e.id] ? " Referência do back squat livre com percentual menor para a pausa." : ""}${plan.pr ? " Tentativas de 90/95/100% são referências; só avance com prontidão. PR acima disso é decisão manual após avaliar a tentativa anterior. Se a abertura percentual ficar abaixo do peso corporal, usa-se peso corporal sem assistência somente se o RPE permitir; o percentual efetivo fica maior que o alvo." : ""}`,
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
