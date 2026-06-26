# SIGEF — Sistema Integrado de Gestão Fiscal

> **Orion Lab** · Versão 1.0 MVP · Confidencial

Sistema web multi-empresa desenvolvido sob medida para **Múltipla Gestão** e **Enfratec**, substituindo o Conta Azul e o Everflow por uma plataforma unificada com gestão fiscal, financeira, de estoque e geração de SPED automático.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Empresas Atendidas](#empresas-atendidas)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Módulos e Telas](#módulos-e-telas)
  - [Autenticação](#1-autenticação)
  - [Dashboard](#2-dashboard)
  - [Cadastros](#3-cadastros)
  - [Faturamento](#4-faturamento)
  - [Compras](#5-compras)
  - [Estoque](#6-estoque)
  - [Financeiro](#7-financeiro)
  - [SPED Fiscal](#8-sped-fiscal)
- [Fluxos Principais](#fluxos-principais)
- [Regras de Negócio](#regras-de-negócio)
- [Stack Técnica](#stack-técnica)
- [Banco de Dados](#banco-de-dados)
- [Backlog e Sprints](#backlog-e-sprints)
- [Como Rodar o Projeto](#como-rodar-o-projeto)

---

## Visão Geral

O SIGEF nasce da necessidade real observada: a Múltipla usa o **Conta Azul** e a Enfratec usa o **Everflow**, e os dois sistemas não se comunicam. A gestora precisa abrir duas abas, fazer reconciliação manual e não tem visão consolidada do grupo.

```
ANTES (situação atual)
┌─────────────────────┐    ┌─────────────────────┐
│    CONTA AZUL       │    │     EVERFLOW         │
│  Múltipla Gestão    │    │     Enfratec         │
│                     │    │                      │
│ • Financeiro básico │    │ • Financeiro básico  │
│ • Sem SPED          │    │ • SPED manual        │
│ • Sem estoque       │    │ • Sem integração NF  │
│ • Sem NFS-e nativo  │    │ • 3.716 contas pagar │
└─────────────────────┘    └─────────────────────┘
         ↕                          ↕
    NENHUMA INTEGRAÇÃO — gestora trabalha manualmente

DEPOIS (SIGEF)
┌──────────────────────────────────────────────────────┐
│                      SIGEF                           │
│  [Múltipla Gestão]  ←→  [Enfratec]  ←→  [Grupo]    │
│                                                      │
│ • Financeiro unificado por empresa + consolidado     │
│ • Emissão NF-e, NFS-e e Nota de Locação integrada   │
│ • Estoque com custo médio e Bloco H automático       │
│ • SPED gerado automaticamente a cada fechamento      │
│ • Conciliação bancária com matching automático       │
└──────────────────────────────────────────────────────┘
```

---

## Empresas Atendidas

| | Múltipla Gestão | Enfratec |
|---|---|---|
| **Regime Tributário** | Lucro Presumido | Simples Nacional |
| **Atividade** | Serviços de gerenciamento e locação | Compra/revenda + prestação de serviços |
| **Notas emitidas** | NFS-e + Nota de Locação | NF-e + NFS-e |
| **Tributos** | ISS, PIS (0,65%), COFINS (3%), IRPJ, CSLL | DAS unificado |
| **Estoque** | ❌ Não possui | ✅ Obrigatório (Bloco H) |
| **SPED** | SPED Contribuições | SPED Fiscal (EFD ICMS/IPI) |
| **Sistema atual** | Conta Azul Pro | Everflow |
| **Cliente principal** | Sicredi SC | Sicredi SC |

### Cliente Final

Ambas as empresas atendem a **Sicredi – Região de Santa Catarina**, que possui múltiplas agências/postos, cada um com CNPJ próprio. A Enfratec emite notas individuais por CNPJ (padrão: ~71 NFS-e mensais de R$ 1.105,00 cada para Sicredi Vale Litoral SC).

---

## Arquitetura do Sistema

### Multi-Tenant por Empresa

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO (browser)                        │
│  Login → seleciona empresa ativa → JWT com {empresaId}     │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │     Next.js 14 Web      │
              │    (App Router + SSR)   │
              └────────────┬────────────┘
                           │ REST API
              ┌────────────▼────────────┐
              │    Fastify API          │
              │  (Arquitetura Hex.)     │
              │  JWT verify + empresaId │
              └────┬──────────┬─────────┘
                   │          │
      ┌────────────▼──┐  ┌────▼──────────────┐
      │  PostgreSQL   │  │  Supabase Storage  │
      │  (Prisma ORM) │  │  XMLs, PDFs, SPED  │
      │  RLS por CNPJ │  └───────────────────-┘
      └───────────────┘
                   │
      ┌────────────▼────────────┐
      │     Focus NFe API       │
      │  NF-e, NFS-e → SEFAZ   │
      └─────────────────────────┘
```

### Isolamento de Dados (Multi-tenant)

- Toda tabela tem coluna `empresa_id`
- Row Level Security (RLS) no PostgreSQL filtra automaticamente
- O JWT carrega `{ userId, empresaId, role }` — troca de empresa = novo token
- Relatórios consolidados do grupo são gerados por JOIN controlado em queries específicas

### Perfis de Acesso

| Role | Múltipla | Enfratec | Acesso |
|------|----------|----------|--------|
| `admin` | ✅ Total | ✅ Total | Tudo: configurações, usuários, relatórios consolidados |
| `financeiro` | ✅ Total | ✅ Total | Lançamentos, conciliação, contas, fluxo de caixa |
| `faturamento` | ✅ | ✅ | Emitir/consultar notas. Sem acesso financeiro |
| `almoxarife` | ❌ | ✅ Total | Só Enfratec: estoque, compras, inventário |
| `contador` | 📥 Leitura | 📥 Leitura | Download XMLs + exportar SPED. Sem edição |

---

## Módulos e Telas

### 1. Autenticação

#### Telas

| Rota | Nome | Descrição |
|------|------|-----------|
| `/login` | Login | E-mail + senha + seleção da empresa ativa |
| `/login/recuperar-senha` | Recuperar senha | Envio de link por e-mail |
| `/login/nova-senha` | Nova senha | Redefinição via token |

#### Fluxo de Login

```
[Usuário acessa o sistema]
        ↓
[Tela de Login]
  ├── Preenche e-mail + senha
  ├── Seleciona empresa ativa (Múltipla ou Enfratec)
  │       ↓ usuário com acesso às duas → mostra dropdown
  │       ↓ usuário com acesso a uma → pré-selecionado
  └── Clica em Entrar
        ↓
[API valida credenciais]
  ├── ❌ Inválido → mensagem de erro, mantém na tela de login
  └── ✅ Válido → gera JWT {userId, empresaId, role}
        ↓
[Redireciona para /dashboard]
```

#### Seletor de Empresa (Header)

Usuários com acesso às duas empresas podem trocar a empresa ativa a qualquer momento pelo header. A troca invalida o token atual e gera um novo. **Dados da tela são recarregados para a empresa selecionada.**

---

### 2. Dashboard

#### Rota: `/`

Visão executiva do estado financeiro da empresa ativa (ou consolidado do grupo para admin).

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│  [Seletor: Múltipla | Enfratec | Grupo Consolidado]         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Saldo atual  │ A receber    │ A pagar      │ Resultado mês  │
│ R$ 84.320    │ R$ 47.200    │ R$ 12.800    │ R$ 34.400      │
│ (hoje)       │ (próx. 30d)  │ (próx. 30d)  │ (acumulado)    │
├──────────────┴──────────────┴──────────────┴────────────────┤
│  Gráfico: Entradas vs Saídas (últimas 8 semanas)            │
│  ████████████░░░░░░░░░░░░  (barras por semana)              │
├──────────────────────────┬──────────────────────────────────┤
│  Contas vencidas hoje    │  Notas aguardando emissão        │
│  ┌──────────────────┐    │  ┌──────────────────────────┐   │
│  │ 3 contas a pagar │    │  │ 0 rascunhos pendentes    │   │
│  │ R$ 8.400,00      │    │  └──────────────────────────┘   │
│  └──────────────────┘    │                                  │
├──────────────────────────┼──────────────────────────────────┤
│  Últimos lançamentos     │  Estoque crítico (Enfratec)      │
│  (5 mais recentes)       │  Produtos abaixo do mínimo       │
└──────────────────────────┴──────────────────────────────────┘
```

#### Dados exibidos

- **Saldo bancário atual** — soma de todas as contas da empresa ativa
- **Projeção 7 / 30 / 90 dias** — entradas e saídas previstas
- **Gráfico de fluxo de caixa** — 8 semanas (entradas vs saídas por semana)
- **Contas vencidas** — alerta com valor total e quantidade
- **Notas rascunho** — atalho para notas não enviadas
- **Estoque crítico** — apenas para Enfratec: produtos com saldo ≤ mínimo

#### Regras

- Admin vê **seletor de visão**: empresa individual ou grupo consolidado
- Outros perfis veem apenas a empresa do seu token
- Atualização em tempo real a cada 5 minutos (polling)

---

### 3. Cadastros

#### 3.1 Empresas

| Rota | Nome |
|------|------|
| `/cadastros/empresas` | Lista de empresas |
| `/cadastros/empresas/[id]` | Editar empresa |

**Campos por empresa:**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Razão social | Texto | ✅ |
| Nome fantasia | Texto | — |
| CNPJ | 14 dígitos (validado) | ✅ |
| Inscrição Estadual | Texto | — |
| Inscrição Municipal | Texto | — |
| Regime tributário | Enum (Simples/LP/LR) | ✅ |
| Possui estoque? | Boolean | ✅ |
| CEP | 8 dígitos (auto-preenche endereço) | ✅ |
| Logradouro, nº, bairro, cidade, UF | Texto | ✅ |
| Código IBGE do município | 7 dígitos | ✅ |
| E-mail, telefone | Texto | — |
| Certificado Digital A1 | Upload `.pfx` + senha | — |
| Token Focus NFe | Texto (criptografado) | — |
| Limite aprovação pagamento | Valor (centavos) | ✅ |
| Dias padrão vencimento | Número | ✅ (padrão: 30) |

#### 3.2 Clientes e Fornecedores

| Rota | Nome |
|------|------|
| `/cadastros/clientes-fornecedores` | Lista (filtro: cliente/fornecedor/ambos) |
| `/cadastros/clientes-fornecedores/novo` | Novo cadastro |
| `/cadastros/clientes-fornecedores/[id]` | Editar |

**Campos:**

| Campo | Tipo | Observação |
|-------|------|-----------|
| Tipo | Multi-select (CLIENTE / FORNECEDOR) | ✅ |
| Pessoa | Enum (PF / PJ) | ✅ |
| CNPJ ou CPF | Validado + consulta automática na Receita Federal | ✅ |
| Razão social / Nome completo | Auto-preenchido pela Receita | ✅ |
| Inscrição Estadual | Texto (ou "ISENTO") | — |
| Inscrição Municipal | Texto | — |
| Endereço completo | Auto-preenchido pelo CNPJ/CEP | — |
| E-mail, telefone | Texto | — |
| Limite de crédito | Valor | — |
| Condição de pagamento padrão | Texto (ex: "30/60/90") | — |

> 💡 **Sicredi SC**: já pré-cadastrado como cliente de ambas as empresas no seed inicial. Cada agência Sicredi com CNPJ diferente é um cadastro separado.

**Funcionalidades especiais:**
- Busca CNPJ na Receita Federal ao digitar → auto-preenche campos
- Importação em massa via CSV
- Filtro rápido: Clientes ativos / Fornecedores ativos / Inadimplentes

#### 3.3 Produtos e Serviços

| Rota | Nome |
|------|------|
| `/cadastros/produtos` | Lista (filtro: produto/serviço) |
| `/cadastros/produtos/novo` | Novo produto/serviço |
| `/cadastros/produtos/[id]` | Editar |

**Campos fiscais (atenção redobrada):**

| Campo | Tipo | Para |
|-------|------|------|
| Tipo | Enum (PRODUTO / SERVIÇO) | Ambos |
| Código interno | Texto único por empresa | Ambos |
| Descrição completa | Texto | Ambos |
| Unidade de medida | Enum (UN, KG, CX, MT, SRV, HR...) | Ambos |
| NCM | 8 dígitos — obrigatório p/ produtos físicos | Produto |
| CEST | 7 dígitos — apenas se tem ST | Produto |
| CFOP padrão | 4 dígitos | Produto |
| CST / CSOSN | Situação tributária ICMS | Produto |
| EAN / GTIN | Código de barras | Produto (NFC-e) |
| Código de serviço LC 116/2003 | Texto | Serviço |
| Alíquota ISS | % em basis points | Serviço |
| Preço de custo | Valor (centavos) | Ambos |
| Preço de venda | Valor (centavos) | Ambos |
| Estoque mínimo | Quantidade | Produto (Enfratec) |

> ⚠️ **NCM errado = rejeição na SEFAZ.** Todos os produtos físicos da Enfratec precisam ter NCM validado com o contador antes de ir para produção.

#### 3.4 Contas Bancárias

| Rota | Nome |
|------|------|
| `/cadastros/contas-bancarias` | Lista de contas |
| `/cadastros/contas-bancarias/novo` | Nova conta |

**Campos:** Banco (nome + código FEBRABAN), agência, conta, dígito, tipo (corrente/poupança), saldo inicial, data do saldo inicial.

---

### 4. Faturamento

> Disponível para: `admin`, `financeiro`, `faturamento`

#### 4.1 Lista de Notas Fiscais

| Rota | `/faturamento/notas` |
|------|----------------------|

**Filtros disponíveis:**

| Filtro | Opções |
|--------|--------|
| Tipo | NF-e / NFS-e / Nota de Locação / Todos |
| Status | Rascunho / Enviando / Autorizada / Cancelada / Erro / Todos |
| Período | De / Até (data de emissão) |
| Cliente | Busca por nome ou CNPJ |
| Valor | Faixa mínima e máxima |

**Colunas da tabela:**

| Coluna | Descrição |
|--------|-----------|
| Número | Número da nota (após autorização) |
| Tipo | NF-e / NFS-e / Locação |
| Cliente | Razão social |
| Data emissão | Data |
| Valor total | R$ |
| Status | Badge colorido |
| Ações | Ver / Baixar XML / Baixar DANFE / Cancelar / Enviar por e-mail |

**Ações em lote:**
- Emitir lote de NFS-e (seleção múltipla → mesmos dados base, CNPJs diferentes)
- Exportar lista para XLSX

#### 4.2 Emissão de NF-e (Enfratec — produtos físicos)

| Rota | `/faturamento/nfe/novo` |
|------|------------------------|

**Fluxo de emissão:**

```
[Selecionar cliente]
        ↓
[Informar natureza da operação + data de saída]
        ↓
[Adicionar itens]
  ├── Buscar produto (código ou descrição)
  ├── Informar quantidade e valor unitário
  ├── Sistema calcula tributos automaticamente
  │     Simples Nacional → ICMS=0, IPI=0, PIS=0, COFINS=0 (recolhidos no DAS)
  │     CFOP preenchido automaticamente (estadual ou interestadual)
  └── Adicionar mais itens ou ir para resumo
        ↓
[Resumo + totais]
  ├── Subtotal de produtos
  ├── Frete / seguro / outras despesas (opcional)
  ├── Total da nota
  └── Forma de pagamento
        ↓
[Salvar como rascunho] ou [Emitir]
        ↓ (ao emitir)
[API → Focus NFe → SEFAZ]
  ├── ❌ Erro/Rejeição → exibe código e mensagem de erro, mantém rascunho
  └── ✅ Autorizada → salva XML + DANFE, cria Conta a Receber automaticamente
              ↓
        [Baixa automática no estoque para cada item]
```

**Campos do formulário:**

| Campo | Obrigatório |
|-------|-------------|
| Cliente (CNPJ + razão social) | ✅ |
| Natureza da operação | ✅ |
| Data de emissão | ✅ (padrão: hoje) |
| Data de saída | ✅ |
| Modalidade de frete | ✅ (padrão: sem frete) |
| Itens (produto, qtd, valor, CFOP) | ✅ mínimo 1 |
| Observações | — |

#### 4.3 Emissão de NFS-e (ambas as empresas)

| Rota | `/faturamento/nfse/novo` |
|------|--------------------------|

**Campos específicos de serviço:**

| Campo | Obrigatório |
|-------|-------------|
| Cliente | ✅ |
| Código de serviço (LC 116/2003) | ✅ |
| Discriminação do serviço | ✅ (mín. 10 caracteres) |
| Mês de competência | ✅ |
| Município de prestação | ✅ (padrão: município da empresa) |
| Valor do serviço | ✅ |
| ISS retido pelo tomador? | Toggle |
| Deduções | Valor opcional |

**Cálculo automático (Múltipla — Lucro Presumido):**
- ISS = valor × alíquota municipal
- PIS = valor × 0,65%
- COFINS = valor × 3,00%
- IRPJ e CSLL apurados no fechamento (não por nota)

**Emissão em lote (caso Sicredi):**
- Seleção de múltiplos CNPJs do mesmo grupo
- Campos comuns preenchidos uma vez (serviço, competência, valor)
- Sistema emite uma NFS-e por CNPJ sequencialmente
- Progresso exibido em tempo real (ex: "43 de 71 emitidas...")

#### 4.4 Nota Fiscal de Locação (Múltipla)

| Rota | `/faturamento/locacao/novo` |
|------|-----------------------------|

Emitida como NFS-e com código de serviço 3.01 da LC 116/2003.

**Campos adicionais:**

| Campo | Obrigatório |
|-------|-------------|
| Número do contrato de locação | ✅ |
| Bem locado (descrição) | ✅ |
| Data início da locação | ✅ |
| Data fim da locação | ✅ |
| Local de utilização | ✅ |
| Valor diário ou mensal | — |

A discriminação é gerada automaticamente no formato:
```
LOCAÇÃO DE [BEM]
Contrato nº: [NÚMERO]
Período: [DD/MM/AAAA] a [DD/MM/AAAA]
Local de utilização: [LOCAL]
Valor total da locação: R$ [VALOR]
```

#### 4.5 Cancelamento e Carta de Correção

**Cancelamento:**
- Disponível até 24h após autorização (NF-e) ou prazo municipal (NFS-e)
- Campo de justificativa obrigatório (mínimo 15 caracteres)
- Ao cancelar: status da nota → CANCELADA, Conta a Receber → CANCELADA, estoque restaurado (NF-e)

**Carta de Correção (CC-e) — apenas NF-e:**
- Campos que podem ser corrigidos: dados do destinatário, condições de venda, dados adicionais
- **Não pode corrigir:** valor, data, item, tributação, remetente

---

### 5. Compras

> Disponível para: `admin`, `financeiro`, `almoxarife` · Apenas Enfratec

| Rota | Nome |
|------|------|
| `/compras` | Lista de notas de entrada |
| `/compras/importar-xml` | Importar XML de fornecedor |
| `/compras/manual/novo` | Lançamento manual (sem XML) |
| `/compras/[id]` | Detalhe da nota de compra |

#### Fluxo de Importação de XML

```
[Upload do arquivo XML da NF-e do fornecedor]
        ↓
[Parser lê e extrai dados]
  ├── Fornecedor: CNPJ, razão social, endereço
  ├── Itens: código, descrição, NCM, CFOP, qtd, valor, tributos
  └── Totais: produtos, frete, IPI, ICMS-ST, total
        ↓
[Validação da chave de acesso na SEFAZ]
  ├── ❌ Inválida → bloqueia importação
  └── ✅ Válida → prossegue
        ↓
[Pré-visualização para confirmação]
  ├── Fornecedor: criar novo? ou já existe? (matching por CNPJ)
  ├── Itens: match automático por NCM com produtos cadastrados
  │     ├── ✅ Match encontrado → vincula automaticamente
  │     └── ❓ Sem match → usuário seleciona produto ou cadastra novo
  └── Data de entrada (padrão: hoje)
        ↓
[Confirmar importação]
        ↓ (ao confirmar)
  ├── Cria NotaCompra com status CONFIRMADA
  ├── Dá entrada no estoque (custo médio recalculado)
  └── Cria Conta a Pagar com vencimento calculado
```

**Campos da tela de pré-visualização:**

| Seção | Dados |
|-------|-------|
| Fornecedor | CNPJ, razão social, UF |
| Chave de acesso | 44 dígitos validados na SEFAZ |
| Número / Série / Data | Da nota do fornecedor |
| Tabela de itens | Descrição, qtd, valor unitário, total, NCM, match com produto interno |
| Totais | Produtos, frete, IPI, ICMS-ST, total da nota |
| Vencimento | Data calculada (data emissão + prazo padrão) |
| Forma de pagamento | Selecionável |

---

### 6. Estoque

> Disponível para: `admin`, `financeiro`, `almoxarife` · Apenas Enfratec

| Rota | Nome |
|------|------|
| `/estoque/saldo` | Posição atual do estoque |
| `/estoque/movimentacoes` | Histórico de todas as movimentações |
| `/estoque/movimentacoes/[produtoId]` | Histórico por produto |
| `/estoque/ajuste/novo` | Ajuste manual de inventário |
| `/estoque/inventario` | Snapshot do inventário (Bloco H) |

#### 6.1 Tela de Saldo

**Colunas:**

| Coluna | Descrição |
|--------|-----------|
| Código | Código interno do produto |
| Descrição | Nome do produto |
| Unidade | UN, KG, CX... |
| Saldo atual | Quantidade em estoque |
| Custo médio | R$ por unidade (calculado) |
| Valor total | Saldo × custo médio |
| Estoque mín. | Configurado no produto |
| Situação | ✅ OK / ⚠️ Abaixo do mínimo / 🔴 Zerado |

**Filtros:** Busca por código/descrição, situação (OK / Crítico / Zerado).

#### 6.2 Histórico de Movimentações

**Colunas:**

| Coluna | Descrição |
|--------|-----------|
| Data | Data/hora da movimentação |
| Produto | Código + descrição |
| Tipo | Entrada Compra / Saída Venda / Ajuste / Devolução |
| Quantidade | + para entrada, - para saída |
| Custo unitário | R$ na data |
| Saldo anterior | Antes da movimentação |
| Saldo posterior | Após a movimentação |
| Custo médio após | CMP recalculado |
| Origem | Link para nota vinculada |

#### 6.3 Ajuste Manual

**Regras:**
- Requer justificativa obrigatória (mín. 20 caracteres)
- Ajustes positivos ou negativos com quantidade e custo informados
- Aguarda aprovação de `admin` ou `financeiro` antes de atualizar o saldo
- Rastreável: quem solicitou, quem aprovou, data/hora

#### 6.4 Custo Médio Ponderado (CMP)

A cada entrada de mercadoria, o custo médio é recalculado:

```
Novo CMP = (Saldo atual × CMP atual + Qtd entrada × Custo entrada)
           ─────────────────────────────────────────────────────────
                         Saldo atual + Qtd entrada
```

O custo médio nunca muda em saídas — apenas em entradas.

#### 6.5 Inventário (Bloco H)

Snapshot da posição de estoque em uma data específica. Usado para gerar o Bloco H do SPED.

**Tela:**
- Data do inventário (padrão: último dia do mês)
- Motivo (dropdown: Balanço periódico / Abertura / Encerramento / Exigência fiscal)
- Tabela: todos os produtos com saldo > 0 na data selecionada
- Botão: **Gerar Bloco H** (integrado ao módulo SPED)

---

### 7. Financeiro

> Disponível para: `admin`, `financeiro`

#### 7.1 Contas a Receber

| Rota | `/financeiro/contas-receber` |
|------|------------------------------|

**Filtros:**

| Filtro | Opções |
|--------|--------|
| Status | Aberto / Parcial / Quitado / Vencido / Todos |
| Período | Vencimento de / até |
| Cliente | Busca |
| Categoria | Dropdown (Locação, Monitoramento, Manutenção, Suporte...) |
| Empresa | Apenas admin com visão consolidada |

**Cards de resumo no topo:**

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  Vencidos    │ Vencem hoje  │  A vencer    │  Recebidos   │
│ R$ 133.890   │  R$ 0,00     │  R$ 23.890   │ R$ 209.286   │
│ (vermelho)   │              │              │ (verde)      │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Colunas da tabela:**

| Coluna | Descrição |
|--------|-----------|
| Vencimento | Data |
| Cliente | Razão social |
| Descrição / Nota | Resumo do lançamento + link para NF |
| Categoria | Tag colorida |
| Total (R$) | Valor original |
| A receber (R$) | Valor ainda pendente |
| Situação | Badge: Recebido / Em aberto / Vencido |
| Ações | Baixar / Editar / Cancelar |

**Criação:**
- **Automática**: ao autorizar qualquer NF-e ou NFS-e
- **Manual**: lançamentos avulsos (adiantamentos, correções)

**Campos obrigatórios no lançamento manual:**
- Cliente, descrição, valor, vencimento, categoria

**Baixa manual:**
- Data do recebimento, valor recebido, forma de pagamento
- Se valor recebido < valor original → status = PARCIAL

#### 7.2 Contas a Pagar

| Rota | `/financeiro/contas-pagar` |
|------|----------------------------|

Mesma estrutura de filtros e cards que Contas a Receber, adaptados para pagamentos.

**Funcionalidades extras:**

- **Parcelamento automático**: ao criar um lançamento, informar "10x de R$ 583,17" → sistema gera as 10 parcelas automaticamente com vencimentos mensais
- **Aprovação por limite**: pagamentos acima do limite configurado na empresa ficam em "Pendente de aprovação" até um `admin` ou `financeiro sênior` aprovar
- **Categorias de despesa** (alimenta o DRE):
  - Pessoal
  - Tributário (DAS, IRPJ, CSLL, ISS)
  - Operacional
  - Administrativo
  - Equipamentos / Ativos
  - Outros

**Criação:**
- **Automática**: ao confirmar uma nota de compra
- **Manual**: despesas operacionais (aluguel, salários, serviços contratados)

#### 7.3 Fluxo de Caixa

| Rota | `/financeiro/fluxo-caixa` |
|------|---------------------------|

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Saldo atual: R$ 84.320,00  [atualizado em 14:32]       │
├──────────────┬───────────────┬──────────────────────────-┤
│  Hoje        │  7 dias       │  30 dias      │  90 dias  │
│  +R$ 12.400  │  +R$ 47.200  │  +R$ 120.000  │  +R$...   │
│  -R$ 3.200   │  -R$ 18.400  │  -R$ 82.000   │  -R$...   │
│  = R$ 9.200  │  = R$ 28.800 │  = R$ 38.000  │  = R$...  │
├──────────────┴───────────────┴────────────────────────────┤
│  [Gráfico de barras: Entradas vs Saídas — 8 semanas]     │
│                                                          │
│  ████ Entradas                                           │
│  ░░░░ Saídas                                             │
└──────────────────────────────────────────────────────────┘
```

#### 7.4 Conciliação Bancária

| Rota | `/financeiro/conciliacao` |
|------|--------------------------|

**Fluxo completo:**

```
[Selecionar conta bancária e período]
        ↓
[Importar extrato]
  ├── Upload arquivo OFX (exportado do internet banking)
  └── Ou CNAB 240/400 (arquivo remessa bancária)
        ↓
[Motor de conciliação automática]
  ├── Matching por: valor exato + data (tolerância ±3 dias)
  ├── Créditos → busca em Contas a Receber abertas
  └── Débitos → busca em Contas a Pagar abertas
        ↓
[Resultado]
  ├── ✅ Conciliados automaticamente: marcados como quitados
  └── ❓ Não conciliados: ficam na fila de revisão manual
        ↓
[Tela de revisão]
  ├── Cada item do extrato não conciliado
  ├── Opções: Vincular a lançamento existente / Criar novo lançamento / Ignorar
  └── Salvar revisão
        ↓
[Relatório de inconsistências]
  ├── Itens do extrato sem correspondência no sistema
  ├── Contas vencidas sem movimentação bancária
  └── Exportar em XLSX
```

**Resumo anual exportável:**

Relatório em XLSX com os 12 meses: entradas, saídas, saldo inicial, saldo final, itens não conciliados por mês.

#### 7.5 DRE Simplificado

| Rota | `/financeiro/dre` |
|------|-------------------|

```
DEMONSTRATIVO DE RESULTADO DO EXERCÍCIO
Período: [mês/ano] — Empresa: [Múltipla | Enfratec | Consolidado]

(+) Receita Bruta                         R$ 343.176,98
(-) Impostos sobre receita (ISS+PIS+COF)  R$  28.400,00
(=) Receita Líquida                       R$ 314.776,98
(-) Custo dos Serviços/Produtos           R$  98.200,00
(=) Lucro Bruto                           R$ 216.576,98
(-) Despesas Operacionais
    Pessoal                    R$  80.000,00
    Administrativo             R$  12.000,00
    Tributário (DAS/IRPJ)      R$  18.000,00
    Outros                     R$   4.000,00
(=) Resultado Operacional                 R$ 102.576,98
```

---

### 8. SPED Fiscal

> Disponível para: `admin`, `contador` · **Apenas Enfratec** (para SPED Fiscal EFD ICMS/IPI)

| Rota | Nome |
|------|------|
| `/sped` | Histórico de arquivos gerados |
| `/sped/gerar` | Gerar novo arquivo SPED |
| `/sped/[id]` | Visualizar detalhes de um arquivo gerado |

#### 8.1 Tela de Geração

```
┌──────────────────────────────────────────────────────────┐
│  Gerar SPED Fiscal                                       │
├──────────────────────────────────────────────────────────┤
│  Empresa:    [Enfratec ▼] (Múltipla não gera SPED Fiscal)│
│  Período:    [Junho ▼] [2024 ▼]                         │
│  Incluir inventário (Bloco H): [✓ Sim] [○ Não]          │
│  Motivo inventário: [05 - Balanço periódico ▼]          │
├──────────────────────────────────────────────────────────┤
│  Pré-visualização                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Bloco 0: 45 registros    ✅                        │  │
│  │ Bloco A: 3 NFS-e         ✅                        │  │
│  │ Bloco C: 12 NF-e         ✅                        │  │
│  │ Bloco E: Apuração ICMS   ✅                        │  │
│  │ Bloco H: 28 produtos     ✅                        │  │
│  │ Bloco 9: Totalizadores   ✅                        │  │
│  │ Total de linhas: 547                               │  │
│  └────────────────────────────────────────────────────┘  │
│  ⚠️ Ambiente: PRODUÇÃO — validar no PVA antes de enviar  │
├──────────────────────────────────────────────────────────┤
│  [Gerar Arquivo]              [Download .txt]            │
└──────────────────────────────────────────────────────────┘
```

#### 8.2 Blocos Gerados

| Bloco | Descrição | Fonte de dados |
|-------|-----------|----------------|
| 0 | Abertura, empresa, cadastros, produtos do período | Cadastros do sistema |
| A | NFS-e emitidas | Módulo de faturamento |
| C | NF-e de entradas e saídas | Faturamento + compras |
| E | Apuração do ICMS e IPI | Calculado das notas |
| H | Inventário de estoque | Módulo de estoque |
| 9 | Totalizadores e encerramento | Gerado automaticamente |

#### 8.3 Histórico de Arquivos

| Coluna | Descrição |
|--------|-----------|
| Período | Mês/Ano de referência |
| Gerado em | Data/hora da geração |
| Gerado por | Nome do usuário |
| Total de linhas | Quantidade de registros |
| Hash MD5 | Integridade do arquivo |
| Status | Gerado / Transmitido |
| Ações | Download / Ver detalhes |

---

## Fluxos Principais

### Fluxo Completo de Venda (Enfratec)

```
[Pedido do Sicredi]
        ↓
[Cadastros/Compras]
  └── Comprar produto sob demanda
        ↓ XML do fornecedor
[Módulo Compras]
  ├── Import XML → valida na SEFAZ
  ├── Match de produtos
  ├── Confirmar → estoque atualizado (CMP recalculado)
  └── Conta a pagar criada automaticamente
        ↓
[Módulo Faturamento — NF-e]
  ├── Selecionar cliente (Sicredi)
  ├── Adicionar produto (saldo verificado)
  ├── CFOP calculado automaticamente
  ├── Emitir → Focus NFe → SEFAZ autoriza
  ├── XML + DANFE salvos
  ├── Baixa no estoque automática
  └── Conta a receber criada automaticamente
        ↓
[Módulo Financeiro]
  ├── Import extrato bancário (OFX)
  ├── Conciliação automática → conta quitada
  └── DRE atualizado em tempo real
        ↓
[Módulo SPED — fechamento mensal]
  └── SPED gerado automaticamente com todos os dados do período
```

### Fluxo de NFS-e em Lote (Múltipla para Sicredi)

```
[Início do mês — gerar notas para todas as agências]
        ↓
[Faturamento → NFS-e → Emissão em Lote]
  ├── Selecionar grupo: Sicredi SC (todos os CNPJs)
  ├── Preencher dados comuns:
  │     Serviço: Monitoramento / Locação / Manutenção
  │     Competência: mês de referência
  │     Valor: R$ 1.105,00 (ou variável por agência)
  ├── Revisar lista (71 CNPJs)
  └── [Emitir Lote]
        ↓
[Processamento sequencial]
  ├── NFS-e 1/71 → Focus NFe → prefeitura → autorizada ✅
  ├── NFS-e 2/71 → Focus NFe → ...
  ├── NFS-e com erro ❌ → marcada para reemissão manual
  └── Barra de progresso em tempo real
        ↓
[Resultado]
  ├── 71 NFS-e autorizadas
  ├── 71 Contas a receber criadas automaticamente
  └── Relatório de emissão para o e-mail da gestora
```

### Fluxo de Conciliação Bancária

```
[Exportar extrato do internet banking em formato OFX]
        ↓
[Financeiro → Conciliação → Importar extrato]
  └── Upload do arquivo OFX
        ↓
[Motor automático]
  ├── Crédito R$ 53.566,64 em 02/01/2024
  │     → Busca Conta a Receber com mesmo valor ±3 dias
  │     → Match: "MONITORAMENTO – Janeiro/24"
  │     → Marca como Quitado ✅
  ├── Crédito R$ 23.890,95 em 02/01/2024
  │     → Sem match → vai para revisão manual ❓
  └── [Outros lançamentos...]
        ↓
[Tela de revisão]
  ├── Item sem match: R$ 23.890,95
  │     → Usuário vincula manualmente: "Gerenciamento de Infraestrutura"
  │     → Marca como quitado
  └── Item desconhecido: R$ 450,00 crédito
        → Usuário cria novo lançamento: "Reembolso material de escritório"
        ↓
[Relatório de inconsistências gerado]
  └── 0 itens não resolvidos → conciliação completa ✅
```

---

## Regras de Negócio

### Globais

| # | Regra |
|---|-------|
| 1 | **Operações fiscais são irreversíveis.** NF-e autorizada só pode ser cancelada (dentro de 24h), nunca editada. |
| 2 | **Sempre filtrar por empresa_id.** Nunca fazer query sem filtro de empresa. |
| 3 | **Certificado A1 criptografado.** Armazenado no Supabase Storage com AES-256. Senha nunca em texto puro. |
| 4 | **Nota de locação é NFS-e** com código 3.01 da LC 116/2003. Confirmar CNAE com contador. |
| 5 | **Homologação sempre ativa.** `FOCUS_NFE_BASE_URL` alterna entre homologação e produção. |
| 6 | **SPED só em produção.** Em homologação o arquivo é gerado com aviso. |
| 7 | **Estoque só para Enfratec.** Verificar `empresa.hasEstoque === true` em todas as rotas de estoque. |
| 8 | **Valores em centavos.** Banco armazena sempre inteiros. Nunca float para dinheiro. |
| 9 | **Conciliação é leitura.** Nunca cria lançamentos financeiros diretamente — apenas vincula existentes ao extrato. |
| 10 | **Log imutável.** Logs de operações fiscais nunca são deletados. Cancelamentos criam novos registros. |

### Fiscais Específicas

| Empresa | Regra |
|---------|-------|
| Enfratec (Simples) | ICMS, PIS e COFINS zerados na nota (recolhidos via DAS). Base de ICMS preenchida normalmente. |
| Múltipla (LP) | PIS = 0,65% · COFINS = 3,00% calculados por nota. ISS conforme alíquota municipal. IRPJ e CSLL no fechamento. |
| Ambas | CFOP 5.xxx para operações dentro do estado · 6.xxx para fora do estado · 1.xxx/2.xxx para entradas |
| Enfratec | Bloco H gerado obrigatoriamente em dezembro ou quando solicitado pela Receita |

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js (App Router) + TypeScript | 14.x |
| UI | Tailwind CSS + shadcn/ui | latest |
| Backend | Fastify + TypeScript | 4.x |
| Arquitetura API | Hexagonal (domain / application / infrastructure / presentation) | — |
| ORM | Prisma | 5.x |
| Banco | PostgreSQL (Supabase) | 16.x |
| Auth | NextAuth.js v5 + JWT | 5.x |
| API Fiscal | Focus NFe (REST v2) | — |
| Storage | Supabase Storage | — |
| Email | Resend | — |
| Deploy frontend | Vercel | — |
| Deploy backend | Railway | — |
| Monitoramento | Sentry | — |
| Testes unitários | Vitest | — |
| Testes E2E | Playwright | — |
| Monorepo | Turborepo + pnpm workspaces | — |

### Estrutura de Pacotes

```
sigef/
├── apps/
│   ├── web/          → Next.js 14 (porta 3000)
│   └── api/          → Fastify + Arquitetura Hexagonal (porta 3001)
│       └── src/
│           ├── domain/           → Entidades e portas (interfaces)
│           ├── application/      → Casos de uso
│           ├── infrastructure/   → Repositórios, APIs externas, banco
│           └── presentation/     → Rotas HTTP, middleware, controllers
├── packages/
│   ├── db/           → Prisma schema + migrations + seed
│   ├── types/        → TypeScript types compartilhados (Result<T>, AppError...)
│   ├── validators/   → Zod schemas + validação de CNPJ/CPF
│   └── fiscal/       → Motor SPED, calculadora de tributos, parsers XML/OFX
```

---

## Banco de Dados

### Diagrama de Entidades (simplificado)

```
Empresa (empresas)
  ├── UsuarioEmpresa (usuarios_empresas) ──→ Usuario (usuarios)
  ├── ClienteFornecedor (clientes_fornecedores)
  ├── Produto (produtos)
  │     └── SaldoEstoque (saldo_estoque)
  ├── NotaFiscal (notas_fiscais)
  │     ├── ItemNota (itens_nota)
  │     ├── ContaReceber (contas_receber)
  │     └── MovimentacaoEstoque (movimentacoes_estoque)
  ├── NotaCompra (notas_compra)
  │     ├── ItemNotaCompra (itens_nota_compra)
  │     ├── ContaPagar (contas_pagar)
  │     └── MovimentacaoEstoque (movimentacoes_estoque)
  ├── ContaBancaria (contas_bancarias)
  │     └── LancamentoBancario (lancamentos_bancarios)
  │           └── Conciliacao (conciliacoes)
  └── SpedArquivo (sped_arquivos)
```

### Tabelas e Campos Principais

| Tabela | Campos principais |
|--------|-------------------|
| `empresas` | cnpj, regime_tributario, has_estoque, certificado_path, focus_nfe_token |
| `usuarios` | email, senha_hash, ativo |
| `usuarios_empresas` | usuario_id, empresa_id, role |
| `clientes_fornecedores` | empresa_id, tipo[], cnpj, razao_social, uf, codigo_municipio |
| `produtos` | empresa_id, tipo, ncm, cfop_padrao, cst_icms, unidade, preco_venda, estoque_minimo |
| `notas_fiscais` | empresa_id, tipo, status, referencia, cliente_id, valor_total, chave_acesso, xml_autorizado |
| `itens_nota` | nota_id, produto_id, quantidade, valor_unitario, cfop, base_icms, valor_icms |
| `notas_compra` | empresa_id, fornecedor_id, chave_acesso, valor_total, status |
| `saldo_estoque` | produto_id, quantidade, custo_medio |
| `movimentacoes_estoque` | empresa_id, produto_id, tipo, quantidade, saldo_anterior, saldo_posterior, custo_medio_apos |
| `contas_receber` | empresa_id, cliente_id, nota_fiscal_id, valor, status, data_vencimento, categoria |
| `contas_pagar` | empresa_id, fornecedor_id, nota_compra_id, valor, status, aprovacao_necessaria |
| `lancamentos_bancarios` | empresa_id, conta_bancaria_id, valor, tipo, fit_id, conciliado |
| `conciliacoes` | lancamento_bancario_id, conta_receber_id, conta_pagar_id, tipo |
| `sped_arquivos` | empresa_id, mes_referencia, ano_referencia, total_linhas, hash_md5 |

> Todos os valores monetários são armazenados em **centavos (inteiros)**. Nunca usar float.

---

## Backlog e Sprints

### Resumo por Épico

| Épico | Itens críticos | Horas estimadas |
|-------|---------------|-----------------|
| INF — Infraestrutura | 8 itens | 44h |
| CAD — Cadastros | 6 itens | 40h |
| FAT — Faturamento | 11 itens | 74h |
| EST — Compras e Estoque | 13 itens | 62h |
| FIN — Financeiro | 12 itens | 76h |
| SPD — SPED Fiscal | 9 itens | 62h |
| **Total MVP** | **59 itens** | **358h** |

### Sprint 1 — Fundação (Semana 1)

**Meta:** Sistema rodando com login, multi-empresa e todos os cadastros funcionando.

| ID | Tarefa |
|----|--------|
| INF-01 | Setup do monorepo (Next.js + Fastify + Prisma) |
| INF-02 | PostgreSQL + schema inicial + migrations |
| INF-03 | Autenticação NextAuth + JWT + roles |
| INF-04 | Middleware multi-tenant (empresa_id) |
| INF-05 | Layout base (sidebar, header, seletor de empresa) |
| INF-06 | CI/CD GitHub Actions → Vercel + Railway |
| INF-07 | Integração Focus NFe em homologação |
| CAD-01 | CRUD de Empresas + upload de Certificado A1 |
| CAD-02 | CRUD de Clientes/Fornecedores + validação CNPJ |
| CAD-03 | CRUD de Produtos/Serviços (campos fiscais completos) |

**Critério de aceite:** Login funciona com duas empresas, seletor alterna o contexto, CRUD de cadastros salva e lista corretamente, Focus NFe responde em homologação.

### Sprint 2 — Faturamento (Semana 2)

**Meta:** Emissão de NF-e, NFS-e e Nota de Locação funcionando em homologação.

| ID | Tarefa |
|----|--------|
| FAT-01 | Formulário NF-e com cálculo automático de tributos |
| FAT-02 | Integração Focus NFe: transmissão NF-e → XML + DANFE |
| FAT-03 | Formulário NFS-e (Múltipla e Enfratec) |
| FAT-04 | Integração Focus NFe: transmissão NFS-e municipal |
| FAT-05 | Nota de Locação (Múltipla) com campos de contrato |
| FAT-06 | Listagem de notas com filtros |
| FAT-07 | Cancelamento de NF-e e NFS-e |
| FAT-08 | Emissão em lote de NFS-e |
| FAT-09 | Download de XML e DANFE |
| FAT-10 | Envio de NF por e-mail (Resend) |

### Sprint 3 — Compras e Estoque (Semana 3)

**Meta:** Ciclo completo de compra da Enfratec + Bloco H + início do motor SPED.

| ID | Tarefa |
|----|--------|
| EST-01 | Upload e leitura de XML de fornecedor |
| EST-02 | Parser XML: extração completa de dados |
| EST-03 | Entrada automática no estoque (CMP) |
| EST-04 | Conta a pagar criada automaticamente |
| EST-05 | Tela de saldo de estoque |
| EST-06 | Baixa automática ao emitir NF-e |
| EST-07 | Ajuste manual com aprovação |
| EST-08 | Histórico de movimentações |
| EST-09 | Geração do Bloco H |
| SPD-01 | Motor SPED: Bloco 0 |

### Sprint 4 — Financeiro e SPED (Semana 4)

**Meta:** Financeiro completo, conciliação bancária operacional, SPED gerado e validado, sistema em produção.

| ID | Tarefa |
|----|--------|
| FIN-01 | Contas a receber |
| FIN-02 | Contas a pagar + aprovação por limite |
| FIN-03 | Dashboard de fluxo de caixa |
| FIN-04 | Importação de extrato OFX |
| FIN-05 | Motor de conciliação automática |
| FIN-06 | Tela de revisão de conciliação |
| FIN-07 | Relatório de inconsistências |
| FIN-08 | Resumo anual XLSX |
| SPD-02 | Motor SPED: Bloco C (NF-e) |
| SPD-03 | Motor SPED: Blocos A + E |
| SPD-04 | Motor SPED: Bloco 9 + tela de geração |
| SPD-05 | Deploy em produção + testes finais |

---

## Como Rodar o Projeto

### Pré-requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+

### Setup inicial

```bash
# Clonar o repositório
git clone https://github.com/orionlab/sigef.git
cd sigef

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves

# Gerar client do Prisma
pnpm db:generate

# Rodar migrations
pnpm db:migrate

# Popular banco com dados iniciais
pnpm db:seed
```

### Iniciar em desenvolvimento

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Prisma Studio: `pnpm db:studio`

### Login de desenvolvimento

| Campo | Valor |
|-------|-------|
| E-mail | admin@orionlab.com.br |
| Senha | admin123 |
| Empresas | Múltipla Gestão + Enfratec (acesso total) |

### Variáveis de Ambiente

```env
# Banco
DATABASE_URL="postgresql://sigef_dev:sigef_dev_pass@localhost:5433/sigef_dev"
DIRECT_URL="postgresql://sigef_dev:sigef_dev_pass@localhost:5433/sigef_dev"

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
API_URL="http://localhost:3001"

# Focus NFe (substituir pelos tokens reais)
FOCUS_NFE_TOKEN="..."
FOCUS_NFE_BASE_URL="https://homologacao.focusnfe.com.br"

# Supabase
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."

# Email
RESEND_API_KEY="..."

# Criptografia (certificado A1)
ENCRYPTION_KEY="..."  # 64 hex chars (openssl rand -hex 32)
```

### Testes

```bash
pnpm test          # Testes unitários (Vitest)
pnpm test:watch    # Modo watch
pnpm test:e2e      # Testes E2E (Playwright) — requer o app rodando
```

---

## Roadmap Pós-MVP

| Funcionalidade | Prioridade |
|----------------|-----------|
| Integração Open Finance (Sicoob, Inter, Bradesco) — extrato automático sem upload OFX | 🔴 Alta |
| SPED Contribuições para Múltipla (PIS/COFINS) | 🔴 Alta |
| DRE completo com centros de custo | 🟡 Média |
| App mobile para equipe de campo da Enfratec | 🟡 Média |
| Relatórios de BI avançados com gráficos interativos | 🟡 Média |
| Suporte a Certificado Digital A3 (token físico) | 🟡 Média |
| Controle de múltiplos depósitos/localidades | 🟢 Baixa |
| Integração com ERP do Sicredi (se disponível via API) | 🟢 Baixa |
| Portal do cliente para o Sicredi consultar suas notas | 🟢 Baixa |

---

## Contato

**Orion Lab**
Desenvolvido e mantido pela equipe Orion Lab.
Para suporte técnico ou dúvidas sobre o sistema, entre em contato diretamente com a equipe.

---

*Documento vivo — atualizado a cada sprint*
