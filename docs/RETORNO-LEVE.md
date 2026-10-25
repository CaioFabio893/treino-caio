# Retorno leve e progressão gradual — 25/10/2026

Pedido mais recente: usuário relatou aproximadamente 135 kg no back squat, 3×6 ou 4×6, após tempo parado; não lembra o volume e não informou RPE. Quer começar leve em TODOS os movimentos e aumentar aos poucos. Não transformar o relato em sessão executada nem RM confirmado.

## Nova entrada
- Primeira semana: principais 3×6, RPE teto 6. Segunda: 3×6/RPE 6,5; terceira: 3×6/RPE 7. Menos volume e esforço do que na versão anterior.
- %RM pesado S1–12: 60 / 62,5 / 65 / 50 / 67,5 / 70 / 72,5 / 55 / 75 / 77,5 / 60 / 80. São alvos de calendário, não obrigação de levantar mais.
- Com os históricos iniciais e incremento 2,5 kg: squat 120 kg, supino 100 kg, terra 130 kg, dip +25 kg; barra bilateral com assistência 17,5 kg pelo cálculo PC100 + RM de lastro40 a 60%. Isso não afirma capacidade atual dos outros movimentos. RPE e execução calibram.
- Volume barra/dip: 55 / 57,5 / 60 / 45 / 60 / 62,5 / 65 / 50 / 65 / 67,5 / 50 / 55%; pausado cinco pontos abaixo. Acessórios com RM próprio: 50–55% nas semanas normais, 40% nas leves; sem RM continuam por RPE/manual. Desenvolvimento reduzido. OAPU e acessórios em RPE 6 nas duas primeiras semanas.

## Controle contra saltos
A interface passa o histórico real para a geração da ficha. Sem execução registrada daquele ID no programa/ciclo atual, carga não supera a entrada da primeira semana, mesmo ao abrir S10 ou S12. Mudar só a semana não autoriza salto.

Última sessão finalizada contendo o exercício: aumento só após TODAS as séries bem-sucedidas, quantidade no topo da faixa anterior, RPE dentro do teto anterior/atual (até8), carga/assistência consistentes e PC sem mudança nos exercícios com lastro. Limite: um incremento configurado, nunca maior que2,5kg. Se o incremento disponível for maior, manter e ajustar manualmente a configuração. Séries parciais ou condições não atendidas mantêm/reduzem; falha ou RPE pelo menos1 acima do atual limita a carga efetiva a aproximadamente95%, com arredondamento conservador.

Percentual exibido junto dos kg reflete a carga efetivamente limitada/arredondada. Alvo percentual semanal também é identificado quando diferente. A progressão por histórico é por ID, sem copiar remadas/máquinas diferentes. Sugestões continuam opcionais; nenhuma série é criada automaticamente.

S12 vira janela opcional de teste, sem sequência automática90/95/100% do recorde antigo. Prescrição permanece limitada pelo histórico; repetir confortável é válido. PR só com preparação/prontidão, sem obrigatoriedade de teste. Série assistida não conta como PR com lastro.

## Preservação e uso
Snapshots e registros já executados permanecem. Em treino já aberto, botão Atualizar cargas e % pelos meus RMs recalcula somente exercícios ainda sem séries; utiliza PC da sessão e histórico. Os RMs antigos permanecem como históricos provisórios; 135kg×6 não foi salvo como RM.

Verificação: 56 testes unitários passaram, incluindo novos casos de entrada120, bloqueio de salto sem histórico, limite2,5kg após execução, falha/parcial e aplicação aos outros movimentos. Types/lint/build/publicação registrados em PUBLICACAO.md. Sem testes de navegação/E2E, conforme instrução do usuário. Nenhum acesso a app/projeto da Louise; Firebase continua desativado.
