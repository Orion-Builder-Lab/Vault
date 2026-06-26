# SKILL-02 · Módulo de Cadastros (Épico CAD)
> Pré-requisito: leia `SKILL-00-CONTEXT.md` antes deste arquivo.

---

## Backlog CAD

| ID | Prioridade | Tarefa | Estimativa |
|----|-----------|--------|-----------|
| CAD-01 | 🔴 | CRUD de Empresas + upload certificado A1 | 12h |
| CAD-02 | 🔴 | CRUD de Clientes/Fornecedores + validação CNPJ | 10h |
| CAD-03 | 🔴 | CRUD de Produtos/Serviços com campos fiscais | 14h |
| CAD-04 | 🔴 | Cadastro de Contas Bancárias | 4h |
| CAD-05 | 🟡 | Auto-preenchimento de endereço via ViaCEP | 2h |
| CAD-06 | 🟡 | Importação de clientes via CSV | 4h |

---

## CAD-01: Empresas

### Rotas Web
```
GET  /cadastros/empresas          → Lista
GET  /cadastros/empresas/[id]     → Editar
```

### Rotas API
```
GET    /api/empresas
PATCH  /api/empresas/:id
POST   /api/empresas/:id/certificado   (multipart/form-data)
DELETE /api/empresas/:id/certificado
```

### Campos

| Campo | Tipo | Obrigatório | Observação |
|-------|------|------------|-----------|
| razaoSocial | string | ✅ | |
| nomeFantasia | string | — | |
| cnpj | string 14 dígitos | ✅ | Validar dígito verificador |
| inscricaoEstadual | string | — | |
| inscricaoMunicipal | string | — | Necessário para NFS-e |
| regimeTributario | enum | ✅ | SIMPLES_NACIONAL / LUCRO_PRESUMIDO |
| hasEstoque | boolean | ✅ | true=Enfratec, false=Múltipla |
| cep | string 8 dígitos | ✅ | Auto-preenche endereço |
| logradouro, numero, bairro | string | ✅ | |
| municipio | string | ✅ | |
| uf | string 2 chars | ✅ | |
| codigoMunicipio | string 7 dígitos | ✅ | Código IBGE — obrigatório para SPED e NFS-e |
| cnae | string | — | Confirmar com contador para Múltipla |
| email, telefone | string | — | |
| certificadoPath | string | — | Path no Supabase Storage |
| certificadoSenhaEnc | string | — | AES-256-GCM encrypted |
| focusNfeToken | string | — | Token por empresa no Focus NFe |
| limiteAprovacaoPagamento | int (centavos) | ✅ | Padrão: 500000 (R$ 5.000) |
| diasVencimentoPadrao | int | ✅ | Padrão: 30 |

### Upload de Certificado A1

```typescript
// Fluxo:
// 1. Receber arquivo .pfx via multipart
// 2. Upload para Supabase Storage bucket 'certificados' (privado)
// 3. Criptografar a senha com AES-256-GCM
// 4. Salvar path e senha encriptada no banco

import { createCipheriv, randomBytes } from 'crypto';

function encryptSenha(senha: string): string {
  const iv = randomBytes(16);
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(senha, 'utf8', 'hex') + cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}
```

---

## CAD-02: Clientes e Fornecedores

### Contexto real (do vídeo)
No Conta Azul a Múltipla tem lançamentos para: SUREG, SICREDI UA04 BOMBAS, SICREDI UA04, GALPAO, e outros. Cada agência Sicredi é um CNPJ diferente — todos precisam estar cadastrados como cliente de ambas as empresas.

### Rotas Web
```
GET  /cadastros/clientes-fornecedores         → Lista com filtro tipo
GET  /cadastros/clientes-fornecedores/novo    → Formulário novo
GET  /cadastros/clientes-fornecedores/[id]    → Editar
```

### Rotas API
```
GET    /api/clientes-fornecedores?tipo=CLIENTE|FORNECEDOR|all&q=busca
POST   /api/clientes-fornecedores
GET    /api/clientes-fornecedores/:id
PATCH  /api/clientes-fornecedores/:id
DELETE /api/clientes-fornecedores/:id          (soft delete: ativo=false)
GET    /api/clientes-fornecedores/cnpj/:cnpj   (consulta Receita Federal)
POST   /api/clientes-fornecedores/importar-csv (multipart)
```

### Campos

| Campo | Obrigatório | Observação |
|-------|------------|-----------|
| tipo | ✅ | Array: ['CLIENTE'], ['FORNECEDOR'] ou ambos |
| tipoPessoa | ✅ | PF ou PJ |
| cnpj (PJ) / cpf (PF) | ✅ | Validar algoritmo + Receita Federal |
| razaoSocial / nomeCompleto | ✅ | Auto-preenche via CNPJ |
| inscricaoEstadual | — | Usar "ISENTO" se isento |
| inscricaoMunicipal | — | |
| endereço completo | — | Auto-preenche via CNPJ ou CEP |
| codigoMunicipio | — | Necessário para emissão de NFS-e |
| email, telefone | — | |
| limiteCredito | — | Centavos |
| condicaoPagamento | — | Ex: "30/60/90" |

### Consulta Automática na Receita Federal

```typescript
// packages/fiscal/src/receita-federal.ts
export async function consultarCNPJ(cnpj: string) {
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj.replace(/\D/g, '')}`);
  if (!res.ok) throw new Error('CNPJ não encontrado na Receita Federal');
  const d = await res.json();
  return {
    razaoSocial: d.razao_social,
    nomeFantasia: d.nome_fantasia,
    cep: d.cep?.replace('-', ''),
    logradouro: d.logradouro,
    numero: d.numero,
    bairro: d.bairro,
    municipio: d.municipio,
    uf: d.uf,
    codigoMunicipio: d.codigo_municipio_ibge?.toString(),
  };
}
```

### Validação CNPJ

```typescript
// packages/validators/src/cnpj.ts
export function validarCNPJ(cnpj: string): boolean {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (c: string, len: number) => {
    let s = 0, p = len - 7;
    for (let i = len; i >= 1; i--) { s += +c[len - i] * p--; if (p < 2) p = 9; }
    return s % 11 < 2 ? 0 : 11 - (s % 11);
  };
  return calc(c, 12) === +c[12] && calc(c, 13) === +c[13];
}
```

---

## CAD-03: Produtos e Serviços

### ⚠️ Campos fiscais incorretos causam rejeição na SEFAZ

### Contexto real (do vídeo)
A Enfratec vende/presta serviços de:
- Monitoramento (serviço recorrente mensal)
- Manutenção preventiva de cofres
- NVR / HD (equipamentos de CFTV) — produtos físicos com NCM
- Instalação de câmera (serviço)
- Equipamentos de segurança

Cada tipo tem NCM, CFOP e CSOSN diferentes — confirmar com contador.

### Rotas Web
```
GET  /cadastros/produtos              → Lista (filtro: PRODUTO/SERVICO)
GET  /cadastros/produtos/novo         → Formulário novo
GET  /cadastros/produtos/[id]         → Editar
```

### Rotas API
```
GET    /api/produtos?tipo=PRODUTO|SERVICO&q=busca&ativo=true
POST   /api/produtos
GET    /api/produtos/:id
PATCH  /api/produtos/:id
DELETE /api/produtos/:id    (soft delete)
```

### Campos por tipo

**PRODUTO (físico):**

| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| ncm | ✅ | 8 dígitos — validar no cadastro |
| cest | — | 7 dígitos — obrigatório se temST=true |
| cfopPadrao | ✅ | 4 dígitos (5102=venda estadual, 6102=interestadual) |
| cstIcms (CSOSN p/ Simples) | ✅ | Ex: 400=não tributada pelo Simples |
| ean | — | EAN-13 ou "SEM GTIN" |
| unidade | ✅ | UN, KG, CX, MT, PC... |
| temST | boolean | Substituição Tributária |
| precoVenda | ✅ | Centavos |
| estoqueMinimo | — | Para alerta — apenas Enfratec |

**SERVIÇO:**

| Campo | Obrigatório | Descrição |
|-------|------------|-----------|
| codigoServico | ✅ | Código da LC 116/2003 |
| itemListaServico | ✅ | Ex: "14.01" para manutenção de equipamentos |
| aliquotaIss | ✅ | Em basis points: 300 = 3,00% |
| unidade | ✅ | Geralmente SRV ou HR |

### Tabela CFOP de Referência

| Operação | Estadual | Interestadual |
|----------|----------|--------------|
| Venda mercadoria (revenda) | 5.102 | 6.102 |
| Venda mercadoria (produção própria) | 5.101 | 6.101 |
| Devolução de venda | 1.202 | 2.202 |
| Devolução de compra | 5.202 | 6.202 |
| Transferência entre empresas | 5.152 | 6.152 |
| Prestação de serviço | 5.933 | — |

### Tabela CSOSN (Simples Nacional — Enfratec)

| Código | Situação |
|--------|----------|
| 102 | Tributada sem permissão de crédito (mais comum) |
| 202 | Tributada com ST |
| 400 | Não tributada pelo Simples (serviços geralmente) |
| 500 | ICMS já recolhido por ST (mercadoria já tributada) |
| 900 | Outros |

---

## CAD-04: Contas Bancárias

### Rotas
```
GET    /cadastros/contas-bancarias
GET    /api/contas-bancarias
POST   /api/contas-bancarias
PATCH  /api/contas-bancarias/:id
```

### Campos

| Campo | Obrigatório |
|-------|------------|
| nomeBanco | ✅ |
| codigoBanco | ✅ | Código FEBRABAN (ex: 756=Sicoob, 341=Itaú) |
| agencia | ✅ |
| conta | ✅ |
| digito | — |
| tipo | ✅ | CORRENTE / POUPANCA |
| saldoInicial | ✅ | Centavos |
| dataInicial | ✅ | Data do saldo inicial para conciliação |

---

## CAD-05: Auto-preenchimento CEP

```typescript
// packages/fiscal/src/viacep.ts
export async function buscarCEP(cep: string) {
  const c = cep.replace(/\D/g, '');
  if (c.length !== 8) throw new Error('CEP inválido');
  const res = await fetch(`https://viacep.com.br/ws/${c}/json/`);
  const d = await res.json();
  if (d.erro) throw new Error('CEP não encontrado');
  return {
    logradouro: d.logradouro,
    bairro: d.bairro,
    municipio: d.localidade,
    uf: d.uf,
    codigoMunicipio: d.ibge,
  };
}
```

---

## Checklist CAD

- [ ] Empresa atualiza certificado A1 com upload e senha criptografada
- [ ] CNPJ auto-preenche razão social e endereço via Receita Federal
- [ ] Produto com NCM obrigatório valida 8 dígitos
- [ ] Serviço com alíquota ISS obrigatória
- [ ] SaldoEstoque criado com quantidade=0 ao cadastrar produto tipo PRODUTO na Enfratec
- [ ] Import CSV de clientes funciona com relatório de erros
- [ ] CEP auto-preenche codigoMunicipio (IBGE 7 dígitos)
