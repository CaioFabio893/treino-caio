## Rodada 25/10/2026 — programação de 12 semanas e GitHub Pages

40 testes unitários passaram; typecheck e lint passaram, build e check estático de base/manifest/precache passaram. Sem navegação, E2E, screenshots ou teste visual por pedido do usuário. Nenhum teste de Firestore nesta rodada (regras inalteradas). Resultados anteriores abaixo são históricos. Conferência final após os últimos ajustes será registrada na publicação.

## Rodada de acessórios — 18/10/2026

- npm test: 36 testes passaram (20 engine, 10 acessórios, 6 persistência).
- npm run typecheck, npm run lint e npm run build: exit 0.
- Testes novos cobrem blocos/deload/taper/PR, histórico por variação, progressão no topo, evolução de quantidade, falha/parcial/RPE alto, recuperação, substituição sem transferir carga, farmer, redução opcional do dip e backup misto antigo/novo.
- NÃO executados testes de navegação, E2E ou inspeção visual, conforme pedido do usuário. Evidências de navegador e 10 E2E abaixo pertencem à rodada anterior. Não afirmar que foram repetidos.
- Regras Firestore não alteradas nem reexecutadas. Nenhuma alteração em faturamento/Auth/backup remoto.
- Decisões e limites: ACESSORIOS.md.

# Critérios de validação — treinos livres A–E

Pedido de 18/10/2026 substitui as antigas travas de calendário/80 minutos/OAPU. Requisitos originais ficam em referencias/ como fonte histórica. Estado real dos checks: VALIDACAO.md. Não marcar critérios manuais como aprovados por build.

## Cobertos automaticamente na rodada atual
- A–E preservam os cinco planos e seus exercícios. Sem corte por tempo na geração atual.
- Acesso em qualquer data/semana, inclusive domingo. Não exigir finalizar outro plano para acessá-lo.
- Visão Treino completo contém todos os exercícios juntos. Semana completa contém A–E integrais sem iniciar sessão.
- Série de força pode ser registrada imediatamente, sem espera de OAPU ou countdown de descanso.
- Trocar de treino preserva os registros e permite retomar; repetir concluído cria execução nova.
- Edição/idempotência de séries, PR com prontidão, cargas e peso corporal separados, e1RM, RPE/dor e deload/taper.
- Timestamps são metadados, não cronômetro visível; não há avisos ou bloqueios após 80 min.
- Backup legado preservado exatamente, incluindo nomes antigos e registros simultâneos; validação de corrupção e erro de quota.
- Perfil/check-in persistem após reload; exportação JSON; interface/rotas lazy offline; sem overflow a 320 px.

## Continuam necessários
- Testes negativos das regras no emulador ao modificar regras (anonimato, dono, outra conta, envelope/campos/tamanho/timestamp); nenhuma alteração de segurança foi necessária para este pedido.
- Login/backup em Firebase real somente em conta de teste autorizada e projeto Hybrid Strength. Não usar o app/projeto da Louise.
- Instalação PWA em aparelho físico, Safari, leitor de tela, contraste AA medido, zoom 200%, teclado virtual, orientação/tablet e atualização do worker mantendo dados.
- Exercitar importação/exportação e vários treinos em andamento em duas abas reais; Web Locks não é sincronização entre dispositivos.
- Histórico grande e limite de 900 KB; migração para IndexedDB antes de ampliar dados sem limites.

## Execução
npm run typecheck; npm run lint; npm test; npm run build; npm run test:e2e -- --workers=2.
Regras, quando pertinentes: npm run test:rules (Firebase Emulator demo-hybrid-strength + Java 21).
No Windows, encerrar dev/preview deste projeto antes de npm ci para evitar EPERM de binding nativo. Não encerrar outros aplicativos.

Ao relatar, informar comando/exit code/ambiente, critérios cobertos, falhas reproduzíveis e pendências. Emulador não é produção; dados locais não são sincronização.
