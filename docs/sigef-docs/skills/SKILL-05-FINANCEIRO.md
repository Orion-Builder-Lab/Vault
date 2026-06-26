# SKILL-05 · Módulo Financeiro (Épico FIN)
> Pré-requisito: leia `SKILL-00-CONTEXT.md` antes deste arquivo.

---

## Backlog FIN

| ID | Prioridade | Tarefa | Estimativa |
|----|-----------|--------|-----------|
| FIN-01 | 🔴 | Contas a Receber: listagem, filtros, baixa manual | 12h |
| FIN-02 | 🔴 | Contas a Pagar: listagem, filtros, baixa, aprovação | 12h |
| FIN-03 | 🔴 | Dashboard de Fluxo de Caixa em tempo real | 14h |
| FIN-04 | 🔴 | Importação de extrato bancário OFX | 10h |
| FIN-05 | 🔴 | Motor de conciliação automática | 14h |
| FIN-06 | 🔴 | Tela de revisão de itens não conciliados | 10h |
| FIN-07 | 🔴 | Relatório de inconsistências bancárias | 8h |
| FIN-08 | 🔴 | Resumo anual de entradas e saídas (XLSX) | 8h |
| FIN-09 | 🟡 | Categorias de despesa configuráveis (alimenta DRE) | 6h |
| FIN-10 | 🟡 | DRE simplificado por período | 10h |
| FIN-11 | 🟡 | Relatório consolidado do grupo (Múltipla + Enfratec) | 10h |
| FIN-12 | 🟢 | Integração Open Finance (Sicoob, Inter, Bradesco) | 20h |

---

## Contexto Real (do Vídeo)

**Conta Azul Múltipla — Janeiro 2024:**
- Vencidos (vermelho): **R$ 133.890,95**
- Recebidos (verde): **R$ 209.286,03**
- Total do período: **R$ 343.176,98**
- Conta em aberto: "Gerenciamento de Infraestrutura 01/2024" — R$ 23.890,95

**Everflow Enfratec:**
- Contas a pagar: 3.716 registros, total R$ 6.912.016,00
- Contas a receber: 71 notas para Sicredi Vale Litoral SC — R$ 88.206,29 total

---

## Regras de Negócio

1. **Conta a Receber criada automaticamente** ao autorizar qualquer NF-e ou NFS-e
2. **Conta a Pagar criada automaticamente** ao confirmar nota de compra
3. **Parcelamento** — compra em 12x gera 12 parcelas automaticamente
4. **Aprovação por limite** — pagamentos acima do `empresa.limiteAprovacaoPagamento` ficam em PENDENTE_APROVACAO
5. **Conciliação bancária é leitura** — nunca cria lançamentos, apenas vincula extrato a contas existentes
6. **Deduplicação OFX** — mesmo lançamento importado duas vezes não duplica (campo `fitId` único)
7. **Categorias obrigatórias** — todo lançamento manual deve ter categoria para alimentar o DRE

---

## Rotas Web

| Rota | Descrição |
|------|-----------|
| `/financeiro/contas-receber` | Lista CR com filtros |
| `/financeiro/contas-pagar` | Lista CP com filtros |
| `/financeiro/fluxo-caixa` | Dashboard financeiro |
| `/financeiro/conciliacao` | Importar extrato + conciliar |
| `/financeiro/dre` | DRE simplificado |

## Rotas API

```
# Contas a Receber
GET    /api/financeiro/contas-receber?status=&de=&ate=&clienteId=&categoria=
POST   /api/financeiro/contas-receber               → Lançamento manual
PATCH  /api/financeiro/contas-receber/:id/baixa     → { valorRecebido, formaPagamento, data }
GET    /api/financeiro/contas-receber/vencidas

# Contas a Pagar
GET    /api/financeiro/contas-pagar?status=&de=&ate=&fornecedorId=&categoria=
POST   /api/financeiro/contas-pagar                 → Lançamento manual
PATCH  /api/financeiro/contas-pagar/:id/aprovar     → Admin aprova
PATCH  /api/financeiro/contas-pagar/:id/baixa       → { valorPago, formaPagamento, data }

# Fluxo de Caixa
GET    /api/financeiro/fluxo-caixa
GET    /api/financeiro/fluxo-caixa/grafico-semanal

# Extrato e Conciliação
POST   /api/financeiro/extrato/importar             → Upload OFX (multipart)
GET    /api/financeiro/extrato?contaId=&de=&ate=
POST   /api/financeiro/conciliacao/executar         → Rodar motor automático
GET    /api/financeiro/conciliacao/pendentes        → Não conciliados
POST   /api/financeiro/conciliacao/manual           → Vincular manualmente
DELETE /api/financeiro/conciliacao/:id             → Desfazer

# Relatórios
GET    /api/financeiro/relatorios/inconsistencias?de=&ate=
GET    /api/financeiro/relatorios/resumo-anual/:ano  → retorna XLSX
GET    /api/financeiro/relatorios/dre?de=&ate=
GET    /api/financeiro/relatorios/consolidado?de=&ate=  → admin only
```

---

## FIN-01: Contas a Receber

### Cards de resumo no topo da tela

```typescript
// Calculados para o período/filtro ativo
{
  vencidos: number,      // Vencimento < hoje, status != QUITADO
  vencemHoje: number,    // Vencimento = hoje
  aVencer: number,       // Vencimento > hoje, status = ABERTO
  recebidos: number,     // status = QUITADO, no período
  totalPeriodo: number,  // soma de todos
}
```

### Categorias de Receita (Múltipla)

Baseadas nos lançamentos observados no Conta Azul:
- `MONITORAMENTO` — serviço recorrente mensal
- `MANUTENCAO` — manutenção preventiva e corretiva
- `LOCACAO` — aluguel de equipamentos ou galpão
- `GERENCIAMENTO` — gerenciamento de infraestrutura
- `VENDAS` — produtos físicos (NF-e)
- `OUTROS`

### Criação Automática ao Autorizar Nota

```typescript
// apps/api/src/application/use-cases/financeiro/criar-conta-receber.use-case.ts

export async function criarContaReceberDeNota(
  nota: NotaFiscal,
  empresaId: string,
  tx: PrismaTransactionClient,
) {
  const config = await tx.empresa.findUnique({ where: { id: empresaId }, select: { diasVencimentoPadrao: true } });
  const diasVencimento = config?.diasVencimentoPadrao ?? 30;

  await tx.contaReceber.create({
    data: {
      empresaId,
      clienteId: nota.clienteId,
      notaFiscalId: nota.id,
      descricao: `${tipoNotaLabel(nota.tipo)} nº ${nota.numero} — ${nota.cliente.razaoSocial}`,
      valor: nota.valorTotal,
      dataVencimento: addDays(nota.dataEmissao, diasVencimento),
      status: 'ABERTO',
      categoria: inferirCategoria(nota), // baseado no tipo de nota
    },
  });
}
```

---

## FIN-02: Contas a Pagar

### Aprovação por Limite

```typescript
// Se valor > empresa.limiteAprovacaoPagamento → status = PENDENTE_APROVACAO
// Admin ou financeiro precisam aprovar antes de marcar como pago

// PATCH /api/financeiro/contas-pagar/:id/aprovar
async function aprovarPagamento(contaId: string, userId: string, empresaId: string) {
  const conta = await repo.contaPagar.findById(contaId, empresaId);
  if (conta.status !== 'PENDENTE_APROVACAO') throw new BusinessError('Conta não está aguardando aprovação');

  await prisma.contaPagar.update({
    where: { id: contaId },
    data: { status: 'ABERTO', aprovadoPor: userId, dataAprovacao: new Date() },
  });
}
```

### Categorias de Despesa (alimenta DRE)

- `PESSOAL` — salários, pró-labore, encargos
- `TRIBUTARIO` — DAS, IRPJ, CSLL, ISS, DARF
- `OPERACIONAL` — materiais, ferramentas, combustível
- `ADMINISTRATIVO` — aluguel de escritório, internet, software
- `EQUIPAMENTOS` — compras de ativos, manutenção de equipamentos
- `OUTROS`

---

## FIN-03: Dashboard de Fluxo de Caixa

```typescript
// apps/api/src/application/use-cases/financeiro/fluxo-caixa.use-case.ts

export async function calcularFluxoCaixa(empresaId: string) {
  const hoje = new Date();

  const [saldoBancario, projecao7, projecao30, projecao90, vencidos] = await Promise.all([
    calcularSaldoBancario(empresaId),
    calcularProjecao(empresaId, hoje, addDays(hoje, 7)),
    calcularProjecao(empresaId, hoje, addDays(hoje, 30)),
    calcularProjecao(empresaId, hoje, addDays(hoje, 90)),
    buscarVencidos(empresaId),
  ]);

  return { saldoBancario, projecao7, projecao30, projecao90, vencidos };
}

async function calcularProjecao(empresaId: string, de: Date, ate: Date) {
  const [entradas, saidas] = await Promise.all([
    prisma.contaReceber.aggregate({
      where: { empresaId, status: { in: ['ABERTO', 'PARCIAL'] }, dataVencimento: { gte: de, lte: ate } },
      _sum: { valor: true },
    }),
    prisma.contaPagar.aggregate({
      where: { empresaId, status: { in: ['ABERTO', 'PARCIAL'] }, dataVencimento: { gte: de, lte: ate } },
      _sum: { valor: true },
    }),
  ]);

  return {
    entradas: entradas._sum.valor ?? 0,
    saidas: saidas._sum.valor ?? 0,
    saldo: (entradas._sum.valor ?? 0) - (saidas._sum.valor ?? 0),
  };
}
```

---

## FIN-04: Parser OFX

```typescript
// packages/fiscal/src/parsers/ofx-parser.ts

export async function parseOFX(buffer: Buffer): Promise<LancamentoOFX[]> {
  const text = buffer.toString('utf-8');

  const extractTag = (content: string, tag: string) =>
    content.match(new RegExp(`<${tag}>([^<]+)`))?.[1]?.trim() ?? '';

  const transacoes = text.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g) ?? [];

  return transacoes.map(trn => {
    const tipo = extractTag(trn, 'TRNTYPE') === 'CREDIT' ? 'CREDIT' : 'DEBIT';
    const valorRaw = parseFloat(extractTag(trn, 'TRNAMT'));
    const dtRaw = extractTag(trn, 'DTPOSTED').slice(0, 8);
    const data = new Date(`${dtRaw.slice(0,4)}-${dtRaw.slice(4,6)}-${dtRaw.slice(6,8)}`);

    return {
      fitId: extractTag(trn, 'FITID'),  // ID único — chave de deduplicação
      data,
      tipo,
      valor: Math.round(Math.abs(valorRaw) * 100) * (tipo === 'DEBIT' ? -1 : 1),
      descricao: extractTag(trn, 'MEMO') || extractTag(trn, 'NAME'),
    };
  });
}
```

### Importação com deduplicação

```typescript
// Usa @@unique([contaBancariaId, fitId]) no schema Prisma
// Lançamentos duplicados geram P2002 (unique constraint) — tratados silenciosamente

export async function importarExtrato(contaBancariaId: string, empresaId: string, buffer: Buffer) {
  const lancamentos = await parseOFX(buffer);
  let importados = 0, duplicados = 0;

  for (const l of lancamentos) {
    try {
      await prisma.lancamentoBancario.create({
        data: { empresaId, contaBancariaId, data: l.data, descricao: l.descricao, valor: l.valor, tipo: l.tipo, fitId: l.fitId },
      });
      importados++;
    } catch (e: any) {
      if (e.code === 'P2002') duplicados++;
      else throw e;
    }
  }

  return { importados, duplicados, total: lancamentos.length };
}
```

---

## FIN-05: Motor de Conciliação Automática

```typescript
// apps/api/src/application/use-cases/financeiro/conciliacao.use-case.ts

const TOLERANCIA_DIAS = 3; // Aceita até 3 dias de diferença

export async function executarConciliacao(empresaId: string, contaBancariaId: string) {
  const extrato = await prisma.lancamentoBancario.findMany({
    where: { empresaId, contaBancariaId, conciliado: false },
    orderBy: { data: 'asc' },
  });

  let conciliados = 0;

  for (const lancamento of extrato) {
    const valorAbsoluto = Math.abs(lancamento.valor);
    const isCreditо = lancamento.tipo === 'CREDIT';

    const model = isCredito ? prisma.contaReceber : prisma.contaPagar;
    const match = await (model as any).findFirst({
      where: {
        empresaId,
        status: { in: ['ABERTO', 'PARCIAL', 'VENCIDO'] },
        valor: valorAbsoluto, // valor exato
        dataVencimento: {
          gte: subDays(lancamento.data, TOLERANCIA_DIAS),
          lte: addDays(lancamento.data, TOLERANCIA_DIAS),
        },
      },
      orderBy: { dataVencimento: 'asc' },
    });

    if (match) {
      await prisma.$transaction([
        prisma.conciliacao.create({
          data: {
            empresaId,
            lancamentoBancarioId: lancamento.id,
            contaReceberId: isCredito ? match.id : null,
            contaPagarId: !isCredito ? match.id : null,
            tipo: 'AUTO',
            criadoPor: 'SISTEMA',
          },
        }),
        prisma.lancamentoBancario.update({ where: { id: lancamento.id }, data: { conciliado: true } }),
        (model as any).update({
          where: { id: match.id },
          data: {
            status: 'QUITADO',
            ...(isCredito ? { valorRecebido: valorAbsoluto, dataRecebimento: lancamento.data } : { valorPago: valorAbsoluto, dataPagamento: lancamento.data }),
          },
        }),
      ]);
      conciliados++;
    }
  }

  return { conciliados, naoEncontrados: extrato.length - conciliados, total: extrato.length };
}
```

---

## FIN-08: Resumo Anual XLSX

```typescript
// apps/api/src/application/use-cases/financeiro/resumo-anual.use-case.ts
import * as XLSX from 'xlsx';

export async function gerarResumoAnual(empresaId: string, ano: number): Promise<Buffer> {
  const meses = Array.from({ length: 12 }, (_, i) => i);

  const dados = await Promise.all(meses.map(async (mes) => {
    const inicio = startOfMonth(new Date(ano, mes));
    const fim = endOfMonth(new Date(ano, mes));

    const [entradas, saidas, inconsistencias] = await Promise.all([
      prisma.contaReceber.aggregate({
        where: { empresaId, status: 'QUITADO', dataRecebimento: { gte: inicio, lte: fim } },
        _sum: { valorRecebido: true },
      }),
      prisma.contaPagar.aggregate({
        where: { empresaId, status: 'QUITADO', dataPagamento: { gte: inicio, lte: fim } },
        _sum: { valorPago: true },
      }),
      prisma.lancamentoBancario.count({
        where: { empresaId, conciliado: false, data: { gte: inicio, lte: fim } },
      }),
    ]);

    const entradasVal = (entradas._sum.valorRecebido ?? 0) / 100;
    const saidasVal = (saidas._sum.valorPago ?? 0) / 100;

    return {
      'Mês': format(inicio, 'MMMM/yyyy', { locale: ptBR }),
      'Entradas (R$)': entradasVal,
      'Saídas (R$)': saidasVal,
      'Resultado (R$)': entradasVal - saidasVal,
      'Itens não conciliados': inconsistencias,
    };
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, ws, `Resumo ${ano}`);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
```

---

## Checklist FIN

- [ ] CR criada automaticamente ao autorizar qualquer nota fiscal
- [ ] CP criada automaticamente ao confirmar nota de compra (com parcelamento)
- [ ] CP com valor > limite fica em PENDENTE_APROVACAO
- [ ] Dashboard mostra saldo real e projeções 7/30/90 dias
- [ ] Upload OFX importa lançamentos sem duplicar (fitId único)
- [ ] Motor de conciliação faz matching por valor exato ± 3 dias
- [ ] Tela de revisão mostra itens não conciliados para ação manual
- [ ] Relatório de inconsistências exportado com itens sem match
- [ ] Resumo anual exportado em XLSX com 12 meses
- [ ] DRE calcula PIS e COFINS automaticamente para a Múltipla
