# Hybrid Strength

Aplicativo de força híbrida em React + TypeScript + Vite. Dark mode, uso no celular, ciclo de 12 semanas, registro real de séries, OAPU, descanso, recuperação, histórico e gráficos. Sem histórico fictício.

Publicado: **https://hybrid-strength-caio-2026.web.app/**. Projeto próprio e separado do app da Louise. Alterações autorizadas SOMENTE no Hybrid Strength; não alterar `treino-louise`. Detalhes e comando seguro em `docs/PUBLICACAO.md`. O site publicado usa dados locais; o backup Firebase continua opcional e sem configuração de produção.

## Abrir no computador
Requer Node.js 24 e npm. Na pasta deste projeto:
```powershell
npm ci
npm run dev
```
Abra o endereço local mostrado pelo Vite. Para conferir o comportamento de produção e o cache offline:
```powershell
npm run build
npm run preview
```
Você pode iniciar qualquer treino do ciclo quando quiser, inclusive aos finais de semana. Cada sessão fica salva no histórico e não é duplicada; só é preciso concluir a sessão em andamento antes de iniciar outra. Os testes automatizados controlam o relógio.

## Dados e cópias
Os registros ficam no armazenamento local deste navegador. Trocar de navegador ou limpar dados não transfere os treinos. Em Perfil → Exportar JSON, guarde sua cópia. Restaurar exige confirmação explícita de substituição e validação do arquivo. A gravação usa Web Locks para serializar alterações entre abas do mesmo navegador. Isso não é um protocolo de sincronização entre dispositivos.

PWA: manifest, ícones locais, fontes locais e service worker de produção. Após a primeira carga com instalação do cache concluída, a interface e as rotas carregam offline; os registros ficam no armazenamento local separado. A instalação depende do navegador/HTTPS ou localhost. A atualização do worker aguarda encerrar as abas antigas, sem apagar os registros.

## Firebase opcional
O app funciona sem conta. A integração disponível é **backup manual privado**, não sincronização automática. Não há implantação automática nem credenciais reais neste repositório.
1. Configure seu próprio projeto Firebase, Authentication com e-mail/senha e Cloud Firestore.
2. Crie sua conta de atleta no console do Authentication. Não há cadastro ou concessão de administração no cliente.
3. Copie `.env.example` para `.env.local` e preencha somente a configuração web pública do projeto. Nunca coloque service account/chave administrativa em variáveis `VITE_*`.
4. Antes de usar backups, publique as regras de `firestore.rules` no projeto correto. A configuração usa `/users/{uid}/backups/latest`, negando os demais caminhos.
5. Reinicie o Vite. Perfil → Backup privado → Entrar. Só o botão de enviar substitui o backup da conta. O sucesso aparece após confirmação do servidor. Offline: envio/restauração ficam desabilitados.

O backup é um snapshot JSON validado no cliente (limite 900 KB). Regras validam dono, envelope, tamanho e timestamp; não fazem parsing do domínio dentro da string JSON. Contas distintas não acessam backups umas das outras. Os dados locais pertencem ao aparelho, continuam nele após logout e não são trocados automaticamente ao alternar conta; não use em aparelho compartilhado como se houvesse perfis locais isolados.

## Comandos de validação
```powershell
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:rules
```
`test:rules` requer Firebase CLI instalado e Java 21. Usa somente `demo-hybrid-strength` no emulador local; não acessa produção. Os testes E2E iniciam o preview na porta 4173; rode build antes. Playwright salva traces nas falhas. Para capturar screenshots de QA em contexto isolado, deixe o preview rodando na porta 4173 e execute `node scripts/capture.mjs`; arquivos em `docs/evidencias/`.

## Continuação
Leia `OPENCODE.md`: estado atual, testes reais, limitações e próximos passos. Requisitos originais e imagem em `docs/referencias/`. As seis configurações originais do Claude permanecem intactas em `claude-original/`; os componentes desta implementação foram criados pelo Codex.
