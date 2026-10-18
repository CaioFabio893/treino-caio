# Hybrid Strength — handoff para o OpenCode

## Leia somente isto para começar
Projeto em `C:/Users/caiof/OneDrive/Desktop/caio`. Leia este arquivo e README.md. Consulte `docs/TESTES.md` por escopo; requisitos completos em `docs/referencias/`. Não altere os outros projetos do Desktop. O usuário pediu implementação pelo Codex e continuação/testes pelo OpenCode.

## Estado real — 17/10/2026
**Publicado em https://hybrid-strength-caio-2026.web.app/.** Projeto e site exclusivos `hybrid-strength-caio-2026`. O usuário reiterou: NÃO alterar nada do projeto/app da Louise (`treino-louise`); trabalhar somente neste novo projeto. Leia `docs/PUBLICACAO.md` antes de qualquer deploy. O script `npm run deploy:hosting` fixa o projeto correto e publica somente Hosting.

Implementação funcional local criada pelo Codex, em Vite/React/TypeScript. Não é mais uma pasta apenas documental. Os seis arquivos recuperados do Claude estão preservados em `claude-original/`; componentes visuais do Claude não estavam disponíveis para download. Detalhes em `docs/CLAUDE-RECUPERACAO.md`. Não repetir a investigação da conversa nem usar a conta de Adriano.

### Implementado
- Dashboard com dados reais, semana atual, calendário, treino de hoje, aderência semanal e e1RM dos quatro main lifts. Sem histórico fictício.
- Ciclo de 12 semanas, cinco dias úteis, fim de semana sem treino, deload/taper/PR Test. Prévia por semana/dia; início permitido somente na data prevista, sem Pull consecutivo ou reposição automática.
- Motor de orçamento temporal incluindo aquecimento, rampas, execução, descanso e transições; remove acessórios por prioridade e sinaliza inviabilidade sem eliminar essenciais/OAPU.
- Treino ativo com 30 min iniciais exclusivos de OAPU em Pull, registro por lado e assistência, série editável, campos carga/quantidade/RPE, lastro separado do peso corporal, descanso ajustável, término explícito e histórico.
- Relógio por timestamps, retomada após navegação/reload e avisos 60/70/75/80 min. Limite não pausa nem conclui automaticamente.
- Sugestões justificadas por RPE e dor, com aplicação opcional e decisão registrada; check-in de sono, estresse, fadiga, dor, local e notas. Progressão não é aplicada automaticamente entre semanas.
- Gráficos reais (e1RM, volume, RPE e recuperação), tabela de máximos históricos/estimados/testados, perfil editável, tema claro/escuro.
- Persistência local validada antes da escrita, lock entre abas, backup JSON exportável e importação com confirmação de substituição.
- Firebase Auth por conta existente + backup manual opcional por usuário. Regras testadas no emulador. Não existe configuração/conta de produção neste projeto.
- PWA: manifest, PNGs 192/512, fontes locais, precache de todos os chunks, fallback offline e versionamento de cache pelo build. Não são cacheadas chamadas do Firebase. Instalação manual real ainda merece teste no aparelho do usuário.

## Abrir e validar
```powershell
npm ci
npm run dev
```
Para cache offline/E2E, usar build de produção:
```powershell
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e -- --workers=2
npm run test:rules
```
Firebase CLI e Java 21 são necessários somente para `test:rules`; usa `demo-hybrid-strength` local. Não publicar em projeto real sem configuração explícita do usuário. README explica `.env.local` opcional; nunca incluir credenciais administrativas no cliente.

## Validação realizada pelo Codex
Passaram: typecheck, lint, build, 23 testes unitários/persistência, 10 E2E desktop/mobile e 5 testes de regras no Firebase Emulator. Audit de produção: 0 vulnerabilidades. Comandos, evidências, correções e limites em `docs/VALIDACAO.md`. Não equivale à matriz inteira aprovada nem a Firebase real validado.

## Mapa de arquivos
- `src/domain/model.ts`: tipos e versão do modelo.
- `src/domain/engine.ts`: calendário, prescrições, estimativas, orçamento, cargas, sessão canônica e validação de séries.
- `src/domain/engine.test.ts`: comportamento de domínio.
- `src/data/store.ts`: validação JSON, armazenamento local e Web Locks. `store.test.ts`: corrupção, persistência e duplicação.
- `src/App.tsx`: shell, dashboard, treino/OAPU, ciclo, recuperação, perfil e histórico. Pode ser dividido por telas em tarefa futura, sem reescrever regras.
- `src/Performance.tsx`: gráficos lazy de dados reais.
- `src/CloudPanel.tsx` + `src/data/cloud.ts`: Auth e backup manual Firestore Lite.
- `src/styles.css`, `src/tokens.css`: design e temas. `public/`: PWA.
- `vite.config.ts`: build + geração da lista de assets offline/versionamento do worker.
- `firestore.rules`, `rules-tests/`, `vitest.rules.config.ts`: regras e testes no emulador.
- `e2e/app.spec.ts`: fluxos reais em Chromium desktop/mobile com relógio controlado.
- `scripts/capture.mjs`: screenshots isolados de QA, usando preview na porta 4173. `scripts/generate-icons.ps1`: geração reproduzível dos PNGs.
- `docs/DECISOES.md`: fórmulas e pressupostos adotados, sem duplicar os requisitos.

## Limites e próximos passos (não apresentar como concluídos)
1. Auditar toda a matriz de `docs/TESTES.md`, incluindo acessibilidade por leitor de tela, contraste medido, zoom, teclado virtual real, landscape/tablet e atualização do service worker com sessões em andamento. Os testes automatizados atuais não cobrem tudo isso.
2. Configurar Firebase real só se o usuário quiser. Validar login, backup e restauração em conta de teste autorizada. Hoje os testes das regras são somente emulador. Backup manual não é sincronização automática nem resolve merge entre dispositivos.
3. O armazenamento local pertence ao aparelho, não à conta: logout não o apaga; trocar de conta não carrega outro perfil automaticamente. Isso está informado na UI. Para aparelhos compartilhados, implementar namespaces locais por conta antes de alegar isolamento local.
4. Catálogo e microciclo estão no motor, não existe CRUD livre de exercícios. Volume por grupo muscular e frequência por exercício ainda precisam de mapeamento explícito e telas. As métricas atuais são volume por semana e histórico por movimento.
5. As cargas futuras continuam referências iniciais com séries/reps/RPE da semana; atleta aplica sugestões com base na execução. Não existe tabela percentual/RPE validada nem algoritmo que transforme máximos antigos em cargas atuais. Se ampliar a progressão multi-sessão, preservar dados observados e documentar a regra.
6. Orçamento temporal usa parâmetros v1 documentados, ainda não calibra descansos/rampas automaticamente pela duração observada. OAPU mantém orçamento intermediário compartilhado; não inventar divisão de minutos.
7. Backup tem limite 900 KB. Para histórico grande, migrar armazenamento/versionamento sem perder dados. Sem garantia de concorrência entre dispositivos offline; Web Locks cobre abas do mesmo navegador.
8. Reforçar validação de domínio em imports se ampliar o schema. Regras de backup validam envelope/dono/tamanho; não fazem parsing do JSON esportivo no servidor.
9. Gráficos semanais, máximo testado no ciclo e aderência semanal filtram o ciclo atual. Uma tela para selecionar ciclos anteriores ainda é extensão futura; o histórico preserva os registros antigos.

## Regras de continuidade
- Não preencher histórico com demos, nem converter vazio em zero.
- Sem OAPU até falha. Sábado/domingo descanso. Não criar Pull consecutivo ou dobrar sessão perdida.
- Máximo antigo ≠ e1RM ≠ TM validado. Lastro ≠ peso total.
- Nunca chamar gravação local de sincronização. Backup só tem confirmação após resposta do servidor.
- Não declarar validação de Firebase real usando mock/emulador.
- Não sobrescrever a referência do Claude. Se o ZIP completo aparecer depois, preservar e comparar antes de integrar.
- Uma tarefa por vez; ler somente o escopo, rodar checks relevantes e atualizar este handoff com comando/resultado real e próxima ação.

## Prompt curto
> Leia OPENCODE.md e README.md nesta pasta. Valide a implementação existente, consulte docs/TESTES.md por escopo e execute typecheck, lint, unitários, build, E2E e regras no emulador. Corrija problemas reproduzíveis sem reescrever o app nem alterar regras esportivas. Não use Firebase de produção ou conta de outra pessoa. Registre resultados reais, pendências e próxima ação.
