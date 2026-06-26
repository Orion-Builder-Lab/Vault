# SKILL-03 · Faturamento / Saídas (Épico FAT)
> Pré-requisito: leia `SKILL-00-CONTEXT.md` e `SKILL-02-CADASTROS.md` antes deste arquivo.

---

## Backlog FAT

| ID | Prioridade | Tarefa | Estimativa |
|----|-----------|--------|-----------|
| FAT-01 | 🔴 | Formulário NF-e (Enfratec) com cálculo automático | 20h |
| FAT-02 | 🔴 | Integração Focus NFe: NF-e → SEFAZ → XML + DANFE | 10h |
| FAT-03 | 🔴 | Formulário NFS-e (Múltipla e Enfratec) | 16h |
| FAT-04 | 🔴 | Integração Focus NFe: NFS-e → prefeitura | 8h |
| FAT-05 | 🔴 | Nota de Locação (Múltipla) — NFS-e com campos de contrato | 8h |
| FAT-06 | 🔴 | Listagem de notas com filtros | 6h |
| FAT-07 | 🔴 | Cancelamento de NF-e e NFS-e | 6h |
| FAT-08 | 🔴 | Emissão em lote de NFS-e (caso Sicredi — 71 notas) | 10h |
| FAT-09 | 🟡 | Download de XML e DANFE | 3h |
| FAT-10 | 🟡 | Envio de NF por e-mail (Resend) | 4h |
| FAT-11 | 🟢 | Orçamento / pré-venda com conversão em NF | 10h |

---

## Contexto Real (do Vídeo)

No **Conta Azul da Múltipla**, os lançamentos encontrados foram:
- `MONITORAMENTO – Janeiro/24` — R$ 53.566,64 (NFS-e de serviço recorrente)
- `Manutenção preventiva de Cofres 01/2024` — R$ 6.000,00
- `RECIBO SICREDI ALUGUEL GALPAO 01/2024` — R$ 3.100,00 (Nota de Locação)
- `Gerenciamento de Infraestrutura 01/2024` — R$ 23.890,95
- `NF 305 NVR_HD UA04 / NF-e:305` — R$ 4.328,85 (NF-e de produto — Enfratec)
- `NF 3325 Instalação de Câmera` — R$ 500,00 (NFS-e de serviço)

No **Everflow da Enfratec**, as contas a receber mostram:
- 71 notas para `SICREDI VALE LITORAL SC` — R$ 1.105,00 cada, todas "BAIXADO"

---

## Regras de Negócio

1. NF-e autorizada é **imutável** — só cancelar ou CC-e
2. Prazo de cancelamento NF-e: **24 horas** após autorização
3. Cancelamento requer justificativa com **mínimo 15 caracteres**
4. Ao autorizar NF-e → **baixa automática no estoque** (Enfratec)
5. Ao autorizar qualquer nota → **Conta a Receber criada automaticamente**
6. Ao cancelar nota → **Conta a Receber cancelada** + estoque restaurado (se NF-e)
7. CFOP muda conforme destino: mesmo estado → `5.xxx`, outro estado → `6.xxx`
8. Simples Nacional (Enfratec): ICMS=0, IPI=0, PIS=0, COFINS=0 na nota (recolhidos via DAS)
9. Lucro Presumido (Múltipla): PIS=0,65%, COFINS=3,00%, ISS conforme alíquota municipal

---

## Rotas Web

| Rota | Tipo | Empresa |
|------|------|---------|
| `/faturamento/notas` | Lista de todas as notas | Ambas |
| `/faturamento/nfe/novo` | Formulário NF-e | Enfratec |
| `/faturamento/nfse/novo` | Formulário NFS-e | Ambas |
| `/faturamento/locacao/novo` | Nota de Locação | Múltipla |
| `/faturamento/lote` | Emissão em lote | Múltipla |
| `/faturamento/notas/[id]` | Detalhe da nota | Ambas |

## Rotas API

```
GET    /api/faturamento/notas?tipo=&status=&de=&ate=&clienteId=&page=&pageSize=
POST   /api/faturamento/nfe
POST   /api/faturamento/nfse
POST   /api/faturamento/locacao
POST   /api/faturamento/lote          → Emissão em lote
GET    /api/faturamento/notas/:id
DELETE /api/faturamento/notas/:id/cancelar    { justificativa }
POST   /api/faturamento/notas/:id/cce        → Carta de Correção
GET    /api/faturamento/notas/:id/xml        → Download XML
GET    /api/faturamento/notas/:id/danfe      → Download PDF
POST   /api/faturamento/notas/:id/enviar-email
```

---

## FAT-01/02: NF-e (Enfratec)

### Fluxo

```
[POST /api/faturamento/nfe]
        ↓
1. Validar body com Zod
2. Verificar empresa.hasEstoque === true (só Enfratec emite NF-e de produtos)
3. Verificar saldo de estoque para cada item (alertar se insuficiente)
4. Salvar nota com status=RASCUNHO no banco
5. Gerar ref única: `${empresaId}-${nanoid()}`
6. Montar payload para Focus NFe
7. POST Focus NFe /v2/nfe?ref={ref}
8. Polling a cada 3s por até 30s
9a. ✅ AUTORIZADA:
    - Salvar chaveAcesso, protocolo, xmlAutorizado, danfePath
    - Atualizar status=AUTORIZADA
    - Dar baixa no estoque para cada item
    - Criar ContaReceber
10a. ❌ ERRO/REJEITADA:
    - Salvar mensagemErro
    - Atualizar status=ERRO
    - Não mexer no estoque
```

### Payload Focus NFe — NF-e

```typescript
// packages/fiscal/src/focus-nfe/payloads/nfe.payload.ts

export function montarPayloadNFe(nota: NotaFiscal, empresa: Empresa, cliente: ClienteFornecedor, itens: ItemNota[]) {
  const operacaoInterestadual = empresa.uf !== cliente.uf;

  return {
    natureza_operacao: nota.naturezaOperacao,
    data_emissao: nota.dataEmissao.toISOString(),
    data_entrada_saida: nota.dataSaida?.toISOString() ?? nota.dataEmissao.toISOString(),
    tipo_documento: 1,       // 1=Saída
    local_destino: operacaoInterestadual ? 2 : 1,
    finalidade_emissao: 1,  // 1=Normal
    consumidor_final: cliente.tipoPessoa === 'PF' ? 1 : 0,
    presenca_comprador: 9,   // 9=Não presencial

    emitente: {
      nome: empresa.razaoSocial,
      cnpj: empresa.cnpj,
      inscricao_estadual: empresa.inscricaoEstadual ?? '',
      regime_tributario: 1, // 1=Simples Nacional (Enfratec)
      endereco: {
        logradouro: empresa.logradouro,
        numero: empresa.numero,
        bairro: empresa.bairro,
        municipio: empresa.municipio,
        uf: empresa.uf,
        cep: empresa.cep,
        codigo_municipio: empresa.codigoMunicipio,
      },
    },

    destinatario: {
      nome: cliente.razaoSocial ?? cliente.nomeCompleto,
      cnpj: cliente.cnpj,
      cpf: cliente.cpf,
      inscricao_estadual: cliente.inscricaoEstadual ?? '',
      email: cliente.email ?? '',
      endereco: {
        logradouro: cliente.logradouro!,
        numero: cliente.numero!,
        bairro: cliente.bairro!,
        municipio: cliente.municipio!,
        uf: cliente.uf!,
        cep: cliente.cep!,
        codigo_municipio: cliente.codigoMunicipio!,
      },
    },

    items: itens.map((item, i) => ({
      numero_item: i + 1,
      codigo_produto: item.produto.codigo,
      descricao: item.produto.descricao,
      ncm: item.produto.ncm!,
      cfop: item.cfop,
      unidade_comercial: item.produto.unidade,
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: item.valorUnitario / 100,
      valor_bruto: item.valorTotal / 100,
      codigo_ean: item.produto.ean ?? 'SEM GTIN',
      icms_situacao_tributaria: item.produto.cstIcms!, // CSOSN para Simples
      icms_origem: 0, // 0=Nacional
      pis_situacao_tributaria: '07',    // 07=Isento (Simples)
      cofins_situacao_tributaria: '07', // 07=Isento (Simples)
    })),

    modalidade_frete: nota.modalidadeFrete ?? 9,
    forma_pagamento: [{ forma_pagamento: '01', valor_pagamento: nota.valorTotal / 100 }],
  };
}
```

### Calculadora Tributos — Simples Nacional

```typescript
// packages/fiscal/src/calculadora/simples-nacional.ts
// No Simples Nacional, ICMS/PIS/COFINS são zerados na nota (recolhidos via DAS)
export function calcularSimples(valorTotal: number) {
  return {
    baseIcms: valorTotal,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
  };
}
```

---

## FAT-03/04: NFS-e

### Campos específicos

```typescript
const emitirNFSeSchema = z.object({
  clienteId: z.string().cuid(),
  codigoServico: z.string(),         // Código LC 116/2003
  discriminacao: z.string().min(10), // Descrição detalhada
  dataCompetencia: z.coerce.date(),
  municipioPrestacao: z.string().length(7).optional(), // Código IBGE
  itens: z.array(itemNotaSchema).min(1),
  issRetido: z.boolean().default(false), // Sicredi retém ISS?
});
```

### Calculadora Tributos — Lucro Presumido (Múltipla)

```typescript
// packages/fiscal/src/calculadora/lucro-presumido.ts
export function calcularLP(valorServico: number, aliquotaIss: number) {
  // aliquotaIss em basis points: 300 = 3,00%
  return {
    valorIss: Math.round(valorServico * aliquotaIss / 10000),
    valorPis: Math.round(valorServico * 65 / 10000),      // 0,65%
    valorCofins: Math.round(valorServico * 300 / 10000),  // 3,00%
  };
}
```

### Payload Focus NFe — NFS-e

```typescript
export function montarPayloadNFSe(nota: NotaFiscal, empresa: Empresa, cliente: ClienteFornecedor) {
  return {
    data_emissao: nota.dataEmissao.toISOString(),
    prestador: {
      cnpj: empresa.cnpj,
      inscricao_municipal: empresa.inscricaoMunicipal!,
      codigo_municipio: empresa.codigoMunicipio,
    },
    tomador: {
      cnpj: cliente.cnpj,
      razao_social: cliente.razaoSocial!,
      email: cliente.email ?? '',
      endereco: { /* campos do endereço */ },
    },
    servico: {
      valor_servicos: nota.valorServicos / 100,
      valor_pis: nota.valorPis / 100,
      valor_cofins: nota.valorCofins / 100,
      valor_iss: nota.valorIss / 100,
      iss_retido: false,
      base_calculo: nota.valorServicos / 100,
      aliquota: 0.05, // vem do produto.aliquotaIss / 10000
      discriminacao: nota.discriminacao!,
      codigo_municipio: nota.municipioPrestacao ?? empresa.codigoMunicipio,
      item_lista_servico: nota.codigoServico!,
    },
  };
}
```

---

## FAT-05: Nota de Locação (Múltipla)

### Campos adicionais

```typescript
const emitirLocacaoSchema = emitirNFSeSchema.extend({
  numeroContrato: z.string(),
  bemLocado: z.string(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
  localUtilizacao: z.string(),
});
```

### Template de Discriminação

```typescript
function gerarDiscriminacaoLocacao(dados: {
  bemLocado: string;
  numeroContrato: string;
  dataInicio: Date;
  dataFim: Date;
  localUtilizacao: string;
  valorTotal: number;
}): string {
  return [
    `LOCAÇÃO DE ${dados.bemLocado.toUpperCase()}`,
    `Contrato nº: ${dados.numeroContrato}`,
    `Período: ${format(dados.dataInicio, 'dd/MM/yyyy')} a ${format(dados.dataFim, 'dd/MM/yyyy')}`,
    `Local de utilização: ${dados.localUtilizacao}`,
    `Valor total da locação: R$ ${(dados.valorTotal / 100).toFixed(2)}`,
  ].join('\n');
}
```

---

## FAT-08: Emissão em Lote (Sicredi — 71 NFS-e)

### Fluxo

```
POST /api/faturamento/lote
Body: {
  clienteIds: string[],       // Array de 71 CNPJs do Sicredi
  servicoBase: { codigoServico, discriminacao, dataCompetencia },
  valorPorCliente: Record<string, number> | number  // valor fixo ou por CNPJ
}
```

### Processamento

```typescript
// Processar sequencialmente (não em paralelo — Focus NFe tem rate limit)
async function emitirLote(clienteIds: string[], dadosBase: object, empresaId: string) {
  const resultados = [];
  for (const clienteId of clienteIds) {
    try {
      const nota = await emitirNFSe({ clienteId, ...dadosBase }, empresaId);
      resultados.push({ clienteId, status: 'ok', notaId: nota.id });
    } catch (e) {
      resultados.push({ clienteId, status: 'erro', mensagem: String(e) });
    }
    // Aguardar 500ms entre cada emissão
    await new Promise(r => setTimeout(r, 500));
  }
  return resultados;
}
```

**UI:** Barra de progresso em tempo real mostrando "43 de 71 emitidas..." com SSE ou polling.

---

## FAT-07: Cancelamento

```typescript
async function cancelarNota(notaId: string, justificativa: string, empresaId: string) {
  if (justificativa.length < 15) throw new ValidationError('Justificativa mínima de 15 caracteres');

  const nota = await repo.notaFiscal.findById(notaId);
  if (nota.status !== 'AUTORIZADA') throw new BusinessError('Apenas notas autorizadas podem ser canceladas');

  if (nota.tipo === 'NFE') {
    const horas = differenceInHours(new Date(), nota.dataEmissao);
    if (horas > 24) throw new BusinessError('Prazo de cancelamento expirado (24 horas)');
  }

  await focusNfe.cancelarNFe(nota.referencia, justificativa);

  await prisma.$transaction([
    // Atualizar nota
    prisma.notaFiscal.update({ where: { id: notaId }, data: { status: 'CANCELADA', cancelada: true, motivoCancelamento: justificativa, dataCancelamento: new Date() } }),
    // Cancelar conta a receber
    prisma.contaReceber.updateMany({ where: { notaFiscalId: notaId }, data: { status: 'CANCELADO' } }),
    // Restaurar estoque (se NF-e)
    ...(nota.tipo === 'NFE' ? nota.itens.map(item =>
      prisma.movimentacaoEstoque.create({ data: { tipo: 'ENTRADA_DEVOLUCAO_VENDA', quantidade: item.quantidade, /* ... */ } })
    ) : []),
  ]);
}
```

---

## Checklist FAT

- [ ] NF-e emitida em homologação retorna XML + DANFE
- [ ] NFS-e emitida em homologação retorna código de verificação da prefeitura
- [ ] Nota de locação tem campo de contrato e discriminação automática
- [ ] Emissão em lote processa 71 notas com barra de progresso
- [ ] Cancelamento dentro de 24h funciona e restaura estoque
- [ ] Conta a receber criada automaticamente ao autorizar qualquer nota
- [ ] Download de XML e DANFE funcionam
