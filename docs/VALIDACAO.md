# Validação local — 17/10/2026

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
Não foi configurado, publicado ou acessado Firebase real. Login/backup em produção, instalação manual em aparelho físico, Safari, teclado virtual real, leitor de tela, medição de contraste, zoom 200%, rotação/tablet e migração de service worker com versão anterior aberta permanecem pendentes de verificação dedicada. A matriz TESTES.md é mais ampla que a cobertura atual.

Não há sincronização automática entre dispositivos nem isolamento de perfis locais por conta. Cloud é backup manual; local pertence ao aparelho. Ver limites e prioridades em OPENCODE.md.
