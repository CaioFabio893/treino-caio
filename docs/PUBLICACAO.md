## Publicação concluída — 25/10/2026

GitHub Actions confirmou sucesso: https://github.com/CaioFabio893/treino-caio/actions/runs/40230345362 . Código publicado: commit 5762fb82067f2227eb5c9315c92d403dc561c910. URL https://caiofabio893.github.io/treino-caio/ respondeu HTTP 200; JS/CSS responderam HTTP 200 e bundle contém program=oapu-strength-12w-v2 e nova ficha. Manifest relativo, worker versionado e lista offline conferidos por HTTP, sem browser. Hash do JS local Windows difere do build Linux do Actions; conferência de versão por commit do deploy e identificador do programa, não por igualdade byte a byte.

40 testes, tipos, lint, build e check estático passaram localmente e pipeline concluiu com sucesso no GitHub. Sem navegação/E2E ou validação visual. Firebase segue desativado; nenhum acesso ao projeto/app da Louise.

# GitHub Pages — 25/10/2026

Destino exclusivo: https://caiofabio893.github.io/treino-caio/ . Repositório público CaioFabio893/treino-caio, branch main. Pages ativado com build_type=workflow e HTTPS em 25/10/2026. Publicação por .github/workflows/pages.yml, com Node 24, types/lint/40 testes/build/check estático antes do deploy. Sem E2E/navegação, por pedido do usuário. Firebase continua desativado; script deploy:hosting removido. Nenhum acesso ao app/projeto da Louise.

Programação: PROGRAMA-12-SEMANAS.md. Troca de origem: importar backup JSON para trazer dados antigos; não há migração automática de localStorage.

## Histórico anterior (Firebase desativado)

> Estado em 25/10/2026: Hosting de hybrid-strength-caio-2026 DESATIVADO por pedido do usuário. Firebase CLI confirmou sucesso. Não republicar no Firebase: destino solicitado será GitHub Pages, após próximas edições. Projeto Firebase não excluído; arquivos locais e histórico preservados. Não acessar nem alterar app/projeto da Louise.

# Atualização de acessórios publicada — 18/10/2026

Firebase confirmou sucesso: versão dc8b9a64ba5c3d91. Deploy exclusivo de Hosting em hybrid-strength-caio-2026, URL https://hybrid-strength-caio-2026.web.app/. Nenhum comando dirigido ao app da Louise. Sem alteração de plano/faturamento, Auth ou Firestore.

36 testes unitários, typecheck, lint e build passaram. Sem navegação/E2E ou conferência visual por pedido do usuário. Se a aba antiga não atualizar, feche as abas do aplicativo e abra novamente; não apague dados locais. Sessões já iniciadas preservam a prescrição antiga. Detalhes em ACESSORIOS.md.

## Publicações anteriores

# Publicação — Hybrid Strength — 17/10/2026

## Atualização vigente — 18/10/2026
Versão `487ff6f192a82dc4`, publicada com sucesso somente em Hosting do projeto `hybrid-strength-caio-2026`. Novos treinos livres A–E, sem relógios/travas e com Treino completo/Semana completa. Conferido no endereço público após recarregar: cinco planos integrais na visão semanal. Screenshot em `docs/evidencias/semana-completa-publicada.jpg`. Nenhuma operação no projeto/app da Louise nesta rodada. A versão inicial abaixo permanece como histórico da primeira publicação.

Se a aba mostrar a interface antiga, recarregar a página; não limpar o armazenamento local, pois contém os registros. O preview local desta rodada foi encerrado para não segurar bindings durante um futuro npm ci.

## Destino exclusivo autorizado
- URL: https://hybrid-strength-caio-2026.web.app/
- Projeto Google Cloud/Firebase: `hybrid-strength-caio-2026`.
- Número: `1040962238655`.
- Hosting site: `hybrid-strength-caio-2026`.
- Versão publicada: `601585028ab671f8`.

Projeto novo criado na conta do usuário. Não foi vinculada conta de faturamento, ativado Cloud Run nem publicado banco/regras nesta etapa. Deploy somente do Hosting; a aplicação publicada mantém persistência local. Firebase Auth/backup continuam sem configuração de produção no frontend.

## Proteção do aplicativo da Louise
**Autorização do usuário: alterar SOMENTE o novo projeto Hybrid Strength. NÃO alterar o app da Louise.**

O projeto da Louise, `treino-louise`, ficou intacto. Nenhum comando de deploy, alteração de banco/regras, IAM, serviços Cloud Run ou exclusão foi dirigido a ele. Somente consultas e abertura da página de login para conferência, sem autenticar como usuário ou gravar dados.

O endereço de produção encontrado na documentação e verificado no navegador foi `https://treino-web-834622951375.southamerica-east1.run.app/`, redirecionando normalmente para `/login`, título “Treino Ciclo 2 — Louise Lima”. Isso confirma abertura da tela pública de login, não uma validação das funções autenticadas. O Hosting padrão `treino-louise.web.app` não era o endereço de produção usado e retornava Site Not Found; não foi criado/alterado um site para corrigir isso.

## Evidência e comando
Build recompilado antes da publicação: `npm run build`, exit 0. Publicação:
```powershell
firebase deploy --only hosting --project hybrid-strength-caio-2026 --account <conta-do-dono> --non-interactive --json
```
CLI retornou status success e a versão acima. Aplicativo aberto no navegador no endereço público correto: dashboard “Vamos evoluir, Caio”, modo local, descanso de sábado, navegação e dados iniciais visíveis. Screenshot: `docs/evidencias/publicado.jpg`.

## Publicações futuras
```powershell
npm run build
npm run deploy:hosting
```
O script fixa `--only hosting --project hybrid-strength-caio-2026`. `firebase.json` fixa o site desse projeto, e `.firebaserc` local aponta para ele. Não trocar esses destinos pelo projeto da Louise. Não executar `firebase deploy` genérico para publicar outros recursos sem tarefa específica. Nunca executar comandos mutáveis na pasta ou no projeto da Louise como parte do Hybrid Strength.
