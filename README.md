# Hybrid Strength — Caio

Aplicativo pessoal de força, hipertrofia e one-arm pull-up. Programação de 12 semanas, seis treinos A–F livres, progressão por execução e histórico local.

Site: https://caiofabio893.github.io/treino-caio/
Repositório: https://github.com/CaioFabio893/treino-caio

## Como usar
Escolha a semana de preparação e continue A–F com os descansos sugeridos, mesmo ao atravessar uma semana. Não precisa completar os seis em sete dias. Todos os exercícios e todos os planos podem ser consultados sem iniciar. Sem cronômetros. Cargas iniciais a definir; sugestões só são aplicadas após seu aceite. Consulte docs/PROGRAMA-12-SEMANAS.md para ficha e progressão completas.

## Seus dados
Dados locais por navegador e origem; exporte JSON no perfil para cópia e importe sua cópia no novo site. O GitHub Pages NÃO recebe automaticamente os registros que estavam no domínio Firebase. Não apagar armazenamento antigo. Sem sincronização automática; Firebase Auth/backup remoto opcionais não estão configurados em produção. Site estático não contém credenciais.

## Publicação
GitHub Actions em .github/workflows/pages.yml: cada push em main verifica tipos/lint/testes, compila, confere caminhos e publica em Pages. Base /treino-caio/, manifest e service worker restritos à subpasta. Sem deploy no Firebase. Hosting Firebase foi desativado por pedido do usuário. NÃO acessar/alterar app ou projeto da Louise.

## Desenvolvimento e validação
npm ci; npm run typecheck; npm run lint; npm test; npm run build; node scripts/check-pages.mjs. Preview local em http://127.0.0.1:4173/treino-caio/ após npm run preview.

Não executar navegação/E2E/browser nesta tarefa, por pedido do usuário. Os arquivos E2E e capturas anteriores são históricos e precisam ser adaptados à programação nova antes de futura execução autorizada. Regras Firestore não alteradas nesta migração. Limitações: aparelho físico, Safari, acessibilidade e atualização do worker com sessão aberta não revalidados.
