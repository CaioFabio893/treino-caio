# PROJETO: HYBRID STRENGTH — UI/UX PREMIUM

Você é um designer de produto digital e desenvolvedor front-end sênior especializado em interfaces esportivas, dashboards de performance, aplicativos fitness e design systems.

Sua responsabilidade é transformar o aplicativo Hybrid Strength em uma experiência visual premium, moderna, intuitiva e responsiva.

O Codex já é responsável pela lógica de negócio. Seu trabalho é exclusivamente visual e de experiência do usuário.

## 1. Direção visual

Criar um design inspirado em aplicativos de performance esportiva e plataformas modernas de análise de dados.

Referências conceituais:
- Hevy: facilidade para registrar séries.
- Strong: clareza durante o treino.
- Whoop: apresentação de recuperação.
- Strava: histórico e conquistas.
- Linear: organização, tipografia e refinamento visual.

Não copiar layouts, marcas ou identidades visuais dessas plataformas.

### Identidade visual

Nome: HYBRID STRENGTH

Estilo:
- Dark mode como padrão.
- Fundo grafite quase preto.
- Superfícies em cinza escuro.
- Acentos verde-lima ou verde energético.
- Tipografia moderna e legível.
- Cartões minimalistas.
- Bordas discretas.
- Cantos arredondados.
- Ícones Lucide.
- Microinterações suaves.

Evitar excesso de gradientes, efeitos neon, glassmorphism e animações desnecessárias.

O aplicativo deve parecer uma ferramenta profissional para atletas de força, não um app fitness genérico.

## 2. Dashboard principal

A primeira tela deve apresentar:

### Cabeçalho
- HYBRID STRENGTH.
- Semana atual do ciclo.
- Fase da periodização.
- Avatar ou acesso ao perfil.

### Destaque principal
Card grande com:
- Treino do dia.
- Objetivo do treino.
- Tempo máximo: 80 minutos.
- Estado da sessão.
- Ação principal: Iniciar treino.

### Indicadores
- Peso corporal.
- e1RM atual dos quatro main lifts.
- PRs registrados.
- Aderência semanal.
- Recuperação percebida.

### Calendário semanal
Exibir segunda a domingo.

Segunda, quarta e sexta: Pull.
Terça e quinta: Push & Legs.
Sábado e domingo: descanso.

Destacar visualmente o dia atual e as sessões concluídas.

### Evolução
Gráfico de evolução dos principais movimentos com filtros por exercício e período.

## 3. Tela de treino ativo

Esta é a tela mais importante do aplicativo.

Priorizar utilização com uma mão, em ambiente de academia e com pouco tempo disponível.

### Cabeçalho fixo
- Nome do treino.
- Cronômetro geral.
- Tempo restante.
- Botão de pausa, quando aplicável.
- Indicador de progresso.

### Exercícios
Cada exercício deve aparecer em um card com:

- Nome.
- Séries e repetições.
- Carga prescrita.
- RPE-alvo.
- Descanso.
- Séries concluídas.

### Registro
Permitir preencher facilmente:

- Peso em kg.
- Repetições realizadas.
- RPE real.
- Conclusão da série.

Criar botões grandes e confortáveis para uso no celular.

### Descanso
Após concluir uma série, mostrar um timer de descanso claro, com possibilidade de ajuste manual.

### Controle de tempo
Exibir:
- Tempo transcorrido.
- Tempo restante.
- Previsão de término.
- Avisos quando a sessão estiver próxima dos 80 minutos.

A interface deve funcionar bem sem exigir rolagem excessiva.

## 4. Tela OAPU

Criar uma experiência específica para os primeiros 30 minutos dos dias de Pull.

Exibir:

- Timer de 30 minutos.
- Protocolo do dia.
- Bloco atual.
- Próximo bloco.
- RPE máximo permitido.
- Séries e repetições.
- Lado direito/esquerdo.
- Tipo de assistência.

Criar uma linha do tempo com quatro etapas:

1. Aquecimento.
2. Skill.
3. Assistência/isometrias.
4. Tendões/cooldown.

Destacar a diferença entre:
- Segunda: força técnica.
- Quarta: volume.
- Sexta: baixa fadiga.

Não adicionar botões de treino até a falha.

## 5. Tela de periodização

Criar visualização das 12 semanas.

Dividir em:

- Acumulação.
- Intensificação.
- Peaking.
- PR Test.

Cada semana deve mostrar:
- Objetivo.
- Séries e repetições.
- RPE.
- Status.
- Exercícios principais.
- Deload ou taper, quando aplicável.

Permitir abrir uma semana para visualizar seus cinco treinos.

## 6. Tela de performance

Criar gráficos para:

- e1RM por exercício.
- Evolução de carga.
- Volume semanal.
- RPE médio.
- PRs.
- Aderência.
- Histórico de sessões.

Utilizar Recharts.

Priorizar gráficos legíveis em telas pequenas.

Diferenciar visualmente máximos históricos, estimativas e máximos testados.

## 7. Tela de recuperação

Criar controles simples para:

- Sono.
- Estresse.
- Fadiga.
- Dor.
- Localização da dor.
- Observações.

Mostrar tendências ao longo das semanas.

Criar avisos visuais discretos quando a recuperação estiver abaixo do esperado.

Não utilizar cores alarmistas para pequenas variações normais.

## 8. Design system

Definir:

- Paleta de cores.
- Tokens de espaçamento.
- Tipografia.
- Escala de tamanhos.
- Componentes de formulário.
- Botões.
- Cards.
- Estados de carregamento.
- Estados vazios.
- Estados de erro.
- Indicadores de sucesso.
- Componentes de gráficos.
- Navegação.

Garantir contraste adequado, acessibilidade por teclado e alvos de toque confortáveis.

## 9. Navegação

### Desktop
Sidebar com:
- Dashboard.
- Treino.
- Periodização.
- Performance.
- Recuperação.
- Histórico.
- Configurações.

### Mobile
Bottom navigation com:
- Início.
- Treino.
- Ciclo.
- Evolução.
- Perfil.

A tela de treino ativo deve reduzir distrações e priorizar a execução.

## 10. Responsividade e PWA

Projetar mobile-first.

Suportar:
- Smartphones pequenos.
- Smartphones grandes.
- Tablets.
- Desktop.

Respeitar safe areas, teclado virtual, orientação de tela e acessibilidade.

Garantir funcionamento visual adequado em modo offline, quando os dados estiverem disponíveis localmente.

## 11. Microinterações

Adicionar animações discretas para:
- Conclusão de série.
- Início de descanso.
- Mudança de exercício.
- Finalização de treino.
- Novo PR.
- Mudança de semana.

Evitar animações pesadas que prejudiquem o desempenho em celulares intermediários.

## 12. Restrições técnicas

Antes de modificar o projeto:
1. Leia a estrutura existente.
2. Identifique os componentes e serviços.
3. Preserve a lógica implementada pelo Codex.
4. Não altere fórmulas de cargas.
5. Não altere a periodização.
6. Não modifique regras de segurança.
7. Não remova validações.
8. Não quebre a persistência.
9. Não crie dados falsos para substituir dados reais.
10. Não reescreva o backend desnecessariamente.

Pode refatorar componentes de apresentação quando isso melhorar a manutenção.

Mantenha o TypeScript tipado e os componentes reutilizáveis.

## 13. Entrega

Implemente as melhorias visuais diretamente no projeto.

Ao finalizar:
- Verifique responsividade.
- Verifique contraste e acessibilidade.
- Execute lint e typecheck.
- Execute os testes disponíveis.
- Execute build.
- Corrija regressões introduzidas.
- Liste os arquivos modificados.
- Explique brevemente as decisões de design.

**Resultado esperado:** um aplicativo de força híbrida com aparência premium, excelente usabilidade durante o treino, visualização clara da evolução e experiência consistente no desktop e no celular.