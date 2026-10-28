# Ondas individualizadas de força e hipertrofia — 27/10/2026

## Pedido e destino
Usuário aprovou substituir a programação repetitiva por variação real de volume/intensidade e publicar no GitHub. Destino único CaioFabio893/treino-caio, Pages https://caiofabio893.github.io/treino-caio/ . Firebase desativado. Não acessar Louise. Não executar testes: OpenCode fará validação. Somente compilação necessária à publicação.

## Base da revisão
Fontes consultadas:
- Moesgaard et al.2022, meta-análise35 estudos: vantagem de periodização/ondulação para força, sobretudo treinados; sem vantagem clara para hipertrofia com volume equiparado. https://pubmed.ncbi.nlm.nih.gov/35044672/
- Helms et al.2018, ensaio21 homens treinados/8 semanas: %1RM e RPE melhoraram resultados, sem diferenças estatisticamente significativas entre grupos. Não interpretar um % como garantia de RPE individual. https://pubmed.ncbi.nlm.nih.gov/29628895/
- Travis et al.2020, revisão de taper/força: reduzir volume antes do teste, preservando exposição específica; evidência limitada, não existe protocolo universal. https://pubmed.ncbi.nlm.nih.gov/32917000/

Os números implementados são proposta individual ajustável, NÃO uma ficha validada/publicada por esses estudos. 135kg×6 aproximados do usuário não foram convertidos em RM confirmado ou sessão fictícia. Referências históricas continuam provisórias. Squat inicial continua120kg com referência histórica200 e incremento2,5kg. Sem forçar saltos para cumprir percentuais.

## Organização
Novo programa oapu-strength-waves-v4; mesma seleção A–F e divisão semanal v3. Novo ID protege snapshots antigos e impede retomá-los como se fossem as novas doses. Chave de seleção por programa continua; não mudar essa correção.
A: one-arm/barra/terra/costas/flexora/bíceps e panturrilha sentada.
B: dip pesado/supino/lateral/tríceps.
C: one-arm técnico/squat/remada/leg/extensora/panturrilha em pé.
D: desenvolvimento/crucifixo/lateral/reverso/tríceps.
E: one-arm/barra de volume/squat pausado/facepull/flexora/abdômen.
F: dip de volume/lateral/tríceps/supino máquina. Domingo descanso.
F é empurradas; A é puxadas/posterior. One-arm3, dip2 e back squat2 exposições normais por sete dias; semana12 tem testes opcionais separados e frequência reduzida conforme recuperação.

## Prescrição detalhada
src/domain/waves.ts é a fonte de verdade por movimento. Cada bloco contém séries/reps/percentual/RPE. Percentuais são a entrada inferior das faixas da proposta. Todas as séries ficam em Exercise.setTargets; doses distintas para squat, pausado, dip, supino, barra pesada, barra de volume, dip de volume, desenvolvimento e terra.

### Back squat (dia C)
| Semana | Prescrição | RPE |
|---|---|---|
|1|3×6 a 60%|6|
|2|4×6 a 62,5%|7|
|3|5×5 a 67,5%|7|
|4|2×5 a 50%|6|
|5|4×5 a 70%|7,5|
|6|5×4 a 72,5%|8|
|7|1×3 a 80% +3×3 a 75%|8/7,5|
|8|2×3 a 55%|6|
|9|1×2 a 82,5% +3×3 a 77,5%|8/7,5|
|10|1×1 a 85% +3×2 a 80%|8,5/8|
|11|1×1 a 82,5% +2×2 a 72,5%|8/6,5|
|12|Até3 singles, abertura nominal80% com limite por histórico|até8,5|

Pausado E: 2×8/3×8/3×8/2×5/4×6/3×7/4×5/2×5/3×5/3×4/2×3 nas semanas1–11; percentuais50/52,5/55/45/57,5/60/62,5/50/65/65/55. S12 sem complemento.

### Diferenças nos outros principais
Dip: 3×6 →4×5 →4×4; intensificação4×4/4×3; depois série de maior intensidade com reduções. Supino:3×6/3×7/4×5 na base;4×5/4×4 na intensificação; séries principais e reduções próprias, com menos volume que o squat porque vem após o dip.
Barra pesada:3×5/3×6/4×4;3–4 séries na intensificação e3 séries nas semanas com dupla/single, preservando prioridade do one-arm. Barra de volume2–3 séries, faixa8→7→8 na base e7→6→5 depois.
Terra:2×5/3×5/3×4 na base;3×4/4×3 e uma dupla seguida de2×3 na intensificação; posteriores duplas/singles controlados, com apenas2 singles leves no taper. Não é mais sempre2 séries.
Dip volume:3×8/3×9/4×7;4×7/3×8/4×6; depois3×6/3×5 e2×4 no taper.
Desenvolvimento:2×8/3×7/3×6;3×6/4×5/3×4; depois3×4/2×3 e2×3 leves no taper. Deloads individuais também estão nas tabelas de waves.ts.

### One-arm e hipertrofia
One-arm mantém funções distintas A força/C técnica/E volume. A séries semanais3/3/4/2/4/4/3/2/3/2/2/2; E2/3/3/2/3/3/3/2/2/2/2/2; C3 nas normais e2 nas reduzidas. Assistência individual/RPE; não usar RM bilateral para unilateral.
Acessórios S1–2:2 séries. S3/S5–7:3 na maioria; leg press/panturrilha em pé4 na S6. Tríceps na corda fica2 devido às empurradas compostas; lateral2 em B/F e3 em D. S4/8:2; S9/10:2 nos frequentes e3 nos outros; S11:1; S12 retirados. Panturrilha agora A e C, nunca F, preservando separação F→A. Os complementos não recebem4 séries indiscriminadamente.

## Cálculo e interface
Load planner calcula teto da primeira série com %RM e histórico/RPE. Série reduzida usa a proporção entre seu percentual nominal e o da série principal aplicada à carga total efetiva limitada. Exemplo: top alvo80% e back-off75%, mas top limitado a120kg: back-off usa120×75/80, arredondado para baixo. Isso evita achatar top/back-off na mesma carga quando o RM histórico está superestimado.

Barra/dip continuam por PC+lastro; assistência quando alvo total fica abaixo do PC. Sem último histórico não aumentar só pelo calendário; com execução completa/RPE dentro do alvo, limite de um incremento até2,5kg. Séries diferentes de um back-off não são consideradas registro inconsistente: cada uma é comparada à própria dose. Falhas/esforço alto continuam mantendo/reduzindo.

Prévia, treino ativo e ciclo exibem resumo real (ex.:1×2 +3×3, com % e RPE). Cada série selecionada mostra reps, % nominal, kg/assistência calculados e RPE próprio. Ao avançar, os campos de carga seguem o próximo alvo; reps/RPE observados permanecem manuais. Reabrir uma série já executada preenche os valores realmente registrados, preservando correções anteriores.

Botão de reduzir dip para2 séries também reduz a lista de alvos; conversão de PR assistido em calibração conserva contagem e RPE consistentes. Backup continua schema1, campo setTargets opcional e validado. Ao apagar RM de um acessório, suas cargas por série são limpas. Snapshots anteriores permanecem intactos.

## Validação pendente para OpenCode
Testes NÃO executados, conforme usuário. Compilação para publicação registrada em PUBLICACAO.md. Atualizar asserts antigos de doses/IDs: programa agora waves-v4; datas/dias livres continuam. Verificar arrays de alvos, contagem e resumo de top/back-offs, carregamento ao trocar série, regressão de RM ausente, assistência, redução para2, calibração PR, edição de log existente, volume por grupo, frequência e separação F→A, snapshots v2/v3 e backups mistos. Não tratar os57 testes históricos como evidência desta versão. Não executar navegação sem autorização do usuário.
