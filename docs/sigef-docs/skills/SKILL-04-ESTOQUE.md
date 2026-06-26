# SKILL-04 · Compras, Estoque e Inventário (Épico EST)
> Pré-requisito: leia `SKILL-00-CONTEXT.md` e `SKILL-02-CADASTROS.md` antes deste arquivo.
> **Este módulo é exclusivo da Enfratec** (`empresa.hasEstoque === true`).

---

## Backlog EST

| ID | Prioridade | Tarefa | Estimativa |
|----|-----------|--------|-----------|
| EST-01 | 🔴 | Upload e leitura de XML de NF-e de fornecedor | 10h |
| EST-02 | 🔴 | Parser XML: extração completa de dados | 8h |
| EST-03 | 🔴 | Entrada automática no estoque (Custo Médio Ponderado) | 6h |
| EST-04 | 🔴 | Conta a Pagar criada automaticamente ao confirmar compra | 4h |
| EST-05 | 🔴 | Tela de saldo de estoque com busca e filtros | 8h |
| EST-06 | 🔴 | Baixa automática de estoque ao emitir NF-e de venda | 6h |
| EST-07 | 🔴 | Ajuste manual de estoque com justificativa e aprovação | 6h |
| EST-08 | 🔴 | Histórico de movimentações por produto | 6h |
| EST-09 | 🔴 | Geração do Bloco H (inventário) para o SPED | 14h |
| EST-10 | 🟡 | Alerta de estoque mínimo (e-mail + notificação no sistema) | 4h |
| EST-11 | 🟡 | Relatório de custo médio por produto | 6h |
| EST-12 | 🟡 | Lançamento manual de compra (sem XML, com PDF anexo) | 8h |
| EST-13 | 🟢 | Controle de múltiplos depósitos | 10h |

---

## Contexto Real (do Vídeo)

No Everflow da Enfratec:
- **3.716 registros de Contas a Pagar** em 38 páginas — parcelas longas (10/10, 12/12)
- Fornecedores: S1 Comércio LTDA, Segurança 1 LTDA, FSEG Com. de Produtos Eletrônicos
- Valores das parcelas: R$ 583,17 / R$ 2.331,00 / R$ 653,94 / R$ 2.307,00 — mensais
- Todos com status "A VENCER" até 2027 → compras parceladas de equipamentos

A Enfratec compra sob demanda: o cliente (Sicredi) pede, a Enfratec compra o produto e instala.

---

## Regras de Negócio

1. **Só Enfratec tem estoque** — verificar `empresa.hasEstoque === true` em todo handler
2. **Custo Médio Ponderado (CMP)** — único método de valoração adotado
3. **Toda movimentação cria registro** em `movimentacoes_estoque` — nunca alterar `saldo_estoque` diretamente
4. **Saldo negativo permitido com alerta** — sistema alerta mas não bloqueia (pode haver estoque físico não lançado)
5. **Compra sob demanda** — fluxo normal: Pedido → Compra → Estoque → Entrega com NF-e
6. **Compra parcelada** — 1 nota de compra + N parcelas em Contas a Pagar (N definido pelo usuário)

---

## Rotas Web

| Rota | Descrição |
|------|-----------|
| `/compras` | Lista de notas de compra |
| `/compras/importar-xml` | Upload de XML do fornecedor |
| `/compras/manual/novo` | Lançamento manual sem XML |
| `/compras/[id]` | Detalhe da nota de compra |
| `/estoque/saldo` | Posição atual do estoque |
| `/estoque/movimentacoes` | Histórico geral |
| `/estoque/movimentacoes/[produtoId]` | Histórico por produto |
| `/estoque/ajuste/novo` | Ajuste manual |
| `/estoque/inventario` | Snapshot para Bloco H |

## Rotas API

```
# Compras
POST   /api/compras/xml                → Upload XML, retorna pré-visualização
POST   /api/compras/confirmar          → Confirma entrada (estoque + conta pagar)
GET    /api/compras?de=&ate=&status=
GET    /api/compras/:id
POST   /api/compras/manual             → Lançamento sem XML

# Estoque
GET    /api/estoque/saldo?q=&situacao=
GET    /api/estoque/saldo/:produtoId
GET    /api/estoque/movimentacoes?produtoId=&de=&ate=
POST   /api/estoque/ajuste             → Solicitar ajuste
PATCH  /api/estoque/ajuste/:id/aprovar → Admin aprova
GET    /api/estoque/snapshot           → Posição atual (para Bloco H)
```

---

## EST-01/02: Parser de XML de NF-e de Fornecedor

```typescript
// packages/fiscal/src/parsers/xml-nfe.ts
import { XMLParser } from 'fast-xml-parser';

export async function parseXmlNFe(xmlBuffer: Buffer): Promise<DadosNFeFormatado> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xmlBuffer.toString('utf-8'));

  const infNFe = parsed?.nfeProc?.NFe?.infNFe ?? parsed?.NFe?.infNFe;
  if (!infNFe) throw new Error('XML inválido: estrutura NF-e não encontrada');

  const emit = infNFe.emit;
  const det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
  const total = infNFe.total.ICMSTot;
  const chaveAcesso = (infNFe['@_Id'] ?? '').replace('NFe', '');

  // Validar chave na SEFAZ antes de prosseguir
  await validarChaveAcessoSEFAZ(chaveAcesso);

  return {
    chaveAcesso,
    numero: String(infNFe.ide.nNF),
    serie: String(infNFe.ide.serie),
    dataEmissao: new Date(infNFe.ide.dhEmi),
    emitente: { cnpj: emit.CNPJ, razaoSocial: emit.xNome, ie: emit.IE },
    totais: {
      valorTotal: Math.round(parseFloat(total.vNF) * 100),
      valorProdutos: Math.round(parseFloat(total.vProd) * 100),
      valorFrete: Math.round(parseFloat(total.vFrete ?? 0) * 100),
      valorIcms: Math.round(parseFloat(total.vICMS ?? 0) * 100),
      valorIpi: Math.round(parseFloat(total.vIPI ?? 0) * 100),
      valorSt: Math.round(parseFloat(total.vST ?? 0) * 100),
    },
    itens: det.map((d: any) => ({
      codigoFornecedor: d.prod.cProd,
      descricao: d.prod.xProd,
      ncm: d.prod.NCM,
      cfop: d.prod.CFOP,
      unidade: d.prod.uCom,
      quantidade: parseFloat(d.prod.qCom),
      valorUnitario: Math.round(parseFloat(d.prod.vUnCom) * 100),
      valorTotal: Math.round(parseFloat(d.prod.vProd) * 100),
    })),
  };
}
```

### Matching de Produtos

```typescript
// Após parsear o XML, tentar associar itens ao catálogo interno
async function matchProdutos(itens: DadosNFeFormatado['itens'], empresaId: string) {
  return Promise.all(itens.map(async (item) => {
    // 1. Tentar por NCM
    const porNcm = await prisma.produto.findFirst({ where: { empresaId, ncm: item.ncm } });
    if (porNcm) return { ...item, produtoId: porNcm.id, match: 'auto' };

    // 2. Não encontrado → usuário seleciona manualmente na UI
    return { ...item, produtoId: null, match: 'manual' };
  }));
}
```

---

## EST-03: Custo Médio Ponderado (CMP)

```typescript
// apps/api/src/application/use-cases/estoque/dar-entrada.use-case.ts

export async function darEntradaEstoque(
  produtoId: string,
  empresaId: string,
  quantidade: number,
  custoUnitario: number, // centavos
  tipo: TipoMovimentacao,
  notaCompraId: string,
  userId: string,
  tx: PrismaTransactionClient,
) {
  const saldo = await tx.saldoEstoque.findUnique({ where: { produtoId } });
  const qtdAnterior = saldo?.quantidade ?? 0;
  const custoMedioAnterior = saldo?.custoMedio ?? 0;

  // Fórmula CMP
  const novaQtd = qtdAnterior + quantidade;
  const novoCustoMedio = novaQtd > 0
    ? Math.round((qtdAnterior * custoMedioAnterior + quantidade * custoUnitario) / novaQtd)
    : custoUnitario;

  // Atualizar saldo
  await tx.saldoEstoque.upsert({
    where: { produtoId },
    create: { produtoId, empresaId, quantidade: novaQtd, custoMedio: novoCustoMedio },
    update: { quantidade: novaQtd, custoMedio: novoCustoMedio },
  });

  // Registrar movimentação
  await tx.movimentacaoEstoque.create({
    data: {
      empresaId, produtoId, tipo,
      quantidade,
      custoUnitario,
      custoTotal: Math.round(quantidade * custoUnitario),
      saldoAnterior: qtdAnterior,
      saldoPosterior: novaQtd,
      custoMedioAntes: custoMedioAnterior,
      custoMedioApos: novoCustoMedio,
      notaCompraId,
      criadoPor: userId,
    },
  });

  // Verificar estoque mínimo
  await verificarEstoqueMinimo(produtoId, novaQtd, tx);
}
```

### Baixa de Estoque (ao emitir NF-e)

```typescript
export async function darBaixaEstoque(
  produtoId: string,
  empresaId: string,
  quantidade: number,
  notaFiscalId: string,
  userId: string,
  tx: PrismaTransactionClient,
) {
  const saldo = await tx.saldoEstoque.findUnique({ where: { produtoId } });
  if (!saldo) throw new BusinessError('Produto sem saldo de estoque registrado');

  if (saldo.quantidade < quantidade) {
    // Alertar mas não bloquear
    console.warn(`Estoque insuficiente: ${saldo.quantidade} < ${quantidade} para produto ${produtoId}`);
  }

  const novaQtd = saldo.quantidade - quantidade;

  await tx.saldoEstoque.update({ where: { produtoId }, data: { quantidade: novaQtd } });

  await tx.movimentacaoEstoque.create({
    data: {
      empresaId, produtoId,
      tipo: 'SAIDA_VENDA',
      quantidade: -quantidade,
      custoUnitario: saldo.custoMedio, // custo médio atual
      custoTotal: Math.round(quantidade * saldo.custoMedio),
      saldoAnterior: saldo.quantidade,
      saldoPosterior: novaQtd,
      custoMedioAntes: saldo.custoMedio,
      custoMedioApos: saldo.custoMedio, // CMP não muda na saída
      notaFiscalId,
      criadoPor: userId,
    },
  });
}
```

---

## EST-09: Geração do Bloco H (SPED Fiscal)

### O que é
O Bloco H registra o inventário de estoque no SPED Fiscal. Obrigatório para a Enfratec.

Quando gerar: anualmente (dezembro), na abertura/encerramento da empresa, por exigência do fisco.

### Implementação

```typescript
// packages/fiscal/src/sped/blocos/bloco-h.ts

export function gerarBlocoH(
  dataInventario: Date,
  motivoInventario: string, // '05'=balanço periódico
  itens: ItemInventario[],
): string {
  const lines: string[] = [];
  let n = 0;

  // H001 — Abertura
  lines.push(`|H001|${itens.length > 0 ? '1' : '0'}|`); n++;

  if (itens.length > 0) {
    const totalValor = itens.reduce((s, i) => s + i.valorTotal, 0);
    const data = formatarDataSped(dataInventario);

    // H005 — Totais
    lines.push(`|H005|${data}|${fmt(totalValor)}|${motivoInventario}|`); n++;

    // H010 — Um por produto
    for (const item of itens) {
      lines.push(`|H010|${item.codItem}|${item.unidade}|${fmtQtd(item.quantidade)}|${fmt(item.valorUnitario)}|${fmt(item.valorTotal)}|${item.indProp}||||0|`);
      n++;
    }
  }

  // H990 — Encerramento
  lines.push(`|H990|${n + 1}|`);
  return lines.join('\n');
}

// Snapshot do inventário na data especificada
export async function tirarSnapshotInventario(empresaId: string, data: Date) {
  const saldos = await prisma.saldoEstoque.findMany({
    where: { empresaId, quantidade: { gt: 0 }, produto: { ativo: true, tipo: 'PRODUTO' } },
    include: { produto: true },
  });

  return saldos.map(s => ({
    codItem: s.produto.codigo,
    unidade: s.produto.unidade,
    quantidade: s.quantidade,
    valorUnitario: s.custoMedio,
    valorTotal: Math.round(s.quantidade * s.custoMedio),
    indProp: '0',
  }));
}
```

---

## EST-10: Alerta de Estoque Mínimo

```typescript
async function verificarEstoqueMinimo(produtoId: string, quantidadeAtual: number, tx: PrismaTransactionClient) {
  const produto = await tx.produto.findUnique({
    where: { id: produtoId },
    include: { empresa: true },
  });

  if (!produto?.estoqueMinimo) return;
  if (quantidadeAtual <= produto.estoqueMinimo) {
    // Enviar e-mail via Resend
    await resend.emails.send({
      from: 'alertas@orionlab.com.br',
      to: produto.empresa.email ?? '',
      subject: `⚠️ Estoque baixo: ${produto.descricao}`,
      html: `<p>Saldo atual: <strong>${quantidadeAtual} ${produto.unidade}</strong> — mínimo configurado: ${produto.estoqueMinimo}</p>`,
    });
  }
}
```

---

## EST-04: Conta a Pagar na Compra (com parcelamento)

```typescript
// Ao confirmar uma nota de compra, o usuário informa o parcelamento
// Ex: 12x de R$ 583,17 → 12 contas a pagar com vencimentos mensais

async function criarContasPagarDeCompra(
  notaCompra: NotaCompra,
  parcelas: number,        // ex: 12
  dataVencimento: Date,    // vencimento da 1ª parcela
  empresaId: string,
  tx: PrismaTransactionClient,
) {
  const valorParcela = Math.round(notaCompra.valorTotal / parcelas);
  const contas = Array.from({ length: parcelas }, (_, i) => ({
    empresaId,
    fornecedorId: notaCompra.fornecedorId,
    notaCompraId: i === 0 ? notaCompra.id : null, // vincula só na 1ª
    descricao: `${notaCompra.numero} — ${i + 1}/${parcelas} — ${notaCompra.fornecedor.razaoSocial}`,
    valor: valorParcela,
    status: 'ABERTO' as const,
    dataVencimento: addMonths(dataVencimento, i),
  }));

  await tx.contaPagar.createMany({ data: contas });
}
```

---

## Checklist EST

- [ ] Upload de XML valida chave de acesso na SEFAZ
- [ ] Itens do XML são associados ao catálogo interno por NCM
- [ ] CMP recalculado corretamente após cada entrada
- [ ] Conta a pagar criada com parcelamento (N parcelas)
- [ ] Baixa automática ao emitir NF-e de venda
- [ ] Ajuste manual aguarda aprovação do admin
- [ ] Histórico mostra saldo anterior, posterior e CMP
- [ ] Bloco H gerado com todos os produtos com saldo > 0
- [ ] Alerta de e-mail enviado quando saldo ≤ mínimo
