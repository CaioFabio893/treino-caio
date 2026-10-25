> Atualização vigente: cargas calculadas por %RM + RPE, com RMs atuais configuráveis e histórico identificado como provisório. Leia docs/CARGAS-RM-RPE.md (ou CARGAS-RM-RPE.md nesta pasta). As frases antigas sobre cargas sempre vazias foram substituídas por este pedido. Sem navegação/E2E.

# Continuação — Hybrid Strength — 25/10/2026

## Destino e restrições
Somente repositório CaioFabio893/treino-caio e site https://caiofabio893.github.io/treino-caio/. Hosting antigo hybrid-strength-caio-2026 desativado; NÃO republicar no Firebase. NÃO acessar nem alterar app/projeto da Louise. Não executar testes de navegação/browser/E2E sem nova autorização; usuário pediu economizar tokens.

## Estado atual
Programação de 12 semanas implementada: docs/PROGRAMA-12-SEMANAS.md contém ficha, doses semanais, recuperação, progressão e PR. Seis treinos A–F (pedido novo substitui A–E). One-arm 3/ciclo, dip 2/ciclo, back squat 2/ciclo; ciclo de 10 dias, semanas de preparação continuam correndo. Semana selecionada manualmente, sem travas nem timer. PR S12 cinco lifts separados, sem acessórios.

Histórico original preservado: schema 1, modelo hs-v1-epley; plan.program opcional distingue a programação nova. Campo plan.day é índice A1..F6. Snapshots não reescritos; registros antigos consultáveis no histórico. Carga vazia até aferir RPE; sugestões optativas, históricos separados por ID. Importar/exportar JSON para migrar do domínio antigo ao Pages; não há acesso automático ao localStorage de outra origem.

## Arquivos
src/domain/program.ts: nova ficha e semanas/OAPU; engine.ts: sessões/séries/cálculos, exporta makePlan; accessories.ts: variantes e propostas de progressão (inclui principais com progressive). App.tsx: fluxo de seis treinos, semana selecionável, séries/OAPU, histórico. store.ts: validação/backups/Web Locks. Performance.tsx inclui supino. vite.config.ts base /treino-caio/ e precache; public/sw.js escopo da subpasta; .github/workflows/pages.yml publicação automática em main, sem navegação. Script deploy:hosting removido para evitar reativação acidental do Firebase.

## Verificações
Consulte docs/VALIDACAO.md para resultados reais desta rodada. Scripts básicos: npm ci, npm run typecheck, npm run lint, npm test, npm run build, node scripts/check-pages.mjs. Nenhuma navegação ou E2E nesta rodada. E2E e capturas antigas não comprovam a versão atual e precisam de adaptação futura. Regras e Auth/backup Firebase não alterados. Não inferir validação de aparelho físico/offline real a partir do check estático do precache.

Documentação histórica em outros arquivos pode mencionar A–E/Firebase; esta decisão e PROGRAMA-12-SEMANAS.md prevalecem. Originais do Claude em claude-original/; não repetir recuperação. Antes de npm ci em Windows, encerrar somente preview/dev deste projeto para evitar EPERM dos bindings nativos.
