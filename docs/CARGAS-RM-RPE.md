# Cargas por %RM + RPE — 25/10/2026

Pedido vigente: exibir kg e percentual planejados no treino, combinando % de RM com RPE, sem perder a programação A–F de 12 semanas.

## Cálculo e fontes
- src/domain/loads.ts concentra a regra. makePlan(semana,treino,perfil) produz prescrição com kg, percentual, RM/fonte, PC de referência e assistência quando necessária.
- Profile.referenceRm guarda RMs atuais de planejamento por ID (inclusive supino e acessórios); campos novos opcionais, schema 1 mantido. TrainingMax legado é preservado nos backups e identificado como não utilizado neste método.
- RM atual informado tem prioridade. Se ausente, os cinco principais usam os máximos históricos já fornecidos pelo usuário (squat 200, terra 220, supino 170, dip +110 e barra +40 kg no perfil inicial), sempre com rótulo HISTÓRICO PROVISÓRIO. Não são reclassificados como máximos atuais ou executados.
- Acessórios sem RM próprio ficam por RPE e kg manual; não inventar RM nem copiar o de outra máquina. Campo opcional aceita uma estimativa conhecida; não é necessário testar 1RM de isoladores.
- Back squat pausado e barra/dip de volume usam o RM do respectivo principal, a menos que exista RM próprio da variação. Pausado recebe percentual menor. Identificação explícita da referência na nota.
- Barras/máquinas: kg = RM × percentual, arredondando PARA BAIXO no incremento global.
- Barra fixa/dip: alvo total = (PC + RM de lastro) × percentual; lastro = alvo total − PC. Nunca aplicar percentual somente ao lastro. Ex.: PC 100 + RM adicional 40, a 75%: total 105, lastro +5 kg.
- Se alvo total < PC: lastro 0 e assistência positiva, arredondada para cima. Assistência é campo próprio nas séries bilaterais. Não aceitar lastro e assistência positivos juntos. Sem carga negativa. Séries assistidas não contam como recordes/e1RM de barra/dip sem assistência; tonelagem usa carga total efetiva.

## Percentuais dos principais
| Semana | %RM | RPE teto | Séries × reps |
|---|---|---|---|
| 1 | 75 | 7 | 3×6 |
| 2 | 77,5 | 7,5 | 4×6 |
| 3 | 80 | 8 | 4×5 |
| 4 | 60 | 6 | 2×5 |
| 5 | 82,5 | 7,5 | 4×4 |
| 6 | 85 | 8 | 4×3 |
| 7 | 87,5 | 8,5 | 4×2 |
| 8 | 65 | 6 | 2×3 |
| 9 | 90 | 8 | 3×2 |
| 10 | 92,5 | 8,5 | 3×1 |
| 11 | 72,5 | 6,5 | 2×2 |
| 12 | 90/95/100 | 9 | Até 3 singles |

Terra limitado a 3 séries nas semanas normais. As doses e RPE são metas de planejamento, NÃO equivalências fisiológicas exatas entre percentual, repetições e esforço. Ajustar pela execução real.

Volume barra/dip: 65/67,5/70/55/70/72,5/75/60/75/77,5/60% em S1–11. Pausado: cinco pontos percentuais abaixo desses valores. Desenvolvimento: 67,5% na base, 70% depois, 55% nas semanas leves. Acessórios com RM: 55% nas faixas até 15+ reps e 65% nas faixas mais baixas; 45% nas semanas leves. Faixas, séries e deloads anteriores preservados. OAPU continua individualizado por assistência e RPE; não transferir RM da barra bilateral para o unilateral.

## Interface e registros
- Perfil: RMs atuais dos cinco principais e seção opcional para acessórios/variações. Apagar campo volta à referência histórica nos principais, ou carga manual no acessório.
- Prévia e treino ativo: kg, %RM, RPE, RM/fonte e PC. Campo digitado mostra percentual efetivo da carga ajustada.
- PR: três referências de 90/95/100%, sem 105% automático. Seleção de tentativa carrega o respectivo kg; avanço manual exige prontidão na terceira. Se abertura de barra/dip ficar abaixo do PC, referência mínima sem assistência é PC, explicitando que o percentual efetivo fica acima do alvo. Não forçar tentativa se RPE não permitir.
- Treinos já iniciados preservam snapshots. Botão Atualizar cargas e % pelos meus RMs recalcula APENAS exercícios sem séries; mantém os já registrados e grava decisão. Recalcular usa o PC da sessão, não um PC de perfil alterado depois.
- Substituição limpa RM/fonte/carga antigos; para obter kg da variação nova, informar RM próprio e recalcular. Não transferir histórico entre máquinas.
- Percentual estabelece carga inicial; RPE manda ajustar para a execução. Sugestões históricas continuam opcionais. Observações com RPE acima do alvo continuam registráveis (não falsificar execução para caber no plano).

## Verificações e limitações
52 testes unitários passaram; typecheck e lint passaram. Novos testes cobrem % por semana, fonte histórica/atual, PC + lastro, assistência, arredondamento, PR, RM de variações, remoção de referência, substituição, snapshots e validação de backup. Build/check estático e publicação registrados em PUBLICACAO.md. Sem navegação/E2E ou avaliação visual, por pedido do usuário. Nenhum acesso ao projeto/app da Louise; Firebase continua desativado.

Referência geral sobre autorregulação, não origem desta tabela individual: https://www.nsca.com/education/articles/nsca-coach/using-intensity-based-on-sets-and-repetitions-over-50-years-of-experience-a-brief-overview-of-load-setting-and-programming-strategy/ .
