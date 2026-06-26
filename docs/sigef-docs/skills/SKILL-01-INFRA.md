# SKILL-01 · Infraestrutura & Setup (Épico INF)
> Pré-requisito: leia `SKILL-00-CONTEXT.md` antes deste arquivo.

---

## Backlog INF

| ID | Prioridade | Tarefa | Estimativa |
|----|-----------|--------|-----------|
| INF-01 | 🔴 | Setup do monorepo (Next.js + Fastify + Prisma) | 8h |
| INF-02 | 🔴 | Schema Prisma completo + migrations | 4h |
| INF-03 | 🔴 | Autenticação NextAuth v5 + JWT + roles | 8h |
| INF-04 | 🔴 | Middleware multi-tenant (empresa_id injetado) | 6h |
| INF-05 | 🔴 | Layout base: Sidebar, Header, EmpresaSelector | 8h |
| INF-06 | 🔴 | CI/CD GitHub Actions → Vercel + Railway | 6h |
| INF-07 | 🔴 | Client Focus NFe configurado em homologação | 4h |
| INF-08 | 🟡 | Sentry para monitoramento de erros | 2h |

---

## INF-01: Monorepo

O monorepo já foi criado pelo script `setup-sigef.sh`. A estrutura existe em `~/projects/sigef`.

**Verificar se está ok:**
```bash
cd ~/projects/sigef
pnpm dev   # deve subir web:3000 e api:3001
```

**Se precisar recriar algum package:**
```bash
pnpm install                # reinstalar deps
pnpm db:generate            # regenerar client prisma
```

---

## INF-02: Schema Prisma

Localização: `packages/db/prisma/schema.prisma`

O schema completo já existe com todas as tabelas. Para adicionar campos ou tabelas novas:

```bash
cd packages/db
# Editar schema.prisma
npx prisma migrate dev --name nome-da-alteracao
npx prisma generate
```

**Tabelas existentes:**
`empresas`, `usuarios`, `usuarios_empresas`, `clientes_fornecedores`, `produtos`, `saldo_estoque`, `notas_fiscais`, `itens_nota`, `notas_compra`, `itens_nota_compra`, `movimentacoes_estoque`, `contas_receber`, `contas_pagar`, `contas_bancarias`, `lancamentos_bancarios`, `conciliacoes`, `sped_arquivos`

**Regra:** Toda nova tabela deve ter `empresa_id String` como campo obrigatório e `@@index([empresaId])`.

---

## INF-03: Autenticação

### Fluxo
```
POST /api/auth/login
  → valida email + senha + empresaId
  → retorna { id, nome, email, role, empresaId, empresaNome }
  → NextAuth armazena no JWT
  → JWT enviado em cookie httpOnly em todo request
```

### Configuração NextAuth (`apps/web/lib/auth.ts`)

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
        empresaId: { label: 'Empresa', type: 'text' },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        });
        if (!res.ok) return null;
        return res.json();
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) Object.assign(token, user);
      return token;
    },
    session({ session, token }) {
      Object.assign(session.user, {
        userId: token.userId,
        role: token.role,
        empresaId: token.empresaId,
        empresaNome: token.empresaNome,
      });
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
```

### Endpoint de login (`apps/api/src/presentation/routes/auth/login.ts`)

```typescript
// POST /api/auth/login
// Body: { email, senha, empresaId }
// Valida senha com bcrypt
// Verifica se usuário tem acesso à empresaId
// Retorna dados do usuário ou 401
```

### Plugin JWT no Fastify (`apps/api/src/presentation/plugins/jwt.plugin.ts`)

```typescript
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

export default fp(async (fastify) => {
  fastify.register(jwt, { secret: process.env.NEXTAUTH_SECRET! });

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
      request.empresaId = request.user.empresaId;
      request.userId = request.user.userId;
      request.role = request.user.role;
    } catch {
      reply.code(401).send({ error: 'Não autorizado' });
    }
  });
});
```

---

## INF-04: Middleware Multi-Tenant

### Factory de Repositório

```typescript
// packages/db/src/repository-factory.ts
export function createRepo(prisma: PrismaClient, empresaId: string) {
  return {
    produto: {
      findMany: (args = {}) =>
        prisma.produto.findMany({ ...args, where: { ...args.where, empresaId } }),
      findById: (id: string) =>
        prisma.produto.findFirst({ where: { id, empresaId } }),
      create: (data: object) =>
        prisma.produto.create({ data: { ...data, empresaId } }),
    },
    // ... repetir para cada model
  };
}
```

### Uso em handlers

```typescript
fastify.get('/produtos', { preHandler: [fastify.authenticate] }, async (req) => {
  const repo = createRepo(prisma, req.empresaId); // empresaId do JWT
  return repo.produto.findMany();
});
```

---

## INF-05: Layout Base

### Componentes obrigatórios

**EmpresaSelector** (`apps/web/components/layout/EmpresaSelector.tsx`)
- Dropdown no header com as empresas que o usuário tem acesso
- Ao selecionar: chama `POST /api/auth/trocar-empresa` → novo JWT → reload da página
- Exibe badge com o nome da empresa ativa

**Sidebar** (`apps/web/components/layout/Sidebar.tsx`)
- Navegação lateral com itens condicionais por role:

```typescript
const menuItems = [
  { label: 'Dashboard', href: '/', roles: ALL },
  { label: 'Cadastros', href: '/cadastros', roles: ['admin', 'faturamento', 'financeiro'] },
  { label: 'Faturamento', href: '/faturamento', roles: ['admin', 'financeiro', 'faturamento'] },
  { label: 'Compras', href: '/compras', roles: ['admin', 'financeiro', 'almoxarife'], requireEstoque: true },
  { label: 'Estoque', href: '/estoque', roles: ['admin', 'financeiro', 'almoxarife'], requireEstoque: true },
  { label: 'Financeiro', href: '/financeiro', roles: ['admin', 'financeiro'] },
  { label: 'SPED Fiscal', href: '/sped', roles: ['admin', 'contador'] },
];
```

**PageHeader** (`apps/web/components/layout/PageHeader.tsx`)
- Título da página + breadcrumb + botão de ação primária (slot)

---

## INF-07: Client Focus NFe

```typescript
// packages/fiscal/src/focus-nfe/client.ts

export class FocusNfeClient {
  private baseUrl = process.env.FOCUS_NFE_BASE_URL!;
  private token = process.env.FOCUS_NFE_TOKEN!;

  private get authHeader() {
    return `Basic ${Buffer.from(`${this.token}:`).toString('base64')}`;
  }

  private async req<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`FocusNFe ${res.status}: ${await res.text()}`);
    return res.json();
  }

  emitirNFe(ref: string, payload: object) { return this.req('POST', `/v2/nfe?ref=${ref}`, payload); }
  consultarNFe(ref: string) { return this.req('GET', `/v2/nfe/${ref}`); }
  cancelarNFe(ref: string, justificativa: string) { return this.req('DELETE', `/v2/nfe/${ref}`, { justificativa }); }
  emitirNFSe(ref: string, payload: object) { return this.req('POST', `/v2/nfse?ref=${ref}`, payload); }
  consultarNFSe(ref: string) { return this.req('GET', `/v2/nfse/${ref}`); }
  cancelarNFSe(ref: string) { return this.req('DELETE', `/v2/nfse/${ref}`); }
}
```

**Regras de uso:**
1. `ref` deve ser única por empresa: usar `${empresaId}-${nanoid()}`
2. Sempre salvar a `ref` no banco **antes** de chamar a API
3. Fazer polling a cada 3s por até 30s após emissão para obter o status
4. Nunca expor token no frontend — todas as chamadas passam pelo backend

---

## INF-05: Tela de Login

```
Rota: /login
Arquivo: apps/web/app/(auth)/login/page.tsx
```

**Campos:**
- E-mail
- Senha
- Empresa ativa (dropdown com as empresas do usuário — carregado após validar e-mail)

**Fluxo UX:**
1. Usuário digita e-mail → sistema busca quais empresas esse e-mail tem acesso (sem revelar a senha ainda)
2. Mostra dropdown de empresa
3. Usuário digita senha e clica em Entrar
4. Redireciona para `/dashboard`

---

## Checklist INF

- [ ] `pnpm dev` sobe web:3000 e api:3001 sem erros
- [ ] Login funciona com `admin@orionlab.com.br / admin123`
- [ ] Seletor de empresa aparece no header e troca o contexto
- [ ] Rota `/estoque` é bloqueada para Múltipla (hasEstoque=false)
- [ ] Rota sem JWT retorna 401
- [ ] Focus NFe em homologação responde sem erro de autenticação
