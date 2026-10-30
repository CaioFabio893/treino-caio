# Periodização v5 — retorno, one-arm e strongman de academia

Programa `oapu-strength-waves-v5`. Substitui a distribuição A–F e as ondas da v4; `waves-v4` e anteriores permanecem no histórico sem migração. Fonte de verdade das cargas: `src/domain/waves.ts`.

## Semana
| Dia | Treino | Conteúdo |
|---|---|---|
| Seg | A | One-arm força, barra lastrada pesada, remada, rosca, hang isométrico |
| Ter | B | Back squat pesado, leg press, extensora, panturrilha em pé |
| Qua | C | One-arm técnico leve, dip pesado, desenvolvimento, supino inclinado com halteres, lateral, tríceps |
| Qui | D | Terra (convencional ou trap bar) sozinho, terra romeno, flexora, farmer walk, abdômen |
| Sex | E | One-arm volume excêntrico, barra de volume, puxada neutra, remada unilateral, facepull, rosca |
| Sáb | F | Dip de volume, squat pausado, clean and press com halteres, sled/carry, lateral, tríceps overhead |
| Dom | — | Descanso |

Frequências: one-arm 3× (A/C/E), dip 2× (C/F), agachamento 2× (B/F), terra 1× em dia próprio. Strongman de academia: farmer walk, clean and press com halteres, sled push/drag ou carry com sandbag/anilha.

## Fases
S1–3 reentrada (60 → 65%, RPE 6–7; o app já estava na S2 de retorno leve), S4–6 acumulação, S7 deload, S8–10 força/pico, S11 deload e taper, S12 teste conservador. Antes da S12, o histórico dita o teto de carga (aumento máximo de um incremento por execução completa); o calendário não força saltos.

## Percentuais e RPE (% do 1RM de cada movimento)
Pesados (squat, dip lastrado, barra lastrada):

| S | Prescrição |
|---|---|
|1|4×6 60% RPE 6|
|2|4×6 62,5% RPE 6,5|
|3|4×6 65% RPE 7|
|4|4×6 67,5% RPE 7|
|5|4×6 70% RPE 7,5|
|6|5×5 72,5% RPE 8|
|7|3×5 60% RPE 6 (deload)|
|8|5×4 77,5% RPE 8|
|9|5×3 80% RPE 8,5|
|10|1×3 85% RPE 9 + 3×4 77,5% RPE 8|
|11|3×3 65% RPE 6 (deload)|
|12|85% RPE 7 → 92,5% RPE 9 → 95% RPE 9,5 (3ª só com prontidão)|

Volume (squat pausado, dip e barra de volume): 3×8 de 52,5% a 65% (S1–6, RPE 6 a 7,5); S7 2×6 50%; S8 3×6 67,5%; S9 3×6 70%; S10 3×5 72,5%; S11 2×4 55%; S12 sem volume.

Terra: 3×5 55/60/62,5/65%, 3×4 70%, 4×4 75%, S7 2×4 60%, 4×3 77,5%, 4×3 80%, S10 1×3 85% + 2×3 77,5%, S11 2×3 60%, S12 igual aos pesados.

Desenvolvimento: 3×8 55/57,5/60/60%, 4×6 65/67,5%, S7 2×6 52,5%, 4×5 72,5%, 4×4 75%, 4×3 80%, S11 2×4 60%.

One-arm: sem % (não há RM bilateral para unilateral). RPE e assistência mandam; ao completar todas as séries no RPE, reduzir cerca de 2,5% do peso corporal de assistência na semana seguinte. Detalhes por semana em `oapuProtocol` (`program.ts`). Sexta da S12 é o teste de one-arm.

Secundários (hipertrofia por RPE, dupla progressão): séries por semana 3, 3, 4, 4, 4, 4, 2 (deload), 4, 4, 3, 2 (taper), 0 (S12); isoladores (tríceps, rosca, facepull, abdômen, hang) uma série a menos, mínimo 2. `hypertrophySets` em `waves.ts` e RPE por faixa de semana em `program.ts`.

## Cálculo (revisado)
- Percentual só sobre a carga: carga = RM de lastro × %, arredondada para baixo no incremento. O peso corporal não entra na conta (barra e dip usam o RM de lastro do perfil); assistência só existe no one-arm, por RPE.
- Séries de redução usam a proporção entre o % nominal da série e o da principal, aplicada ao teto efetivo da primeira série.
- Sem histórico, o teto é o % da semana 1 do movimento (retorno leve).
- Squat pausado usa o RM do squat com a tabela de volume (sem desconto extra); o RPE prevalece.
- Teste: `percentageFor` usa o 1º alvo; como o peso corporal não entra na conta, a S12 não converte mais em calibração assistida.

## Navegação
- Aba Periodização com cinco fases (Reentrada, Acumulação, Intensificação, Pico, Teste PR); cada semana mostra a onda do squat.
- Cartões A–F da tela inicial em três colunas no celular, com texto legível.

## Validação
`npm run typecheck`, `npm run lint`, `npm test` (58 testes) e `npm run build` executados nesta rodada; conferência visual no navegador (desktop e celular). Backup/Firebase e IDs de histórico não foram alterados; Safari e aparelho real não revalidados.
