# SKILL-06 · SPED Fiscal (Épico SPD)
> Pré-requisito: leia `SKILL-00-CONTEXT.md`, `SKILL-03-FATURAMENTO.md` e `SKILL-04-ESTOQUE.md`.
> **SPED Fiscal (EFD ICMS/IPI) = apenas Enfratec neste MVP.**
> Múltipla (SPED Contribuições PIS/COFINS) = pós-MVP.

---

## Backlog SPD

| ID | Prioridade | Tarefa | Estimativa |
|----|-----------|--------|-----------|
| SPD-01 | 🔴 | Motor SPED: Bloco 0 (abertura e cadastros) | 12h |
| SPD-02 | 🔴 | Motor SPED: Bloco C (NF-e mercadorias) | 14h |
| SPD-03 | 🔴 | Motor SPED: Bloco A (NFS-e) | 10h |
| SPD-04 | 🔴 | Motor SPED: Bloco E (apuração ICMS/IPI) | 12h |
| SPD-05 | 🔴 | Motor SPED: Bloco H (inventário — integrado com EST-09) | 8h |
| SPD-06 | 🔴 | Motor SPED: Bloco 9 (encerramento e totalizadores) | 6h |
| SPD-07 | 🔴 | Tela: seleção período, preview, geração e download | 10h |
| SPD-08 | 🟡 | Histórico de arquivos com hash MD5 de integridade | 4h |
| SPD-09 | 🟡 | Validação interna dos campos antes de gerar | 8h |

---

## Estrutura do Arquivo SPED

```
|0000|...| ← Abertura do arquivo
|0001|...| ← Abertura Bloco 0
|0005|...| ← Dados complementares
|0150|...| ← Um registro por participante (cliente/fornecedor)
|0190|...| ← Unidades de medida
|0200|...| ← Produtos/serviços usados no período
|0990|N|   ← Encerramento Bloco 0

|A001|0|   ← Abertura Bloco A (NFS-e)
|A100|...| ← Cabeçalho NFS-e
|A170|...| ← Itens da NFS-e
|A990|N|

|C001|0|   ← Abertura Bloco C (NF-e mercadorias)
|C100|...| ← Cabeçalho NF-e
|C170|...| ← Itens da NF-e
|C190|...| ← Analítico por CST/CFOP/alíquota (OBRIGATÓRIO)
|C990|N|

|E001|0|   ← Abertura Bloco E (apuração)
|E100|...| ← Período de apuração
|E110|...| ← Apuração do ICMS
|E990|N|

|H001|1|   ← Abertura Bloco H (inventário)
|H005|...| ← Totais
|H010|...| ← Um por produto
|H990|N|

|9001|0|   ← Abertura Bloco 9
|9900|...| ← Contagem por tipo de registro
|9990|N|
|9999|N|   ← Encerramento total
```

---

## Regras do Arquivo

1. Formato texto puro `.txt`, separado por `|` (pipe)
2. Campos vazios: `||` (sem espaço entre pipes)
3. Valores monetários: vírgula como decimal — ex: `1250,99`
4. Quantidades: 3 casas decimais — ex: `10,000`
5. Datas: `DDMMAAAA` — ex: `31122024`
6. **Versão do layout:** verificar versão atual no portal SPED (variável `VERSAO_LAYOUT_SPED`)
7. **Período de apuração:** mensal — um arquivo por mês/empresa
8. Arquivo deve ser validado no **PVA da Receita Federal** antes de transmitir
9. Simples Nacional: ICMS zerado no Bloco E (recolhido via DAS)

---

## Formatadores

```typescript
// packages/fiscal/src/utils/formatters.ts

export const fmt = (centavos: number) =>
  centavos === 0 ? '0,00' : (Math.abs(centavos) / 100).toFixed(2).replace('.', ',');

export const fmtQtd = (qtd: number) =>
  qtd.toFixed(3).replace('.', ',');

export const fmtAliq = (basisPoints: number) =>
  (basisPoints / 100).toFixed(2).replace('.', ',');

export const fmtData = (d: Date) =>
  `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${d.getFullYear()}`;

export const descUnidade = (u: string) => ({
  UN: 'UNIDADE', KG: 'KILOGRAMA', CX: 'CAIXA', MT: 'METRO',
  SRV: 'SERVICO', HR: 'HORA', PC: 'PECA', LT: 'LITRO',
})[u] ?? u;
```

---

## SPD-01: Bloco 0

```typescript
// packages/fiscal/src/sped/blocos/bloco-0.ts

export async function gerarBlocoZero(
  empresa: Empresa,
  participantes: ClienteFornecedor[],
  produtos: Produto[],
  inicio: Date,
  fim: Date,
): Promise<string[]> {
  const lines: string[] = [];
  let n = 0;

  // 0000 — Abertura do arquivo
  lines.push([
    '|0000', '017', '0',
    fmtData(inicio), fmtData(fim),
    empresa.cnpj, empresa.razaoSocial,
    empresa.uf, empresa.inscricaoEstadual ?? '',
    empresa.codigoMunicipio,
    empresa.inscricaoMunicipal ?? '', '',
    '0', // Perfil A
    '1', // Simples Nacional
    '|',
  ].join('|'));

  // 0001 — Abertura Bloco 0
  lines.push('|0001|0|'); n++;

  // 0005 — Dados complementares
  lines.push(['|0005', '', empresa.cnpj, empresa.inscricaoEstadual ?? '',
    empresa.inscricaoMunicipal ?? '', empresa.email ?? '', empresa.telefone ?? '', '|'].join('|'));
  n++;

  // 0150 — Participantes
  for (const p of participantes) {
    lines.push(['|0150', p.id, p.razaoSocial ?? p.nomeCompleto ?? '',
      '01', '1058', p.cnpj ?? '', p.cpf ?? '',
      p.inscricaoEstadual ?? '', p.uf ?? '',
      p.inscricaoMunicipal ?? '', p.email ?? '', p.telefone ?? '', '|'].join('|'));
    n++;
  }

  // 0190 — Unidades de medida
  const unidades = new Set(produtos.map(p => p.unidade));
  for (const u of unidades) {
    lines.push(`|0190|${u}|${descUnidade(u)}|`);
    n++;
  }

  // 0200 — Produtos/serviços
  for (const p of produtos) {
    lines.push(['|0200', p.codigo, p.descricao, p.ean ?? '',
      p.unidade, p.tipo === 'PRODUTO' ? '00' : '09',
      p.ncm ?? '', '', '', p.cest ?? '', '0', '|'].join('|'));
    n++;
  }

  lines.push(`|0990|${n + 1}|`);
  return lines;
}
```

---

## SPD-02: Bloco C (NF-e Mercadorias)

```typescript
// packages/fiscal/src/sped/blocos/bloco-c.ts

export function gerarBlocoC(notas: NotaFiscal[], notasCompra: NotaCompra[]): string[] {
  const lines: string[] = [];
  lines.push('|C001|0|');

  // NF-e de saída (vendas)
  for (const nota of notas.filter(n => n.tipo === 'NFE')) {
    // C100 — Cabeçalho
    lines.push(['|C100', '1', '1',  // indicador saída, emissão própria
      nota.clienteId, '55', 'A', nota.serie, String(nota.numero ?? ''),
      nota.chaveAcesso ?? '', fmtData(nota.dataEmissao),
      fmtData(nota.dataSaida ?? nota.dataEmissao),
      fmt(nota.valorTotal), fmt(nota.valorProdutos),
      fmt(nota.valorDesconto), fmt(nota.valorFrete),
      fmt(nota.valorSeguro), fmt(nota.valorOutras),
      fmt(nota.valorIpi), String(nota.modalidadeFrete ?? 9), '|'].join('|'));

    // C170 — Itens
    for (const item of nota.itens) {
      lines.push(['|C170', String(item.ordem), item.produto.codigo,
        item.produto.descricao, fmtQtd(item.quantidade),
        item.produto.unidade, fmt(item.valorUnitario), fmt(item.valorTotal),
        fmt(item.valorDesconto), item.cfop, item.produto.ncm ?? '',
        '0', // EX_IPI
        item.produto.cstIcms ?? '400', // CSOSN
        '0', fmt(item.baseIcms), fmtAliq(item.aliquotaIcms),
        fmt(item.valorIcms), fmt(item.baseIpi),
        fmtAliq(item.aliquotaIpi), fmt(item.valorIpi),
        item.produto.cstPis ?? '07', fmt(item.basePis),
        fmtAliq(item.aliquotaPis), fmt(item.valorPis),
        item.produto.cstCofins ?? '07', fmt(item.baseCofins),
        fmtAliq(item.aliquotaCofins), fmt(item.valorCofins), '|'].join('|'));
    }

    // C190 — Analítico (agrupar por CST+CFOP+alíquota — OBRIGATÓRIO)
    const grupos = agruparPorCstCfopAliq(nota.itens);
    for (const g of grupos) {
      lines.push(['|C190', g.cstIcms, g.cfop, fmtAliq(g.aliquotaIcms),
        fmt(g.valorOpr), fmt(g.baseIcms), fmt(g.valorIcms),
        fmt(g.valorBcST), fmt(g.valorST), fmt(g.valorFrete),
        fmt(g.baseIpi), fmt(g.valorIpi), '|'].join('|'));
    }
  }

  // NF-e de entrada (compras)
  for (const nc of notasCompra) {
    lines.push(['|C100', '0', '0', // indicador entrada, terceiros
      nc.fornecedorId, '55', 'A', nc.serie, nc.numero,
      nc.chaveAcesso, fmtData(nc.dataEmissao), fmtData(nc.dataEntrada),
      fmt(nc.valorTotal), fmt(nc.valorProdutos),
      fmt(nc.valorDesconto), fmt(nc.valorFrete),
      '0', '0', fmt(nc.valorIpi), '9', '|'].join('|'));

    for (const item of nc.itens) {
      lines.push(['|C170', '1', item.produto?.codigo ?? '',
        item.descricao, fmtQtd(item.quantidade), item.unidade,
        fmt(item.valorUnitario), fmt(item.valorTotal), '0',
        item.cfop, item.ncm ?? '', '0', '102', // CSOSN entrada
        '0', fmt(item.valorTotal), '0', '0', '0', '0', '0',
        '70', '0', '0', '0', '70', '0', '0', '0', '|'].join('|'));
    }
  }

  lines.push(`|C990|${lines.length + 1}|`);
  return lines;
}
```

---

## SPD-04: Bloco E (Apuração ICMS)

```typescript
// packages/fiscal/src/sped/blocos/bloco-e.ts

export function gerarBlocoE(notas: NotaFiscal[], notasCompra: NotaCompra[], inicio: Date, fim: Date): string[] {
  const lines: string[] = [];
  lines.push('|E001|0|');

  // E100 — Período
  lines.push(`|E100|${fmtData(inicio)}|${fmtData(fim)}|`);

  // Simples Nacional: débito e crédito são os valores das notas
  // mas o valor a recolher via GNRE é zero (DAS cuida)
  const totalDebito = notas.reduce((s, n) => s + n.valorIcms, 0);
  const totalCredito = notasCompra.reduce((s, n) => s + n.valorIcms, 0);
  const saldoApurado = Math.max(0, totalDebito - totalCredito);

  // E110 — Apuração
  lines.push(['|E110',
    fmt(totalDebito),   // VL_TOT_DÉBITOS
    '0', fmt(totalDebito), '0',
    fmt(totalCredito),  // VL_TOT_CRÉDITOS
    '0', fmt(totalCredito), '0', '0',
    fmt(saldoApurado),  // VL_SLD_APURADO
    '0',
    '0',  // VL_ICMS_RECOLHER = 0 (Simples recolhe via DAS)
    '0', '0', '|'].join('|'));

  lines.push(`|E990|${lines.length + 1}|`);
  return lines;
}
```

---

## SPD-06: Bloco 9 (Totalizadores)

```typescript
// packages/fiscal/src/sped/blocos/bloco-9.ts

export function gerarBloco9(contadorRegistros: Record<string, number>, totalLinhas: number): string[] {
  const lines: string[] = [];
  lines.push('|9001|0|');

  // 9900 — Um por tipo de registro
  for (const [tipo, qtd] of Object.entries(contadorRegistros).sort()) {
    lines.push(`|9900|${tipo}|${qtd}|`);
  }

  const n9 = lines.length + 2;
  lines.push(`|9990|${n9}|`);
  lines.push(`|9999|${totalLinhas + n9}|`);
  return lines;
}
```

---

## SPD-07: Tela de Geração e API

### Rota API

```
POST /api/sped/gerar
Body: { empresaId, mes, ano, incluirInventario, motivoInventario }
Response: { arquivoId, totalLinhas, preview: { blocos } }

GET /api/sped/download/:arquivoId
Response: arquivo .txt (Content-Disposition: attachment)

GET /api/sped/historico
Response: lista de SpedArquivo
```

### Gerador principal

```typescript
// packages/fiscal/src/sped/sped-generator.ts

export async function gerarSpedFiscal(options: SpedOptions, prisma: PrismaClient): Promise<string> {
  const { empresaId, periodo } = options;
  const inicio = startOfMonth(new Date(periodo.ano, periodo.mes - 1));
  const fim = endOfMonth(new Date(periodo.ano, periodo.mes - 1));

  const [empresa, notas, notasCompra, participantes, produtos, inventario] = await Promise.all([
    prisma.empresa.findUniqueOrThrow({ where: { id: empresaId } }),
    prisma.notaFiscal.findMany({ where: { empresaId, status: 'AUTORIZADA', cancelada: false, dataEmissao: { gte: inicio, lte: fim } }, include: { itens: { include: { produto: true } }, cliente: true } }),
    prisma.notaCompra.findMany({ where: { empresaId, status: 'CONFIRMADA', dataEmissao: { gte: inicio, lte: fim } }, include: { itens: { include: { produto: true } }, fornecedor: true } }),
    buscarParticipantes(empresaId, inicio, fim, prisma),
    buscarProdutosDoPeriodo(empresaId, inicio, fim, prisma),
    options.incluirInventario ? tirarSnapshotInventario(empresaId, fim) : [],
  ]);

  const lines: string[] = [];
  const contador: Record<string, number> = {};

  const add = (linha: string) => {
    lines.push(linha);
    const tipo = linha.match(/^\|([A-Z0-9]+)\|/)?.[1] ?? '????';
    contador[tipo] = (contador[tipo] ?? 0) + 1;
  };

  // Montar cada bloco
  const bloco0 = await gerarBlocoZero(empresa, participantes, produtos, inicio, fim);
  const blocoA = gerarBlocoA(notas.filter(n => n.tipo !== 'NFE'));
  const blocoC = gerarBlocoC(notas.filter(n => n.tipo === 'NFE'), notasCompra);
  const blocoE = gerarBlocoE(notas, notasCompra, inicio, fim);
  const blocoH = options.incluirInventario ? gerarBlocoH(fim, options.motivoInventario ?? '05', inventario) : ['|H001|0|', '|H990|2|'];
  const bloco9 = gerarBloco9(contador, lines.length);

  // 0000 — header do arquivo
  add(`|0000|017|0|${fmtData(inicio)}|${fmtData(fim)}|${empresa.cnpj}|${empresa.razaoSocial}|${empresa.uf}|${empresa.inscricaoEstadual ?? ''}|${empresa.codigoMunicipio}|${empresa.inscricaoMunicipal ?? ''}||0|1|`);

  [...bloco0, ...blocoA, ...blocoC, ...blocoE, ...blocoH].forEach(add);
  bloco9.forEach(add);

  return lines.join('\n');
}
```

---

## Checklist SPD

- [ ] Bloco 0 contém empresa, todos os participantes do período e produtos
- [ ] Bloco A lista NFS-e autorizadas e não canceladas
- [ ] Bloco C lista NF-e de saída (vendas) e entrada (compras) com C190
- [ ] Bloco E preenche apuração com ICMS zerado (Simples Nacional)
- [ ] Bloco H contém todos os produtos com saldo > 0
- [ ] Bloco 9 conta corretamente todos os registros
- [ ] Arquivo importado no PVA da Receita sem erros de validação
- [ ] Hash MD5 salvo no banco para controle de integridade
- [ ] Geração bloqueada se empresa.hasEstoque === false
