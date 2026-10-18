# Matriz de testes — Hybrid Strength

Aplicação agora implementada. Resultados reais da rodada Codex em `VALIDACAO.md`; não interpretar todos os critérios abaixo como aprovados só porque há testes básicos. Usar dados de teste isolados, relógio controlado e oráculos independentes. Nunca usar a função testada para calcular o próprio esperado.

## Domínio — Vitest
| ID | Cenário | Resultado esperado |
|---|---|---|
| D01 | Percentual de TM validado 160 kg a 75% | 120 kg; TM ausente não vira máximo histórico automaticamente |
| D02 | Arredondar 131 kg a 2,5 kg; incremento inválido | 130 kg se política for mais próximo; 0/negativo/NaN rejeitados; definir empates e arredondamento conservador antes de testar limites |
| D03 | e1RM | Fixar fórmula/versionamento e exemplos calculados independentemente; rejeitar reps inválidas/NaN; distinguir estimativa de teste real |
| D04 | Atleta 100 kg, lastro +25 kg | Total 125 kg; registros preservam 100 e 25; alteração posterior do perfil não muda peso histórico da sessão |
| D05 | RPE alvo 7, real 8 ou 9 | Sugestão dentro de redução 2,5–5% ou 5–10%, respectivamente; motivo e decisão registrados; arredondamento não anula silenciosamente a redução |
| D06 | RPE abaixo do alvo | Aumento conservador respeita teto; não aumenta por histórico antigo sem desempenho/prontidão |
| D07 | Sono 5,9 h; dor 3 e 4 | Sono <6 gera sugestão; dor 3 não cruza regra >3; dor 4 bloqueia progressão do exercício provocador; ausente não vira zero |
| D08 | Gerar ciclo completo | 12 semanas ×5 dias, sábado/domingo sem treino; Pull seg/qua/sex; nenhum Pull consecutivo, incluindo virada de semana |
| D09 | S1/S4/S8/S11/S12 | Prescrições correspondem à fonte; deload/taper reduzem volume; dias de volume preservam seu teto; S12 tem agenda especial |
| D10 | Orçamento de tempo | Somar aquecimento, OAPU, rampas, séries, descansos e transições. Testar exatamente 80 e >80; remover acessórios por prioridade; inviável permanece sinalizado |
| D11 | OAPU seg/qua/sex | Exatamente 30 min iniciais; protocolos e lados corretos; teto RPE 7/6/5; sem falha/excêntrica máxima automática |
| D12 | Sessão perdida | Sem dobra, sem deslocamento que crie Pull consecutivo |
| D13 | PR | Histórico, e1RM e testado separados; tentativa falhada não vira PR; no máximo três; terceiro exige prontidão; sem 105% automático |
| D14 | Entrada e unidades | Campo vazio diferente de zero; carga adicional zero válida; assistência separada do lastro; reps inteiras; RPE e escalas dentro de limites documentados; kg/metros/segundos não misturados |
| D15 | Carga prescrita diferente da realizada | Histórico e métricas usam executado; prescrição permanece preservada; aquecimento/assistência não contam como PR de main lift |

## Estado, persistência e segurança
| ID | Cenário | Resultado esperado |
|---|---|---|
| P01 | Duplo clique/início em duas abas/retry | Retoma sessão canônica; não duplica sessão nem série concluída |
| P02 | Salvar, recarregar, navegar e reabrir | Perfil, treino, série, recuperação e timestamps restaurados; nenhum dado fictício inserido no histórico |
| P03 | Offline após carga inicial, registrar e recarregar | Registro recuperável no armazenamento previsto; estado pendente explícito; cache da UI sozinho não conta como persistência |
| P04 | Reconectar após gravação offline | Confirmação do servidor antes de exibir sincronizado; retries idempotentes; erro de permissão visível sem perder silenciosamente a edição |
| P05 | Dois dispositivos editam a mesma série | Política de conflito documentada e exercitada; nenhuma promessa de exclusividade offline sem mecanismo correspondente |
| S01 | Sem autenticação, ler/escrever cada coleção | Negado nas regras, não apenas escondido na UI |
| S02 | Usuários A e B | A acessa dados próprios; B não lê/lista/escreve/exclui dados de A; testar IDs conhecidos e queries |
| S03 | Payload com ownerId adulterado, tipos inválidos, campos extras | Negado; criação e atualização validam dono e campos; usuário não se atribui administração |
| S04 | Logout e login de outra conta no aparelho | Dados privados anteriores não aparecem na UI da outra conta; política de cache por usuário explícita |

S01–S03 exigem testes de regras no Firebase Emulator, com testes positivos também. Mock de repositório não valida regras. Emulador não é produção. Não usar conta/dados de Adriano nem dados de produção nos testes.

## Fluxos E2E — Playwright
| ID | Passos | Resultado esperado |
|---|---|---|
| E01 | Criar perfil e abrir segunda S1 | Máximos antigos rotulados; OAPU primeiro; pull-up 4×6 +10 kg RPE 6–7; nada executado automaticamente |
| E02 | Concluir OAPU, lançar série, concluir e editar | Execução persiste; descanso inicia uma vez; edição não duplica série; totais recalculados |
| E03 | Mudar tela, reload e simular aba em segundo plano | Relógio deriva de timestamps, não de contagem de ticks; 30 min OAPU não encurtam por navegação; retomada consistente |
| E04 | Avançar relógio para 60/70/75/80 min | Avisos nos marcos sem spam; acessórios removíveis identificados; aos 80 sessão permanece aberta até ação explícita |
| E05 | Ajustar/pular descanso e pausar/retomar | Não cria valores negativos nem altera séries; semântica de pausa consistente com limite total e persistida |
| E06 | Finalizar sessão e abrir histórico/performance | Dados executados corretos, PRs separados, aderência sem contar rascunho como concluído; filtros reais e estados vazios |
| E07 | Registrar recuperação e abrir próximo treino | Justificativa da autorregulação e decisão do usuário preservadas; bloqueio de progressão por dor exercitado |
| E08 | S12, terceira tentativa e tentativa falhada | Agenda especial e prontidão respeitadas; falha não cria recorde |
| E09 | Alternar offline/online e reload | Fluxo P03/P04 com persistência real do ambiente; distinguir fixture, mock e emulador no relatório |

## Visual, acessibilidade e PWA
- V01: 320, 390, 768 e 1440 px; retrato/paisagem; sem overflow lateral da página. Tabs de exercícios podem rolar internamente. Rodapé/teclado/safe-area não cobrem inputs/CTA.
- V02: teclado completo, foco visível, nomes acessíveis nos botões +/-/pausa, mensagens de erro associadas e contraste WCAG AA nos dois temas. Timer não anuncia cada segundo no leitor de tela.
- V03: zoom 200%, texto longo, valores grandes, reduced-motion e estado offline/erro/vazio; alvos >=44 px.
- V04: manifest/ícones válidos, service worker servido em produção local, reload offline após primeira visita. Verificar instalação no navegador compatível e atualização de versão sem perda de sessão; não declarar instalável só porque existe manifest.
- Comparação visual usa a estrutura da imagem, não valores ilustrativos nem seus cortes de layout. Salvar screenshots por viewport como evidência.

## Execução e entrega
Depois de existir package.json, confirmar gerenciador pelo lockfile e scripts disponíveis. Criar scripts equivalentes para lint, typecheck (`tsc --noEmit`), unitários, regras, E2E e build, documentando os nomes exatos. Não executar comandos presumidos e relatar que passaram.

Ordem: instalar pelo lockfile → lint/typecheck → unitários → emulador/regras → build → servidor de produção local e E2E/PWA. E2E de autenticação deve usar emulador ou conta de teste autorizada. Casos temporais usam relógio controlado; não esperar 80 minutos reais. Não remover validação para resolver teste falho.

Relatório compacto por execução:
```
Data / revisão:
Ambiente: local | mock | Firebase Emulator | Firebase real
Comando exato → exit code / passou-falhou
IDs cobertos:
Falhas e reprodução curta:
Arquivos alterados:
Pendências / próxima etapa:
```

Não marcar matriz inteira como aprovada por build ou screenshot. Caso não automatizado permanece manual/pendente com indicação explícita.
