# Correção de seleção e semana real — 27/10/2026

## Pedido e problemas
O usuário informou que clicar num treino abria outro e reiterou que o último e primeiro não podem repetir a musculatura principal. Também pediu para NÃO executar testes; validação fica com OpenCode. Não rodar unitários, navegação/E2E, lint, typecheck ou check estático nesta rodada. Build é executado apenas por ser necessário à publicação (inclui compilação TypeScript).

## Correções
- Seleção explícita prevalece; removido latestOpen como inicializador que substituía a letra salva ao recarregar.
- Seleção local agora inclui PROGRAM_ID na chave; uma letra da divisão antiga não é reinterpretada silenciosamente na nova.
- chooseDay é o ponto único de seleção de cartões, lista e seletor. Fecha a visão de todos os treinos ao selecionar uma letra e abre a ficha escolhida. Antes, o seletor podia continuar mostrando a lista inteira a partir de A.
- chooseWeek também fecha a lista inteira. Resposta assíncrona de um início anterior não redireciona a tela depois de o usuário escolher outro treino.
- Cabeçalhos A–F e cartões obtêm foco da prescrição real da semana. Removida classificação genérica Pull/Push & Legs. Semana12 mostra o lift efetivamente testado.

## Divisão semanal vigente (substitui o ciclo antigo de dez dias)
Programa oapu-strength-weekly-v3, A–F livres; dias são sugestão de distribuição, não trava por calendário.

| Dia | Letra | Conteúdo principal |
|---|---|---|
| Segunda | A | One-arm força, barra pesada, terra com no máximo2 séries; remada/flexora/bíceps |
| Terça | B | Dip pesado, supino reto; lateral/tríceps |
| Quarta | C | One-arm técnico, back squat pesado; remada unilateral, leg press/extensora/panturrilha |
| Quinta | D | Desenvolvimento, crucifixo na polia, lateral, reverso e tríceps |
| Sexta | E | One-arm volume, barra lastrada de volume, back squat pausado; facepull/flexora/abdômen |
| Sábado | F | Dip de volume, lateral, tríceps acima da cabeça, supino na máquina |
| Domingo | — | Descanso |

Normalmente: one-arm3× (A/C/E), dip2× (B/F), back squat2× (C/E). Puxadas e pernas concentradas A/C/E; empurradas B/D/F. F não tem panturrilha/pernas/puxadas; A é puxadas e cadeia posterior. Domingo separa F de A. Trata-se dos grupos principais; movimentos compostos também usam estabilizadores. No A, priorizar one-arm antes de barra/terra; terra fica com volume menor, RPE controla fadiga.

Retorno leve preservado: squat120kg na referência histórica200, supino100kg na referência170, terra130kg na referência220, RPE6 nas entradas, progressão pequena limitada por execução real. Mesmas regras de %RM total no lastro, assistência e bloqueio de saltos de calendário.

S12: testes opcionais separados A barra/B dip/C squat/D supino/E terra; F sem teste. Frequências normais são reduzidas na janela de testes e recuperação prevalece. Sem forçar seis sessões/testes se a recuperação não permitir.

## Histórico
ID novo evita retomar uma ficha antiga como se fosse a nova distribuição. Registros/snapshots antigos permanecem no histórico, com seus exercícios originais. Sem migração destrutiva, sem limpar localStorage, sem inventar sessões. Plano de treino já salvo nunca recebe outra letra. Firebase continua desativado; não acessar ou alterar Louise.

## Handoff para OpenCode — testes NÃO executados
Adaptar testes existentes que ainda esperam a distribuição v2: squat mudou B→C; supino C→B; terra D→A; pausado F→E; dip pesado B e volume F permanecem; desenvolvimento C→D; PR agora A/B/C/D/E, F vazio. IDs novos de sessão weekly-v3; alguns testes de engine já tiveram o literal atualizado, sem execução. Não afirmar que os antigos57 testes passaram nesta rodada.

Validar seleção de cada cartão/seletor e persistência após recarga, seleção durante início assíncrono, conteúdo do preview vs sessão, frequências por sete dias, grupos F→A e preservação de históricos v2. Navegação só se o usuário autorizar ao OpenCode. Workflow de publicação nesta rodada tem só instalação/compilação/publicação: passos de testes/verificações retirados conforme pedido. Restaurar checks futuros apenas quando autorizado.
