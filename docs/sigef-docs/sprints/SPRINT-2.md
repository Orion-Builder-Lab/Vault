# Sprint 2 — Compras, Estoque, Financeiro e SPED
**Duração:** Semanas 3 e 4 · ~180h · 2 devs

---

## Objetivo da Sprint

Ao final desta sprint o SIGEF estará **completo em produção** com:
- Ciclo de compra da Enfratec (XML → estoque → conta a pagar)
- Controle de estoque com Custo Médio Ponderado
- Emissão em lote das NFS-e para o Sicredi
- Módulo financeiro completo (CR, CP, fluxo de caixa)
- Conciliação bancária com importação de extrato OFX
- SPED Fiscal gerado automaticamente para a Enfratec

---

## Meta de Aceite da Sprint

✅ Upload de XML de fornecedor importa nota e atualiza estoque  
✅ CMP recalculado corretamente após cada entrada  
✅ Conta a Pagar criada com parcelamento (ex: 12x R$ 583,17)  
✅ Emissão em lote: 71 NFS-e para agências Sicredi processadas  
✅ Baixa automática de estoque ao emitir NF-e de venda  
✅ Dashboard de fluxo de caixa mostra saldo atual + projeções  
✅ Upload de extrato OFX importa sem duplicar  
✅ Conciliação automática faz match por valor + tolerância 3 dias  
✅ Relatório de inconsistências exportado  
✅ Resumo anual exportado em XLSX  
✅ SPED Fiscal .txt gerado e válido no PVA da Receita Federal  
✅ Sistema em produção (Vercel + Railway)  

---

## Tarefas Detalhadas

### FAT-08 · Emissão em Lote de NFS-e
**Dev:** Tech Lead · **Estimativa:** 10h

**Descrição:**
Funcionalidade crítica para a Múltipla: emitir ~71 NFS-e de uma vez para as agências Sicredi no início de cada mês.

**Tela:** `/faturamento/lote`

**Fluxo da UI:**
1. Usuário seleciona "Grupo de clientes" → exibe todas as agências Sicredi cadastradas
2. Define dados comuns: código do serviço, discriminação base, competência, valor padrão
3. Pode sobrescrever valor por CNPJ individualmente
4. Clica em "Emitir Lote"
5. Barra de progresso em tempo real: "43 de 71 emitidas..."
6. Resultado: lista com status de cada emissão (✅/❌)

**API:**
```
POST /api/faturamento/lote
Body: {
  clienteIds: string[],
  servicoBase: { codigoServico, discriminacao, dataCompetencia },
  valorPadrao: number,
  valoresPorCliente?: Record<string, number>
}

GET /api/faturamento/lote/status/:jobId  → Polling de progresso
```

**Processamento backend:**
```typescript
// Processar sequencialmente com 500ms entre cada
for (const clienteId of clienteIds) {
  await emitirNFSe({ clienteId, ...dadosBase });
  await sleep(500);
  emitirEvento({ jobId, progresso: i + 1, total: clienteIds.length });
}
```

**Critério de aceite:**
- 71 clientes processados sem timeout (cada um leva ~3s de polling)
- Notas com erro ficam marcadas para reemissão manual
- Todas as 71 Contas a Receber criadas automaticamente

---

### FAT-10 · Envio de NF por E-mail
**Dev:** Dev Pleno · **Estimativa:** 4h

**Descrição:**
Enviar XML e DANFE para o e-mail do cliente ao autorizar ou sob demanda.

**API:** `POST /api/faturamento/notas/:id/enviar-email`

**Template de e-mail (Resend):**
- Assunto: `Nota Fiscal NFS-e nº {numero} — {empresa}`
- Corpo: valor, data, período de competência
- Anexos: XML + DANFE PDF

**Critério de aceite:**
- E-mail enviado com ambos os arquivos em anexo
- Falha no envio não cancela a nota

---

### EST-01/02 · Upload e Parser de XML de Fornecedor
**Dev:** Tech Lead · **Estimativa:** 18h

**Descrição:**
Importação da nota fiscal eletrônica dos fornecedores da Enfratec (S1 Comércio, FSEG, Segurança 1).

**Tela:** `/compras/importar-xml`

**Fluxo:**
1. Upload do arquivo XML da NF-e do fornecedor
2. Parser extrai: emitente, itens (descrição, NCM, CFOP, qtd, valor), totais
3. Validação da chave de acesso na SEFAZ
4. Matching automático dos itens com o catálogo interno (por NCM)
5. Tela de pré-visualização:
   - Fornecedor (criar novo se não existir)
   - Tabela de itens com match: ✅ automático ou ❓ selecionar manualmente
   - Total, frete, ICMS, IPI
   - Data de entrada, parcelas, vencimento da 1ª parcela
6. Usuário confirma ou ajusta e clica em "Confirmar Entrada"

**API:**
```
POST /api/compras/xml       → Upload XML, retorna pré-visualização
POST /api/compras/confirmar → Confirma (cria NotaCompra, atualiza estoque, cria CPs)
```

**Critério de aceite:**
- XML da S1 Comércio / FSEG importado sem erros
- Chave de acesso validada na SEFAZ antes de aceitar
- Itens sem match são sinalizados para seleção manual

---

### EST-03/04 · Entrada no Estoque + Contas a Pagar
**Dev:** Tech Lead · **Estimativa:** 10h

**Descrição:**
Ao confirmar a nota de compra, dois processos automáticos acontecem em transaction:
1. Entrada no estoque com recálculo do CMP
2. Criação de N parcelas em Contas a Pagar

**Implementação do CMP:**
```typescript
novoCMP = (qtdAtual × cmpAtual + qtdEntrada × custoEntrada) / (qtdAtual + qtdEntrada)
```

**Parcelamento:**
- Usuário informa na tela de confirmação: N parcelas e vencimento da 1ª
- Sistema gera N registros em `contas_pagar` com datas mensais
- Ex: 12x R$ 583,17 → 12 contas_pagar com vencimentos de jan a dez

**Critério de aceite:**
- CMP calculado corretamente (testar com 2 entradas sequenciais)
- 12 parcelas criadas com datas corretas
- Tudo dentro de uma única transaction (se uma falha, reverte tudo)

---

### EST-05 · Tela de Saldo de Estoque
**Dev:** Dev Pleno · **Estimativa:** 8h

**Descrição:**
Visão atual do estoque da Enfratec.

**Tela:** `/estoque/saldo`

**Colunas:** Código, Descrição, Unidade, Saldo atual, Custo médio (R$), Valor total, Estoque mínimo, Situação

**Situações:**
- ✅ OK (saldo > mínimo)
- ⚠️ Crítico (saldo ≤ mínimo)
- 🔴 Zerado (saldo = 0)

**Filtros:** Busca texto, situação (OK/Crítico/Zerado)

**Critério de aceite:**
- Saldo atualizado em tempo real após importação de XML
- Produtos zerados aparecem em vermelho

---

### EST-06 · Baixa Automática de Estoque
**Dev:** Tech Lead · **Estimativa:** 6h

**Descrição:**
Ao autorizar uma NF-e de venda na Enfratec, dar baixa automática no estoque para cada item.

**Integração com FAT-02:**
- Após confirmar autorização da NF-e
- Para cada item: chamar `darBaixaEstoque(produtoId, quantidade, notaFiscalId)`
- Criar registro em `movimentacoes_estoque` com tipo `SAIDA_VENDA`

**Critério de aceite:**
- Emitir NF-e com 5 UN do produto X → saldo diminui 5
- Movimentação registrada com nota fiscal vinculada
- Alerta se saldo ficar negativo (mas não bloquear)

---

### EST-07 · Ajuste Manual de Estoque
**Dev:** Dev Pleno · **Estimativa:** 6h

**Descrição:**
Para acertos de inventário físico vs sistema.

**Tela:** `/estoque/ajuste/novo`

**Campos:**
- Produto (busca)
- Tipo: Ajuste positivo / Ajuste negativo
- Quantidade
- Custo unitário (para ajuste positivo)
- Justificativa (mín. 20 caracteres, obrigatória)

**Fluxo de aprovação:**
- `almoxarife` cria o ajuste com status PENDENTE_APROVACAO
- `admin` ou `financeiro` aprovam em `/estoque/ajuste/pendentes`
- Ao aprovar: saldo atualizado e movimentação registrada

**Critério de aceite:**
- Almoxarife não pode aprovar o próprio ajuste
- Ajuste pendente não altera o saldo até aprovação

---

### EST-08 · Histórico de Movimentações
**Dev:** Dev Pleno · **Estimativa:** 6h

**Descrição:**
Rastreabilidade completa de toda movimentação de estoque.

**Tela:** `/estoque/movimentacoes`

**Filtros:** Produto, período, tipo de movimentação

**Colunas:** Data, Produto, Tipo, Quantidade, Custo unitário, Saldo anterior, Saldo posterior, CMP após, Nota vinculada

**Critério de aceite:**
- Ao clicar na nota vinculada, abre o detalhe da nota
- Histórico de todos os tipos (compra, venda, devolução, ajuste)

---

### EST-09 · Geração do Bloco H
**Dev:** Tech Lead · **Estimativa:** 14h

**Descrição:**
Geração do inventário de estoque no formato SPED (Bloco H).

**Tela:** `/estoque/inventario`

**Campos:**
- Data do inventário (padrão: último dia do mês atual)
- Motivo (dropdown: 05=balanço periódico, 01=abertura, 02=encerramento)

**Tabela de preview:**
- Todos os produtos com saldo > 0 na data selecionada
- Código, descrição, unidade, quantidade, custo médio, valor total

**Botão "Gerar Bloco H":**
- Gera o bloco no formato SPED e passa para o motor SPED (SPD-05)

**API:**
```
GET /api/estoque/snapshot?data=2024-12-31   → Preview do inventário
POST /api/estoque/snapshot                  → Salva snapshot
```

**Critério de aceite:**
- Snapshot gerado com todos os produtos com saldo > 0
- Formato do Bloco H válido quando colado no PVA da Receita

---

### EST-10 · Alerta de Estoque Mínimo
**Dev:** Dev Pleno · **Estimativa:** 4h

**Descrição:**
Enviar e-mail quando o saldo de algum produto cair abaixo do mínimo configurado.

**Trigger:** após qualquer saída de estoque

**E-mail via Resend:**
- Para: e-mail da empresa (Enfratec)
- Assunto: `⚠️ Estoque baixo: {produto}`
- Corpo: saldo atual, mínimo configurado, link para o produto

**Critério de aceite:**
- E-mail enviado após emissão de NF-e que zera o estoque
- Não enviar e-mail duplicado se já está abaixo (enviar apenas quando cruza o limite)

---

### EST-12 · Lançamento Manual de Compra (sem XML)
**Dev:** Dev Pleno · **Estimativa:** 8h

**Descrição:**
Para compras de fornecedores que não emitem NF-e eletrônica ou notas de despesas avulsas.

**Tela:** `/compras/manual/novo`

**Campos:**
- Fornecedor (busca ou criar novo)
- Número da nota, série, data
- Itens: produto, quantidade, valor unitário
- Anexo PDF (scan da nota física)
- Parcelas e vencimento

**Critério de aceite:**
- Lançamento manual cria NotaCompra com status CONFIRMADA
- Estoque atualizado e CPs criadas normalmente

---

### FIN-01 · Contas a Receber
**Dev:** Dev Pleno · **Estimativa:** 12h

**Descrição:**
Módulo de gestão das contas a receber de ambas as empresas.

**Tela:** `/financeiro/contas-receber`

**Cards de resumo:**
- Vencidos (R$) — em vermelho
- Vencem hoje (R$)
- A vencer (R$)
- Recebidos (R$) — em verde
- Total do período (R$)

> 💡 Referência do Conta Azul: Janeiro 2024 da Múltipla tinha Vencidos R$ 133.890,95 e Recebidos R$ 209.286,03

**Filtros:** Status, período (vencimento), cliente, categoria

**Categorias:** Monitoramento, Manutenção, Locação, Gerenciamento, Vendas, Outros

**Ações:**
- Baixa manual: data recebimento, valor, forma de pagamento
- Editar (apenas lançamentos manuais)
- Cancelar

**Critério de aceite:**
- Conta criada automaticamente ao autorizar NF-e ou NFS-e
- Baixa parcial muda status para PARCIAL
- Vencidos aparecem com linha vermelha (como no Conta Azul)

---

### FIN-02 · Contas a Pagar
**Dev:** Dev Pleno · **Estimativa:** 12h

**Descrição:**
Módulo de gestão das contas a pagar (equivalente ao que está no Everflow com 3.716 registros).

**Tela:** `/financeiro/contas-pagar`

**Cards de resumo:** mesma estrutura da CR adaptada para pagamentos

**Filtros:** Status, período (vencimento), fornecedor, categoria

**Categorias de despesa:** Pessoal, Tributário, Operacional, Administrativo, Equipamentos, Outros

**Lançamento manual:**
- Descrição, valor, categoria, vencimento
- Parcelamento: "10x de R$ 653,94" → cria 10 parcelas

**Aprovação:**
- Pagamentos > `empresa.limiteAprovacaoPagamento` ficam em PENDENTE_APROVACAO
- Badge amarelo "Aguardando aprovação"
- Admin/financeiro veem fila de aprovação em `/financeiro/contas-pagar?status=PENDENTE_APROVACAO`

**Critério de aceite:**
- CP criada automaticamente ao confirmar nota de compra
- Parcelamento 12x cria 12 parcelas com datas mensais corretas
- Pagamento > R$ 5.000 bloqueia até aprovação do admin

---

### FIN-03 · Dashboard de Fluxo de Caixa
**Dev:** Dev Pleno · **Estimativa:** 14h

**Descrição:**
Visão financeira em tempo real — o principal diferencial do SIGEF vs os sistemas atuais.

**Tela:** `/financeiro/fluxo-caixa` (também na `/` do dashboard)

**Layout:**
```
[Saldo bancário atual: R$ 84.320,00] [atualizado há 2min]

Projeções:
┌──────────────┬──────────────┬──────────────┐
│   Hoje       │   7 dias     │   30 dias    │
│ +R$ 12.400   │  +R$ 47.200  │ +R$ 120.000  │
│  -R$ 3.200   │  -R$ 18.400  │  -R$ 82.000  │
│  = R$ 9.200  │  = R$ 28.800 │  = R$ 38.000 │
└──────────────┴──────────────┴──────────────┘

[Gráfico de barras: 8 semanas — Entradas vs Saídas]
```

**Seletor admin:** Múltipla / Enfratec / Consolidado

**Critério de aceite:**
- Saldo calculado a partir dos lançamentos bancários conciliados
- Projeções baseadas nas CRs e CPs com status ABERTO
- Gráfico mostra últimas 8 semanas

---

### FIN-04 · Importação de Extrato Bancário OFX
**Dev:** Tech Lead · **Estimativa:** 10h

**Descrição:**
Importar extratos bancários no formato OFX para conciliação.

**Tela:** `/financeiro/conciliacao` → botão "Importar Extrato"

**Fluxo:**
1. Usuário seleciona conta bancária
2. Upload do arquivo OFX (exportado do internet banking)
3. Parser OFX extrai: data, valor, tipo (crédito/débito), descrição, fitId
4. Deduplicação: lançamentos com mesmo fitId são ignorados
5. Exibir resumo: "47 lançamentos importados, 3 duplicados ignorados"

**Critério de aceite:**
- Arquivo OFX do Sicoob importado sem erros
- Mesmo arquivo importado duas vezes não duplica lançamentos (fitId único)
- Créditos e débitos identificados corretamente

---

### FIN-05 · Motor de Conciliação Automática
**Dev:** Tech Lead · **Estimativa:** 14h

**Descrição:**
Algoritmo que associa automaticamente lançamentos do extrato bancário às Contas a Receber e Contas a Pagar.

**Regra de matching:**
- Valor: **exato** (em centavos)
- Data: tolerância de **±3 dias** entre data do extrato e data de vencimento
- Crédito → busca em Contas a Receber abertas
- Débito → busca em Contas a Pagar abertas
- Quando há múltiplos matches → usa o de vencimento mais próximo

**Exemplo do Conta Azul:**
- Crédito R$ 53.566,64 em 02/01/2024 → match com "MONITORAMENTO – Janeiro/24" → ✅ Quitado
- Crédito R$ 23.890,95 em 02/01/2024 → sem match (em aberto no sistema) → ❓ Revisão manual

**Ao fazer match:**
- Atualizar `conciliado=true` no lançamento bancário
- Atualizar status da CR/CP para QUITADO
- Registrar em tabela `conciliacoes`

**API:** `POST /api/financeiro/conciliacao/executar`

**Critério de aceite:**
- R$ 53.566,64 conciliado automaticamente com a conta de mesmo valor ±3 dias
- R$ 23.890,95 (conta em aberto) vai para revisão manual
- Performance: 500 lançamentos processados em < 30s

---

### FIN-06 · Tela de Revisão de Conciliação
**Dev:** Dev Pleno · **Estimativa:** 10h

**Descrição:**
Tela para revisar manualmente os lançamentos do extrato que não foram conciliados automaticamente.

**Tela:** `/financeiro/conciliacao/revisao`

**Layout:**
- Lista dos lançamentos não conciliados (data, valor, descrição do extrato)
- Para cada item, opções:
  - "Vincular a lançamento existente" → busca na lista de CRs/CPs
  - "Criar novo lançamento" → cria CR ou CP com os dados do extrato
  - "Ignorar (tarifa bancária, etc.)" → marca como conciliado sem vincular

**Critério de aceite:**
- Vinculação manual cria registro em `conciliacoes`
- Lançamento "ignorado" não afeta CRs/CPs
- Após revisão completa: "0 itens não resolvidos ✅"

---

### FIN-07 · Relatório de Inconsistências
**Dev:** Dev Pleno · **Estimativa:** 8h

**Descrição:**
Relatório mensal/anual de lançamentos do extrato sem correspondência no sistema.

**Tela:** `/financeiro/relatorios/inconsistencias`

**Filtros:** Período (de/até), conta bancária

**Conteúdo:**
- Lançamentos do extrato não conciliados (possíveis pagamentos não lançados)
- Contas vencidas sem movimentação bancária correspondente
- Total não conciliado em R$

**Exportação:** XLSX

**Critério de aceite:**
- Exportação XLSX com dados do período selecionado
- Separação clara: itens do extrato sem match vs CRs/CPs vencidas sem baixa

---

### FIN-08 · Resumo Anual XLSX
**Dev:** Dev Pleno · **Estimativa:** 8h

**Descrição:**
Relatório anual de entradas e saídas para o contador e para gestão financeira.

**API:** `GET /api/financeiro/relatorios/resumo-anual/:ano`

**Formato do XLSX (12 linhas — uma por mês):**

| Mês | Entradas (R$) | Saídas (R$) | Resultado (R$) | Não conciliados |
|-----|--------------|------------|---------------|----------------|
| Janeiro/2024 | 343.176,98 | 210.000,00 | 133.176,98 | 2 |
| ... | ... | ... | ... | ... |

**Critério de aceite:**
- Arquivo baixa com nome `Resumo-Financeiro-{empresa}-{ano}.xlsx`
- Fórmulas de soma na linha de Total anual

---

### FIN-09 · Categorias de Despesa
**Dev:** Dev Pleno · **Estimativa:** 6h

**Descrição:**
Permitir que o admin configure as categorias de despesa da empresa (usadas no DRE).

**Tela:** Aba "Categorias" dentro de `/cadastros/empresas/[id]`

**Categorias padrão (já no seed):**
- Pessoal, Tributário, Operacional, Administrativo, Equipamentos, Outros

**Admin pode:** adicionar, editar nome, arquivar

**Critério de aceite:**
- Categorias aparecem no dropdown de CPs
- Categoria arquivada não aparece para novos lançamentos

---

### FIN-10 · DRE Simplificado
**Dev:** Dev Pleno · **Estimativa:** 10h

**Descrição:**
Demonstrativo de Resultado do Exercício por período.

**Tela:** `/financeiro/dre`

**Estrutura:**
```
(+) Receita Bruta
(-) Impostos sobre receita (ISS + PIS + COFINS)
(=) Receita Líquida
(-) Despesas por categoria
    Pessoal
    Tributário
    Operacional
    Administrativo
    Equipamentos
    Outros
(=) Resultado Operacional
```

**Fonte dos dados:**
- Receita: notas fiscais autorizadas no período
- Impostos: valorIss + valorPis + valorCofins das notas
- Despesas: CPs pagas por categoria

**Critério de aceite:**
- Múltipla: ISS e PIS/COFINS calculados nas notas
- Enfratec: sem impostos nas notas (Simples — DAS não aparece aqui)
- Filtro por empresa ou consolidado

---

### SPD-01 · Motor SPED — Bloco 0
**Dev:** Tech Lead · **Estimativa:** 12h

**Descrição:**
Gerar o Bloco 0 do SPED Fiscal com abertura do arquivo e cadastros.

**Registros:**
- `0000` — Abertura do arquivo (empresa, período, regime)
- `0001` — Abertura do Bloco 0
- `0005` — Dados complementares do contribuinte
- `0150` — Um por participante (cliente/fornecedor) usado no período
- `0190` — Unidades de medida usadas
- `0200` — Produtos/serviços usados no período
- `0990` — Encerramento com contagem de linhas

**Arquivo:** `packages/fiscal/src/sped/blocos/bloco-0.ts`

**Critério de aceite:**
- Bloco 0 gerado para o mês de janeiro de um período de teste
- Importado no PVA da Receita sem erros no Bloco 0

---

### SPD-02/03 · Motor SPED — Blocos C e A
**Dev:** Tech Lead · **Estimativa:** 24h

**Descrição:**
Bloco C: NF-e de saída (vendas Enfratec) e NF-e de entrada (compras de fornecedores)
Bloco A: NFS-e emitidas pela Enfratec

**Bloco C — registros:**
- `C001` — Abertura
- `C100` — Cabeçalho de cada NF-e (emissão = saída, recebimento = entrada)
- `C170` — Um por item de cada NF-e
- `C190` — Analítico por CST/CFOP/alíquota (obrigatório)
- `C990` — Encerramento

**Bloco A — registros:**
- `A001`, `A100` (cabeçalho NFS-e), `A170` (itens), `A990`

**Critério de aceite:**
- Blocos gerados sem erros no PVA
- C190 agrupa corretamente por CST + CFOP + alíquota

---

### SPD-04 · Motor SPED — Bloco E
**Dev:** Tech Lead · **Estimativa:** 12h

**Descrição:**
Bloco E: Apuração do ICMS e IPI para a Enfratec (Simples Nacional).

**Registros:**
- `E001` — Abertura
- `E100` — Período de apuração (início e fim do mês)
- `E110` — Apuração: débitos (das notas de saída), créditos (das notas de entrada), saldo

**Atenção — Simples Nacional:**
ICMS é recolhido via DAS. Os valores das notas são informados mas o `VL_ICMS_RECOLHER` = 0.

**Critério de aceite:**
- Bloco E preenchido sem erros no PVA
- VL_ICMS_RECOLHER = 0 (correto para Simples Nacional)

---

### SPD-05 · Motor SPED — Bloco H
**Dev:** Tech Lead · **Estimativa:** 8h

**Descrição:**
Integração do inventário de estoque (EST-09) com o motor SPED.

**Já implementado em** `packages/fiscal/src/sped/blocos/bloco-h.ts`

**Esta tarefa:**
- Integrar a função `gerarBlocoH` no motor principal `sped-generator.ts`
- Chamar `tirarSnapshotInventario` para obter os itens

**Critério de aceite:**
- Bloco H gerado automaticamente quando `incluirInventario=true`
- Itens do inventário coincidem com o snapshot em `/estoque/inventario`

---

### SPD-06 · Motor SPED — Bloco 9
**Dev:** Tech Lead · **Estimativa:** 6h

**Descrição:**
Bloco 9: encerramento do arquivo com totalização de todos os registros.

**Registros:**
- `9001` — Abertura
- `9900` — Uma linha por tipo de registro com a contagem total (ex: `|9900|C100|12|`)
- `9990` — Encerramento do Bloco 9
- `9999` — Encerramento total do arquivo

**Critério de aceite:**
- Totalizadores corretos para todos os tipos de registro gerados
- Arquivo completo importado no PVA sem erros de totalização

---

### SPD-07 · Tela de Geração do SPED
**Dev:** Dev Pleno · **Estimativa:** 10h

**Descrição:**
Interface para o usuário (admin ou contador) gerar o arquivo SPED.

**Tela:** `/sped`

**Formulário:**
- Empresa (fixo: Enfratec — Múltipla não gera SPED Fiscal neste MVP)
- Mês e Ano de referência
- Incluir inventário? (toggle — obrigatório em dezembro)
- Motivo do inventário (dropdown)

**Preview antes de gerar:**
```
Bloco 0: 45 registros   ✅
Bloco A: 3 NFS-e        ✅
Bloco C: 12 NF-e        ✅
Bloco E: Apuração ICMS  ✅
Bloco H: 28 produtos    ✅
Bloco 9: Totalizadores  ✅
Total de linhas: 547
```

**Ações:**
- "Gerar Arquivo" → processa e salva no banco
- "Download .txt" → baixa o arquivo

**Histórico:** tabela com todos os SPEDs gerados (mês, linhas, data, hash MD5)

**API:**
```
POST /api/sped/gerar          → Gera e salva
GET  /api/sped/download/:id   → Download do .txt
GET  /api/sped/historico      → Lista de arquivos
```

**Critério de aceite:**
- Arquivo .txt baixado e importado no PVA sem erros
- Hash MD5 salvo no banco para verificação de integridade
- Histórico mostra todos os arquivos gerados

---

### SPD-08 · Histórico com Hash MD5
**Dev:** Dev Pleno · **Estimativa:** 4h

**Descrição:**
Salvar metadados de cada arquivo SPED gerado para auditoria.

**Campos salvos em `sped_arquivos`:**
- empresaId, mesReferencia, anoReferencia
- totalLinhas, hashMd5, storagePath
- geradoPor (userId), createdAt
- status: GERADO / TRANSMITIDO

**Hash MD5:**
```typescript
import { createHash } from 'crypto';
const hash = createHash('md5').update(conteudoSped).digest('hex');
```

**Critério de aceite:**
- Gerar o mesmo período duas vezes cria dois registros (não sobrescreve)
- Hash visível na tela de histórico

---

## Ordem de Desenvolvimento Recomendada

```
Semana 3:
  Dia 1-2: FAT-08, FAT-10, EST-01, EST-02
  Dia 3-4: EST-03, EST-04, EST-05, EST-06
  Dia 5:   EST-07, EST-08, EST-09, EST-10

Semana 4:
  Dia 1:   FIN-01, FIN-02, FIN-03
  Dia 2:   FIN-04, FIN-05, FIN-06
  Dia 3:   FIN-07, FIN-08, FIN-09, FIN-10
  Dia 4:   SPD-01, SPD-02, SPD-03, SPD-04
  Dia 5:   SPD-05, SPD-06, SPD-07, SPD-08 + Deploy produção
```

---

## Dependências entre Tarefas

```
EST-01 → EST-02 → EST-03 → EST-04 (fluxo de compra em sequência)
EST-03 → EST-06 (CMP antes da baixa)
FAT-01 (Sprint 1) → EST-06 (baixa usa o fluxo de NF-e)
EST-09 → SPD-05 (inventário alimenta o Bloco H)
FIN-04 → FIN-05 → FIN-06 (importar → conciliar → revisar)
SPD-01 → SPD-02 → SPD-03 → SPD-04 → SPD-05 → SPD-06 → SPD-07 (sequencial)
```
