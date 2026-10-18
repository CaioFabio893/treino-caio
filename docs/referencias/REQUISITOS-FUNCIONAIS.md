# PROJETO: HYBRID STRENGTH — Sistema de Periodização de Força

Você é um engenheiro de software sênior especializado em aplicações web, arquitetura, testes automatizados e sistemas de acompanhamento esportivo.

Sua missão é desenvolver um aplicativo completo, responsivo e instalável como PWA para gerenciar um programa de força híbrida de 12 semanas, combinando Powerlifting, Streetlifting, Strongman adaptado e progressões de One Arm Pull-up (OAPU).

**IMPORTANTE:** Não desenvolva apenas uma interface estática. O sistema precisa ter regras de negócio funcionais, persistência de dados, cálculos, acompanhamento de evolução e testes.

## 1. Stack tecnológica

Utilize preferencialmente:

- Next.js com TypeScript e App Router.
- Tailwind CSS.
- shadcn/ui e Lucide Icons.
- Firebase Authentication.
- Cloud Firestore para persistência.
- Recharts para gráficos.
- PWA com suporte a instalação e leitura offline.
- Vitest para testes unitários.
- Playwright para testes end-to-end.

Caso o repositório já possua uma stack, inspecione a arquitetura antes de modificar dependências. Reaproveite a estrutura existente sempre que possível.

Evite dependências pesadas desnecessárias.

## 2. Perfil inicial do atleta

Criar um perfil editável com os seguintes valores:

- Peso corporal: 100 kg.
- Back Squat: 200 kg (1RM antigo).
- Deadlift: 220 kg (1RM antigo).
- Bench Press: 170 kg (1RM antigo).
- Weighted Dip: +110 kg (1RM adicional antigo).
- Weighted Pull-up: +40 kg (1RM adicional antigo).
- OAPU: nível assistido.
- Sono: 6–7 horas.
- Estresse inicial: 5/10.
- Dor atual: 0/10.
- Horário disponível: 18h30–20h.
- Limite efetivo de sessão: 80 minutos.
- Semana inicial: 1.

Os 1RMs antigos não devem ser tratados como máximos atuais confirmados. Criar campos separados para 1RM histórico, e1RM estimado e training max validado.

## 3. Restrições obrigatórias

O sistema deve impedir que um treino gerado viole:

1. Máximo de 80 minutos por sessão, incluindo aquecimento, rampas, descansos, execução e transições.
2. Cinco dias semanais: segunda a sexta.
3. Sábado e domingo são descanso total.
4. Pull exclusivamente segunda, quarta e sexta, sem dias consecutivos.
5. Sem bi-sets ou supersets.
6. Nos dias de Pull, os primeiros 30 minutos são exclusivos de OAPU.
7. Main lifts: Back Squat, Deadlift, Weighted Dip e Weighted Pull-up.
8. Nenhum exercício de OAPU até a falha.
9. Arredondamento de cargas para incrementos configuráveis, inicialmente 2,5 kg.
10. Progressão por RPE e desempenho, não apenas por percentual fixo.

Se o tempo calculado ultrapassar 80 minutos, o algoritmo deverá remover acessórios de menor prioridade, nunca eliminar aquecimento essencial ou reduzir os 30 minutos de OAPU.

Não permitir sessões com estimativa superior a 80 minutos sem sinalizar que o plano precisa ser corrigido.

## 4. Microciclo semanal

### Segunda — Pull 1: Força

- OAPU: 30 minutos.
- Rampa Weighted Pull-up.
- Weighted Pull-up: 4×6, carga inicial +10 kg, RPE 6–7.
- Remada apoiada: 3×8, RPE 8.
- Rosca bíceps: 2×10–12, RPE 8.
- Facepull: 2×12–15, RPE 8.

Tempo-alvo: 78 minutos.

### Terça — Push & Legs 1

- Aquecimento geral e rampas.
- Back Squat: 4×6, carga inicial 130 kg, RPE 6–7.
- Weighted Dip: 4×6, carga inicial +50 kg, RPE 6–7.
- Cadeira extensora: 2×12–15.
- Elevação lateral: 2×12–15.
- Farmer's Walk: 3×30 metros, RPE 7.

Tempo-alvo: 79 minutos.

### Quarta — Pull 2: Volume

- OAPU: 30 minutos.
- Rampa Pull-up.
- Pull-up técnico: 3×6–8, peso corporal ou assistência, RPE máximo 7.
- Remada serrote: 3×10 por lado.
- Crucifixo invertido: 2×12–15.

Tempo-alvo: 73 minutos.

### Quinta — Push & Legs 2

- Aquecimento geral e rampas.
- Back Squat pausado: 3×8, 110 kg, RPE máximo 7.
- Supino reto: 3×6, 105 kg, RPE máximo 7.
- Weighted Dip volume: 3×8, +30 kg, RPE máximo 7.
- Passadas com halteres: 2×10 por perna.

Tempo-alvo: 75 minutos.

### Sexta — Pull 3: Hinge

- OAPU leve: 30 minutos.
- Rampa Deadlift.
- Deadlift: 4×6, carga inicial 145 kg, RPE 6–7.
- Mesa flexora: 3×12.
- Prancha com carga: 3×30–45 segundos.

Tempo-alvo: 77 minutos.

Esses tempos são estimativas iniciais, não constantes garantidas. O motor deverá recalculá-los com base nos descansos, séries, duração real e transições.

## 5. Motor de periodização — 12 semanas

Implementar três blocos:

### Bloco 1 — Acumulação (semanas 1–4)

- S1: 4×6, RPE 6–7.
- S2: 4×5, RPE 7–7,5.
- S3: 4×4, RPE 7,5–8.
- S4: deload, 3×5 ou menos conforme recuperação, RPE 5–6.

### Bloco 2 — Intensificação (semanas 5–8)

- S5: 4×4, RPE 8.
- S6: 4×3, RPE 8–8,5.
- S7: 5×2, RPE máximo 9.
- S8: deload, 3×3, RPE 6.

### Bloco 3 — Peaking e PR (semanas 9–12)

- S9: 3×2, RPE 8–9.
- S10: 2–3×1, RPE 8,5–9.
- S11: taper, 2×2, RPE 6–7, com redução substancial do volume.
- S12: testes de PR com até três tentativas por movimento.

Não obrigar 95–98% do 1RM antigo quando o RPE ou a velocidade de execução indicarem carga excessiva.

### Dias de volume

- Pull-up volume: 3×6–8, RPE máximo 7.
- Squat pausado: 3×8, RPE máximo 7.
- Dip volume: 3×8, RPE máximo 7.

Os percentuais serão apenas referências auxiliares. A carga deve ser compatível com as repetições e o RPE.

### Cálculo de cargas

Criar funções puras e testáveis para:

- Percentual do training max.
- Arredondamento por incremento.
- e1RM estimado por carga e repetições.
- Progressão e regressão por RPE.
- Comparação entre carga prescrita e executada.
- Identificação de PRs.

Para Weighted Dip e Weighted Pull-up, manter separadamente:

- Peso corporal.
- Lastro adicional.
- Peso total movimentado.

Não aplicar automaticamente percentuais do lastro máximo como equivalentes à intensidade fisiológica do peso total. Priorizar RPE e dados históricos de desempenho.

## 6. Progressões de OAPU

Criar três protocolos fixos de 30 minutos.

**Segunda — Força técnica**
- Aquecimento específico: 7 minutos.
- OAPU assistido: 4×2 por braço, RPE 6–7.
- Isometria assistida: 2×5 segundos por braço.
- Mobilidade e cooldown: 5 minutos.

**Quarta — Volume técnico**
- Aquecimento: 7 minutos.
- OAPU assistido: 3×4 por braço, RPE máximo 6.
- Controle escapular: 2×5 por braço.
- Cooldown: 5 minutos.

**Sexta — Baixa fadiga**
- Aquecimento: 8 minutos.
- OAPU muito assistido: 3×2 por braço, RPE máximo 5.
- Isometrias leves: 2×3 segundos por braço.
- Cooldown: 6 minutos.

Permitir registrar o tipo de assistência, repetições, duração das isometrias, RPE, lado direito/esquerdo e eventuais sintomas.

Nunca prescrever falha ou excêntricas máximas automaticamente.

## 7. Autoregulação

Implementar regras configuráveis:

- RPE 1 ponto acima do alvo: sugerir redução de 2,5–5%.
- RPE 2 pontos acima: sugerir redução de 5–10% e avaliar corte de séries.
- Sono inferior a 6 horas: sugerir redução de volume ou intensidade.
- Dor articular/tendínea acima de 3/10: bloquear progressão do exercício provocador e exibir alerta de segurança.
- Dor persistente: recomendar avaliação profissional.
- RPE abaixo do alvo: permitir aumento conservador, respeitando teto de esforço.
- Sessão perdida: não compensar com sessões dobradas nem criar Pull consecutivo.

As recomendações precisam mostrar o motivo e permitir registro da decisão do usuário.

## 8. Semana 12 — PR Test

Criar protocolo:

- Segunda: Weighted Pull-up.
- Terça: Back Squat.
- Quarta: OAPU técnico leve, sem testes.
- Quinta: Weighted Dip.
- Sexta: Deadlift.

Até três tentativas por main lift:

1. Abertura conservadora.
2. Segunda tentativa baseada na velocidade, RPE e técnica.
3. Terceira tentativa somente se houver prontidão.

Nunca prescrever 105% automaticamente.

Registrar PR anterior, tentativa, resultado, RPE e novo PR.

## 9. Gestão de fadiga

Criar dashboard de recuperação com:

- Sono diário.
- Estresse do trabalho.
- Fadiga percebida.
- Dor e localização.
- RPE real.
- Volume semanal por grupo muscular.
- Frequência de exercícios.
- Carga total levantada.
- Evolução de e1RM.
- Indicadores de aderência.

Usar essas informações como sinais de recuperação, sem alegar medir diretamente fadiga do sistema nervoso central.

## 10. Funcionalidades do aplicativo

Implementar:

- Dashboard principal.
- Calendário de 12 semanas.
- Treino do dia.
- Cronômetro da sessão de 80 minutos.
- Cronômetro exclusivo do OAPU de 30 minutos.
- Timer de descanso por exercício.
- Registro de séries, repetições, carga e RPE.
- Histórico de treinos.
- Gráficos de força.
- Gráficos de volume.
- Registro de PRs.
- Registro de recuperação.
- Gestão de exercícios.
- Configurações do atleta.
- Modo escuro e claro.
- Instalação PWA.

### Regras do cronômetro

O relógio da sessão deve contar tempo real desde o início, sem reiniciar quando o usuário trocar de tela.

O cronômetro OAPU deve ocupar os primeiros 30 minutos de Pull.

Exibir avisos aos 60, 70, 75 e 80 minutos.

Se o tempo estiver acabando, mostrar os acessórios que podem ser removidos.

Não marcar uma sessão como concluída automaticamente ao atingir 80 minutos.

## 11. Banco de dados

Projetar coleções ou entidades para:

- users
- athleteProfiles
- trainingCycles
- trainingWeeks
- trainingSessions
- exercises
- exercisePrescriptions
- completedSets
- personalRecords
- readinessLogs
- oapuProgress
- trainingSettings

Garantir isolamento de dados por usuário autenticado, validação de entradas e regras de segurança do Firestore.

Registrar datas e timestamps de maneira consistente.

## 12. Testes obrigatórios

Criar testes para:

- Cálculo de percentuais.
- Arredondamento de cargas.
- Ajuste por RPE.
- Estimativa de 1RM.
- Separação entre lastro e peso total.
- Deload e taper.
- Geração das 12 semanas.
- Limite de 80 minutos.
- OAPU obrigatório nos dias de Pull.
- Ausência de Pull consecutivo.
- Descanso aos sábados e domingos.
- Prevenção de sessões duplicadas.
- Persistência dos treinos.
- Recuperação de dados offline.
- Controle de acesso por usuário.

## 13. Qualidade e entrega

Antes de implementar:

1. Inspecione o repositório.
2. Identifique a estrutura existente.
3. Defina a arquitetura.
4. Crie um plano de implementação por etapas.
5. Execute as etapas, priorizando um MVP funcional.
6. Rode lint, typecheck, testes e build.
7. Corrija os erros encontrados.
8. Documente instalação, configuração e execução.

Não invente resultados de testes.

Não sobrescreva trabalho existente sem necessidade.

Não altere as regras esportivas apenas para simplificar o código.

**Resultado esperado:** um aplicativo funcional, testado, responsivo, persistente e instalável, capaz de acompanhar as 12 semanas e ajustar as cargas com base no desempenho real.