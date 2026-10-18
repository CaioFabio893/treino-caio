# Publicação — Hybrid Strength — 17/10/2026

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
