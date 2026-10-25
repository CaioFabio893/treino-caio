# Treinos livres A–E — 18/10/2026

Pedido explícito do usuário substitui as restrições antigas de calendário e cronômetro. O usuário confirmou manter os cinco planos, apenas renomeados A/B/C/D/E; não combinar ou excluir exercícios.

- A = Pull força (antigo plano 1).
- B = pernas/push força (antigo plano 2).
- C = Pull técnico/volume (antigo plano 3).
- D = pernas/push volume (antigo plano 4).
- E = posterior/hinge (antigo plano 5).

Treino completo mostra todos os exercícios do plano selecionado, incluindo os formulários de séries quando há registro em andamento. Semana completa mostra os cinco planos integralmente. Sem seletor que esconda exercícios um por vez, sem relógios, duração máxima, dias da semana, bloqueio de OAPU ou remoção de acessórios por tempo.

Semanas 1–12 continuam como organização da periodização, escolhidas manualmente, sem travar data de execução. Protocolos de OAPU, RPE, cargas de referência e validação de dados permanecem; descansos e durações de isometria são referências estáticas, não countdowns.

Compatibilidade: schema e chave local preservados. plan.day (1–5) é índice A–E, mantido para ler backups. IDs e snapshots anteriores continuam intactos; inclusive nomes antigos no histórico. Registros de treinos diferentes podem ficar em andamento e ser retomados separadamente. Troca de plano não apaga séries. O teste de importação cobre snapshots legados e múltiplos registros abertos.

Só o projeto `hybrid-strength-caio-2026` pode ser publicado. Não acessar/alterar o projeto da Louise. Relatório final de checks em VALIDACAO.md.
