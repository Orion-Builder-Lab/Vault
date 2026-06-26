# SKILL-00 · Contexto Geral do Projeto SIGEF
> **Leia este arquivo PRIMEIRO antes de qualquer outro.**
> Ele define o sistema completo, as empresas, a stack e as convenções globais.

---

## 1. O Que É o SIGEF

Sistema web **multi-empresa** de gestão fiscal, financeira e de estoque desenvolvido pela **Orion Lab**, substituindo:
- **Conta Azul Pro** → usado pela Múltipla Gestão (financeiro básico, sem SPED, sem NFS-e nativa)
- **Everflow** → usado pela Enfratec (gestão de campo, SPED manual, 3.716 contas a pagar, sem integração com NF-e)

**Nome do projeto:** `sigef`
**Repositório:** `~/projects/sigef`
**Time:** Orion Lab (2 devs — Tech Lead + Dev Pleno)

---

## 2. Empresas Clientes

### Múltipla Gestão
| Atributo | Valor |
|----------|-------|
| Regime tributário | **Lucro Presumido** |
| Atividade | Prestação de serviços de gerenciamento, locação de equipamentos |
| Notas emitidas | NFS-e + **Nota de Locação** (NFS-e com código LC 116 item 3.01) |
| Tributos na nota | ISS (alíquota municipal), PIS 0,65%, COFINS 3,00% |
| Estoque | ❌ Não possui |
| SPED | SPED Contribuições (PIS/COFINS) — pós-MVP |
| Sistema atual | Conta Azul Pro |

### Enfratec
| Atributo | Valor |
|----------|-------|
| Regime tributário | **Simples Nacional** |
| Atividade | Compra e revenda de produtos + prestação de serviços sob demanda |
| Notas emitidas | NF-e (produtos físicos) + NFS-e (serviços) |
| Tributos na nota | DAS unificado — ICMS, PIS, COFINS zerados na nota |
| Estoque | ✅ Obrigatório — Bloco H do SPED |
| SPED | SPED Fiscal (EFD ICMS/IPI) — Blocos 0, A, C, E, H, 9 |
| Sistema atual | Everflow |

### Cliente Final (de ambas)
- **Sicredi — Região de Santa Catarina**
- Possui múltiplas agências com CNPJs distintos
- Enfratec emite ~71 NFS-e mensais de R$ 1.105,00 por CNPJ (Sicredi Vale Litoral SC)
- Operação **nacional**

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Next.js App Router + TypeScript | 14.x |
| UI | Tailwind CSS + shadcn/ui | latest |
| Backend | Fastify + TypeScript | 4.x |
| Arquitetura | Hexagonal (domain / application / infrastructure / presentation) | — |
| ORM | Prisma | 5.x |
| Banco | PostgreSQL 16 (Supabase) | 16.x |
| Auth | NextAuth.js v5 + JWT | 5.x beta |
| API Fiscal | Focus NFe REST v2 | — |
| Storage | Supabase Storage | — |
| Email | Resend | — |
| Deploy FE | Vercel | — |
| Deploy API | Railway | — |
| Testes | Vitest (unit) + Playwright (e2e) | — |
| Monorepo | Turborepo + pnpm workspaces | — |

---

## 4. Estrutura de Pastas

```
sigef/
├── apps/
│   ├── web/                          # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (auth)/login/         # Tela de login
│   │   │   └── (dashboard)/          # Rotas protegidas
│   │   │       ├── page.tsx          # Dashboard principal
│   │   │       ├── cadastros/
│   │   │       ├── faturamento/
│   │   │       ├── compras/
│   │   │       ├── estoque/
│   │   │       ├── financeiro/
│   │   │       └── sped/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   └── layout/               # Sidebar, Header, EmpresaSelector
│   │   └── lib/
│   │       ├── auth.ts               # NextAuth config
│   │       └── api-client.ts         # Cliente HTTP para o Fastify
│   └── api/                          # Fastify backend (Arquitetura Hexagonal)
│       └── src/
│           ├── domain/               # Entidades e interfaces (portas)
│           ├── application/          # Casos de uso
│           ├── infrastructure/       # Repositórios, APIs externas
│           └── presentation/         # Rotas HTTP, middleware
├── packages/
│   ├── db/                           # Prisma schema + migrations + seed
│   ├── types/                        # Result<T>, AppError, AuthContext
│   ├── validators/                   # Zod schemas + validação CNPJ/CPF
│   └── fiscal/                       # Motor SPED, calculadora tributos, parsers
├── turbo.json
├── pnpm-workspace.yaml
└── .env
```

---

## 5. Arquitetura Multi-Tenant

**Estratégia:** Schema compartilhado com coluna `empresa_id` em TODAS as tabelas de dados.

```
Usuário faz login
      ↓
JWT gerado: { userId, empresaId, role }
      ↓
Cada request ao Fastify verifica JWT
      ↓
request.empresaId injetado em TODAS as queries
      ↓
RLS (Row Level Security) no PostgreSQL como segunda camada
```

**Regra crítica:** NUNCA fazer query sem `where: { empresaId }`. O factory de repositório encapsula isso.

**Troca de empresa:** Usuário com acesso a ambas as empresas troca pelo seletor no header → novo JWT emitido.

---

## 6. Perfis de Acesso

| Role | Múltipla | Enfratec | Acesso |
|------|----------|----------|--------|
| `admin` | ✅ Total | ✅ Total | Tudo + configurações + relatórios consolidados |
| `financeiro` | ✅ Total | ✅ Total | Contas, conciliação, fluxo de caixa |
| `faturamento` | ✅ | ✅ | Emitir/consultar notas. Sem acesso financeiro |
| `almoxarife` | ❌ | ✅ | Só Enfratec: estoque, compras, inventário |
| `contador` | 📥 Leitura | 📥 Leitura | Download XMLs + exportar SPED. Sem edição |

---

## 7. Módulos do Sistema

| # | Módulo | Rota base | Épico |
|---|--------|-----------|-------|
| 1 | Autenticação | `/login` | INF |
| 2 | Dashboard | `/` | INF |
| 3 | Cadastros | `/cadastros` | CAD |
| 4 | Faturamento | `/faturamento` | FAT |
| 5 | Compras | `/compras` | EST |
| 6 | Estoque | `/estoque` | EST |
| 7 | Financeiro | `/financeiro` | FIN |
| 8 | SPED Fiscal | `/sped` | SPD |

---

## 8. Convenções de Código

| Contexto | Padrão |
|----------|--------|
| Arquivos | `kebab-case` (ex: `nota-fiscal.service.ts`) |
| Classes/Types | `PascalCase` |
| Funções/variáveis | `camelCase` |
| Tabelas do banco | `snake_case` plural (ex: `notas_fiscais`) |
| Colunas | `snake_case` (ex: `empresa_id`, `created_at`) |
| Valores monetários | **Sempre em centavos (inteiros)**. Nunca float. |
| Datas | UTC no banco. Exibição converte para `America/Sao_Paulo` |

---

## 9. Regras de Negócio Globais

1. **NF-e autorizada é imutável** — só cancela (dentro de 24h), nunca edita
2. **empresa_id em toda query** — sem exceção
3. **Certificado A1 criptografado** — AES-256-GCM, senha nunca em plain text
4. **Nota de locação = NFS-e** com código 3.01 da LC 116/2003
5. **SPED só para Enfratec** neste MVP (Múltipla: apenas SPED Contribuições, pós-MVP)
6. **Estoque só para Enfratec** — verificar `empresa.hasEstoque === true`
7. **Conciliação bancária é leitura** — nunca cria lançamentos, apenas vincula existentes
8. **Parcelamento na Enfratec** — compras parceladas (ex: 12x) geram 12 parcelas automáticas
9. **Emissão em lote** — Múltipla emite ~71 NFS-e para agências Sicredi no início de cada mês
10. **Logs fiscais imutáveis** — cancelamentos criam novos registros, nunca deletam

---

## 10. Variáveis de Ambiente

```env
DATABASE_URL="postgresql://sigef_dev:sigef_dev_pass@localhost:5433/sigef_dev"
DIRECT_URL="postgresql://sigef_dev:sigef_dev_pass@localhost:5433/sigef_dev"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"
FOCUS_NFE_TOKEN="..."
FOCUS_NFE_BASE_URL="https://homologacao.focusnfe.com.br"
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."
RESEND_API_KEY="..."
ENCRYPTION_KEY="..."   # 64 hex chars: openssl rand -hex 32
NODE_ENV="development"
PORT="3001"
```

---

## 11. Porta do PostgreSQL

> ⚠️ **Atenção:** O PostgreSQL desta instalação roda na porta **5433** (não 5432 padrão).
> Todos os arquivos `.env` já devem ter `:5433` na connection string.
