## Rodada %RM + RPE — 25/10/2026
52 testes unitários passaram, types e lint exit 0. Sem navegação/E2E. Ver docs/CARGAS-RM-RPE.md para regras e casos; build e publicação final abaixo serão registrados em PUBLICACAO.md. Resultados anteriores são históricos.

## Publicação concluída — 25/10/2026

GitHub Actions confirmou sucesso: https://github.com/CaioFabio893/treino-caio/actions/runs/40230345362 . Código publicado: commit 5762fb82067f2227eb5c9315c92d403dc561c910. URL https://caiofabio893.github.io/treino-caio/ respondeu HTTP 200; JS/CSS responderam HTTP 200 e bundle contém program=oapu-strength-12w-v2 e nova ficha. Manifest relativo, worker versionado e lista offline conferidos por HTTP, sem browser. Hash do JS local Windows difere do build Linux do Actions; conferência de versão por commit do deploy e identificador do programa, não por igualdade byte a byte.

40 testes, tipos, lint, build e check estático passaram localmente e pipeline concluiu com sucesso no GitHub. Sem navegação/E2E ou validação visual. Firebase segue desativado; nenhum acesso ao projeto/app da Louise.

## Rodada 25/10/2026 — programação de 12 semanas e GitHub Pages

40 testes unitários passaram; typecheck e lint passaram, build e check estático de base/manifest/precache passaram. Sem navegação, E2E, screenshots ou teste visual por pedido do usuário. Nenhum teste de Firestore nesta rodada (regras inalteradas). Resultados anteriores abaixo são históricos. Conferência final após os últimos ajustes será registrada na publicação.

## Rodada de acessórios — 18/10/2026

- npm test: 36 testes passaram (20 engine, 10 acessórios, 6 persistência).
- npm run typecheck, npm run lint e npm run build: exit 0.
- Testes novos cobrem blocos/deload/taper/PR, histórico por variação, progressão no topo, evolução de quantidade, falha/parcial/RPE alto, recuperação, substituição sem transferir carga, farmer, redução opcional do dip e backup misto antigo/novo.
- NÃO executados testes de navegação, E2E ou inspeção visual, conforme pedido do usuário. Evidências de navegador e 10 E2E abaixo pertencem à rodada anterior. Não afirmar que foram repetidos.
- Regras Firestore não alteradas nem reexecutadas. Nenhuma alteração em faturamento/Auth/backup remoto.
- Decisões e limites: ACESSORIOS.md.

# Validação atual — 18/10/2026

Mudança autorizada: treinos livres A–E, vistas completas de treino e semana, sem relógios/travas. Detalhes em ALTERACAO-TREINOS-LIVRES.md.

| Comando desta rodada | Resultado |
|---|---|
| npm run typecheck | Passou, exit 0 |
| npm run lint | Passou, exit 0 |
| npm test | 25 aprovados (20 engine + 5 store), exit 0 |
| npm run build | Passou, Vite 8.3.4, exit 0 |
| npm run test:e2e -- --workers=2 | 10 aprovados, desktop/mobile, 18,7 s, exit 0 |
| node scripts/capture.mjs | Passou; screenshots atuais inspecionados |

**35 testes executados e aprovados nesta alteração.** Regras Firestore não mudaram; não repetido o emulador nesta rodada de UI/domínio. Os 5 testes de regras da base anterior continuam como evidência histórica, não nova execução de hoje pelo Codex.

Cobertura nova: plano A–E sem alteração dos exercícios; início no domingo e em qualquer semana; força imediatamente disponível sem aguardar OAPU; ausência de countdown; todos os exercícios juntos; cinco planos completos na visão semanal; alternância e retomada de registros de treinos diferentes; correção de série, reload, histórico e OAPU opcional; leitura sem alterações de snapshot legado com mais de um treino aberto; modo offline e perfil preservado. Continua sendo Chromium desktop/mobile emulado, não aparelho físico/Safari.

Revisão independente informada pelo usuário em 18/10 reproduziu os 38 testes da base anterior (23 + 10 + 5), tipos/lint/build e audit sem vulnerabilidades, sem bug funcional encontrado. Esse resultado foi informado pelo revisor, não reexecutado pelo Codex na atualização documental. Ele relatou EPERM em npm ci com preview Vite segurando rolldown; após encerrar o preview deste projeto e reinstalar, os checks passaram. README e OPENCODE incluem a orientação sem encerrar processos de outros projetos.

A primeira execução dos novos E2E encontrou seletor de teste que não resolvia o label implícito do select; a árvore acessível confirmava combobox Treino. Corrigido o localizador para o papel combobox e nome acessível, sem relaxar comportamento. Rodada final: dez aprovados.

Hosting de produção publicado e conferido na rodada anterior (PUBLICACAO.md); Auth/backup Firestore real não configurados ou validados. Instalação física da PWA, acessibilidade manual, Safari e atualização de worker com sessão aberta seguem pendentes. A matriz TESTES.md reflete o pedido atual; restrições antigas abaixo são apenas relato histórico da base.

## Registro histórico de 17/10/2026

## Resultado final desta rodada
| Comando | Resultado real |
|---|---|
| `npm run typecheck` | Passou, exit 0 |
| `npm run lint` | Passou, exit 0 |
| `npm test` | 23 testes aprovados em 2 arquivos, exit 0 |
| `npm run test:rules` | 5 testes aprovados, exit 0; Firebase Emulator, projeto demo-hybrid-strength |
| `npm run build` | Passou, exit 0; Vite 8.3.4, sem alerta de chunks grandes na versão final |
| `npm run test:e2e -- --workers=2` | 10 testes aprovados, exit 0, 21,1 s na última rodada |
| `npm audit --omit=dev` | 0 vulnerabilidades, exit 0 |
| `node scripts/capture.mjs` | Passou, exit 0; screenshots capturados e inspecionados |

Total: **38 testes automatizados aprovados**. Node 24.19.0, npm 11.17.0, Java 21 e Firebase CLI 15.30.1 disponíveis no Windows. Chromium de teste 156.0.8078.4 instalado pelo Playwright 1.64.1. Mobile é emulação Chromium, não um iPhone físico nem Safari real.

## O que os testes demonstram
- Percentual de TM, arredondamento, e1RM, separação entre lastro e peso total, RPE e dor.
- 60 prescrições de 12 semanas, agenda útil, protocolos de deload/taper/PR e orçamento de tempo com remoção prioritária de acessórios.
- Bloqueio dos primeiros 30 min de Pull, início por calendário, retomada canônica, idempotência de séries e preservação de peso corporal histórico.
- Persistência local, corrupção de backup, atualização sob lock, duplicação de início e propagação de erro de quota.
- Regras no emulador: dono permitido, anônimo negado, acesso cruzado negado, campos/versão/timestamp/ID/tamanho inválidos e demais coleções negadas.
- Desktop/mobile: perfil salvo após reload, estados vazios sem demos, OAPU por lado, registro/edição de série sem duplicação, descanso, retomada, histórico, check-in, exportação JSON e ausência de término automático aos 80 min.
- A 320 px: sem overflow da página, carregamento offline da interface, navegação por chunks lazy offline e perfil salvo recuperado depois do reload offline. Abas horizontais de exercícios rolam internamente.

## Falhas encontradas e corrigidas
- Primeira tentativa E2E não executou o app porque faltava Chromium v1248. Instalado via `npx playwright install chromium`; não contabilizada como aprovação.
- Reload offline carregava HTML sem JS/CSS: headers do preview tinham `Vary: Origin`, e o precache não casava com requests de módulos crossorigin. Corrigido `ignoreVary` somente para assets públicos da mesma origem. E2E offline passou depois da correção.
- Expectativa literal `80:00` era instável com relógio avançando durante navegação. Ajustada para verificar o relógio retomado na faixa 80–89 min, sem relaxar a exigência de aviso e sessão ainda ativa.
- Screenshot full-page de desktop falhou uma vez no Chromium sob execução paralela. Captura visual foi separada dos testes de comportamento e feita por script próprio, com sucesso. Não houve mudança de lógica para ocultar erro.
- Firebase completo gerava chunk lazy de 562 KB. Backup manual usa Firestore Lite; chunk reduzido para ~196 KB. Gráficos ~374 KB, entrada ~284 KB (antes do gzip).
- Auditoria inicial apontou gRPC transitivo vulnerável; override compatível corrigiu e audit zerou alertas.
- Revisão visual corrigiu quebra de palavra no indicador de fase e campos estreitos de treino. No mobile, navegação global fica oculta durante a sessão e há botão de voltar sem interromper o relógio.

## Evidência visual
`docs/evidencias/inicio-desktop.png`, `inicio-mobile.png`, `treino-mobile.png`. Capturados em contexto de teste isolado, relógio em segunda-feira 19/10/2026 para visualizar treino permitido. Não são registros reais do usuário. O relógio do aplicativo normal usa data/hora do aparelho.

## O que ainda não foi validado
Na validação local original, Auth/backup Firestore de produção não foram configurados ou testados. O Hosting foi publicado posteriormente conforme PUBLICACAO.md. Login/backup em produção, instalação manual em aparelho físico, Safari, teclado virtual real, leitor de tela, medição de contraste, zoom 200%, rotação/tablet e migração de service worker com versão anterior aberta permanecem pendentes de verificação dedicada. A matriz TESTES.md é mais ampla que a cobertura atual.

Não há sincronização automática entre dispositivos nem isolamento de perfis locais por conta. Cloud é backup manual; local pertence ao aparelho. Ver limites e prioridades em OPENCODE.md.
