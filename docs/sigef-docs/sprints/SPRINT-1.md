# Sprint 1 — Fundação, Cadastros e Faturamento
**Duração:** Semanas 1 e 2 · ~180h · 2 devs

---

## Objetivo da Sprint

Ao final desta sprint o sistema deve estar **funcionando em ambiente de produção** com:
- Login com seleção de empresa (Múltipla ou Enfratec)
- Todos os cadastros (empresas, clientes, produtos, contas bancárias)
- Emissão de NF-e, NFS-e e Nota de Locação em **homologação**
- Listagem, cancelamento e download de notas

**A Múltipla consegue emitir NFS-e e Notas de Locação.**
**A Enfratec consegue emitir NF-e de produtos.**

---

## Meta de Aceite da Sprint

✅ Login funciona com seleção de empresa  
✅ Sidebar mostra apenas menus do perfil e da empresa  
✅ CRUD de Empresas salva com validação de CNPJ  
✅ CRUD de Clientes com auto-preenchimento via Receita Federal  
✅ CRUD de Produtos com campos fiscais (NCM, CFOP, CSOSN, ISS)  
✅ Emitir uma NF-e em homologação → retorna XML + DANFE  
✅ Emitir uma NFS-e em homologação → retorna código da prefeitura  
✅ Emitir Nota de Locação com campos de contrato  
✅ Cancelar nota dentro de 24h  
✅ Conta a Receber criada automaticamente ao autorizar nota  
✅ Sistema deployado em Vercel + Railway  

---

## Tarefas Detalhadas

### INF-01 · Setup do Monorepo
**Dev:** Tech Lead · **Estimativa:** 8h

**Descrição:**
O projeto já foi inicializado pelo script `setup-sigef.sh`. Esta tarefa é verificar que tudo está ok e configurar o ambiente de desenvolvimento corretamente.

**O que fazer:**
1. Verificar que `pnpm dev` sobe web (3000) e api (3001) sem erros
2. Confirmar que `packages/db`, `packages/types`, `packages/validators`, `packages/fiscal` estão corretos
3. Verificar `turbo.json` com tasks de `dev`, `build`, `test`
4. Confirmar `pnpm-workspace.yaml` referenciando `apps/*` e `packages/*`

**Arquivos chave:**
- `~/projects/sigef/package.json` (root)
- `~/projects/sigef/turbo.json`
- `~/projects/sigef/pnpm-workspace.yaml`

**Critério de aceite:**
- `pnpm dev` funciona sem erros
- `pnpm build` funciona
- `pnpm test` roda os testes unitários existentes

---

### INF-02 · Schema Prisma Completo
**Dev:** Tech Lead · **Estimativa:** 4h

**Descrição:**
O schema já existe em `packages/db/prisma/schema.prisma`. Verificar e garantir que todas as tabelas estão corretas conforme a SKILL-00.

**O que fazer:**
1. Verificar que todas as tabelas necessárias existem no schema
2. Verificar que toda tabela tem `empresa_id` e `@@index([empresaId])`
3. Rodar `npx prisma migrate dev --name verificacao` para confirmar que está em sync
4. Confirmar seed inicial: Múltipla, Enfratec, admin, Sicredi como cliente

**Arquivos chave:**
- `packages/db/prisma/schema.prisma`
- `packages/db/src/seed.ts`

**Critério de aceite:**
- `npx prisma migrate status` mostra "Database schema is up to date"
- `npx tsx src/seed.ts` roda sem erros
- Admin consegue logar com `admin@orionlab.com.br / admin123`

---

### INF-03 · Autenticação NextAuth + JWT
**Dev:** Tech Lead · **Estimativa:** 8h

**Descrição:**
Implementar o sistema de autenticação completo com NextAuth v5, JWT e roles.

**O que implementar:**

**Backend** (`apps/api/src/presentation/routes/auth/`):
```
POST /api/auth/login
  Body: { email, senha, empresaId }
  Valida: email existe, senha bcrypt, usuário tem acesso à empresa
  Retorna: { id, nome, email, role, empresaId, empresaNome }

POST /api/auth/trocar-empresa
  Body: { empresaId }
  Valida: usuário tem acesso à nova empresa
  Retorna: novo token JWT
```

**Plugin JWT** (`apps/api/src/presentation/plugins/jwt.plugin.ts`):
- Registrar `@fastify/jwt` com `process.env.NEXTAUTH_SECRET`
- Decorator `fastify.authenticate` que injeta `request.empresaId`, `request.userId`, `request.role`

**Frontend** (`apps/web/lib/auth.ts`):
- NextAuth com Credentials provider
- Callbacks de `jwt` e `session` para persistir role, empresaId, empresaNome

**Middleware** (`apps/web/middleware.ts`):
- Proteger todas as rotas exceto `/login`
- Redirecionar `/` para `/login` se não autenticado

**Arquivos a criar/editar:**
- `apps/api/src/presentation/routes/auth/login.route.ts`
- `apps/api/src/presentation/plugins/jwt.plugin.ts`
- `apps/web/lib/auth.ts`
- `apps/web/middleware.ts`
- `apps/web/app/(auth)/login/page.tsx` (formulário de login real)

**Critério de aceite:**
- Login com email/senha corretos redireciona para dashboard
- Login com senha errada mostra mensagem de erro
- Rota `/financeiro` sem JWT retorna 401
- JWT contém { userId, empresaId, role }

---

### INF-04 · Middleware Multi-Tenant
**Dev:** Tech Lead · **Estimativa:** 6h

**Descrição:**
Garantir que toda query ao banco é automaticamente filtrada por `empresaId`.

**O que implementar:**

**Factory de Repositório** (`packages/db/src/repository-factory.ts`):
```typescript
export function createRepo(prisma: PrismaClient, empresaId: string) {
  // Encapsular todas as queries com where: { empresaId }
  // Cada model tem: findMany, findById, create, update, delete
}
```

**Uso nos handlers:**
```typescript
const repo = createRepo(prisma, request.empresaId);
const produtos = await repo.produto.findMany();
```

**Critério de aceite:**
- Um usuário da Múltipla não vê dados da Enfratec
- Factory lança erro se `empresaId` for undefined

---

### INF-05 · Layout Base
**Dev:** Dev Pleno · **Estimativa:** 8h

**Descrição:**
Implementar o layout principal da aplicação.

**Componentes a criar:**

`apps/web/components/layout/Sidebar.tsx`:
- Menu lateral com ícones
- Itens condicionais por role e hasEstoque
- Item ativo destacado

`apps/web/components/layout/Header.tsx`:
- Nome da empresa ativa
- EmpresaSelector (dropdown para trocar empresa)
- Nome do usuário + logout

`apps/web/components/layout/EmpresaSelector.tsx`:
- Dropdown com as empresas do usuário
- Ao selecionar: chama `POST /api/auth/trocar-empresa` e recarrega

`apps/web/app/(dashboard)/layout.tsx`:
- Envolver todas as rotas do dashboard com Sidebar + Header

**Critério de aceite:**
- Sidebar mostra apenas os menus corretos por role
- Estoque/Compras não aparecem para usuário da Múltipla
- Trocar empresa atualiza o contexto visual

---

### INF-06 · CI/CD
**Dev:** Tech Lead · **Estimativa:** 6h

**Descrição:**
Configurar deploy automático.

**O que configurar:**
1. **Vercel**: conectar repositório, configurar variáveis de ambiente, rootDir=apps/web
2. **Railway**: criar serviço da API, configurar variáveis de ambiente, rootDir=apps/api
3. **GitHub Actions** (`.github/workflows/ci.yml`): rodar `pnpm install`, `pnpm build`, `pnpm test` em todo PR

**Critério de aceite:**
- Push na main faz deploy automático
- PR abre verificação de CI (build + testes)

---

### INF-07 · Focus NFe em Homologação
**Dev:** Dev Pleno · **Estimativa:** 4h

**Descrição:**
Configurar e testar a integração com a API Focus NFe em ambiente de homologação.

**O que fazer:**
1. Adicionar token de homologação no `.env`
2. Instanciar `FocusNfeClient` em `apps/api/src/infrastructure/external/focus-nfe/`
3. Testar uma NF-e de homologação (CNPJ fictício da documentação da Focus NFe)
4. Verificar que o retorno traz XML e DANFE

**Critério de aceite:**
- `GET /api/health/focus-nfe` retorna status "ok" com conexão confirmada

---

### CAD-01 · CRUD de Empresas
**Dev:** Dev Pleno · **Estimativa:** 12h

**Descrição:**
Tela de edição de dados das empresas (Múltipla e Enfratec). Não cria novas empresas — elas já existem no seed.

**Telas:**
- `/cadastros/empresas` — Lista (card por empresa com dados principais)
- `/cadastros/empresas/[id]` — Formulário de edição com todas as abas:
  - Aba "Dados Fiscais": CNPJ, IE, IM, regime, CNAE
  - Aba "Endereço": CEP (auto-preenche via ViaCEP), logradouro, cidade, IBGE
  - Aba "Configurações": limite de aprovação, dias de vencimento
  - Aba "Certificado Digital": upload do .pfx + campo de senha

**API:**
```
GET    /api/empresas           → Lista empresas do usuário
GET    /api/empresas/:id       → Dados da empresa
PATCH  /api/empresas/:id       → Atualizar dados
POST   /api/empresas/:id/certificado   → Upload .pfx (multipart)
DELETE /api/empresas/:id/certificado   → Remover certificado
```

**Validações:**
- CNPJ: validar dígito verificador
- codigoMunicipio: deve ter 7 dígitos
- Upload: aceitar apenas .pfx e .p12

**Critério de aceite:**
- Salvar dados fiscais da empresa sem perder campos existentes
- Upload de .pfx criptografa a senha e salva no Supabase Storage
- CEP auto-preenche endereço e código IBGE

---

### CAD-02 · CRUD de Clientes e Fornecedores
**Dev:** Dev Pleno · **Estimativa:** 10h

**Descrição:**
Cadastro completo de clientes (Sicredi e suas agências) e fornecedores (S1 Comércio, Segurança 1, FSEG, etc.).

**Telas:**
- `/cadastros/clientes-fornecedores` — Lista com tabs: Clientes / Fornecedores / Todos
- `/cadastros/clientes-fornecedores/novo` — Formulário
- `/cadastros/clientes-fornecedores/[id]` — Edição

**Comportamento ao digitar CNPJ:**
1. Validar dígito verificador em tempo real
2. Se válido → buscar na Receita Federal
3. Auto-preencher: razão social, endereço, código IBGE

**API:**
```
GET    /api/clientes-fornecedores?tipo=CLIENTE|FORNECEDOR|all&q=
POST   /api/clientes-fornecedores
GET    /api/clientes-fornecedores/:id
PATCH  /api/clientes-fornecedores/:id
DELETE /api/clientes-fornecedores/:id   (soft delete: ativo=false)
GET    /api/clientes-fornecedores/cnpj/:cnpj  → Consulta Receita Federal
```

**Critério de aceite:**
- Cadastrar Sicredi Vale Litoral SC com CNPJ real e código IBGE correto
- Filtro por tipo (CLIENTE/FORNECEDOR) funciona
- Soft delete não remove do banco

---

### CAD-03 · CRUD de Produtos e Serviços
**Dev:** Dev Pleno · **Estimativa:** 14h

**Descrição:**
O cadastro mais crítico do sistema. Campos fiscais errados causam rejeição na SEFAZ.

**Telas:**
- `/cadastros/produtos` — Lista com filtro PRODUTO/SERVIÇO, busca por código/descrição
- `/cadastros/produtos/novo` — Formulário com campos condicionais por tipo
- `/cadastros/produtos/[id]` — Edição

**Campos por tipo:**

Para PRODUTO: código, descrição, NCM (8 dígitos), CEST (se tem ST), CFOP padrão, CSOSN, EAN, unidade, peso, preço custo, preço venda, estoque mínimo

Para SERVIÇO: código, descrição, código LC 116, item da lista, alíquota ISS, unidade (SRV/HR), preço venda

**Ao salvar produto tipo PRODUTO para a Enfratec:**
→ Criar registro em `saldo_estoque` com quantidade=0 e custoMedio=0

**API:**
```
GET    /api/produtos?tipo=PRODUTO|SERVICO&q=&ativo=
POST   /api/produtos
GET    /api/produtos/:id
PATCH  /api/produtos/:id
DELETE /api/produtos/:id   (soft delete)
```

**Critério de aceite:**
- NCM com menos de 8 dígitos bloqueia o salvamento
- Serviço sem alíquota ISS bloqueia o salvamento
- Produto criado na Enfratec cria SaldoEstoque=0 automaticamente

---

### CAD-04 · Cadastro de Contas Bancárias
**Dev:** Dev Pleno · **Estimativa:** 4h

**Descrição:**
Tela simples para registrar as contas bancárias de cada empresa.

**Tela:** `/cadastros/contas-bancarias`

**API:**
```
GET    /api/contas-bancarias
POST   /api/contas-bancarias
PATCH  /api/contas-bancarias/:id
```

**Critério de aceite:**
- Cadastrar conta corrente e conta poupança separadas
- Conta inativada não aparece no seletor de conciliação

---

### FAT-01 · Formulário NF-e (Enfratec)
**Dev:** Tech Lead · **Estimativa:** 20h

**Descrição:**
Tela de emissão de NF-e para a Enfratec. O fluxo mais complexo do módulo de faturamento.

**Tela:** `/faturamento/nfe/novo`

**Seções do formulário:**
1. **Cliente**: busca por nome/CNPJ, seleciona da lista
2. **Dados da nota**: natureza da operação, data emissão, data saída, modalidade frete
3. **Itens**: busca produto por código/descrição, informa quantidade e valor unitário
   - CFOP calculado automaticamente (estadual vs interestadual baseado no UF do cliente)
   - Tributos calculados: ICMS=0, IPI=0, PIS=0, COFINS=0 (Simples)
4. **Totais**: sub-total, frete, seguro, outras despesas, total
5. **Pagamento**: forma de pagamento
6. **Observações**: campo livre

**Botões:**
- "Salvar rascunho" → salva com status RASCUNHO
- "Emitir" → chama API que envia ao Focus NFe

**API:**
```
POST /api/faturamento/nfe
Body: {
  clienteId, naturezaOperacao, dataSaida, modalidadeFrete,
  itens: [{ produtoId, quantidade, valorUnitario, valorDesconto }],
  observacoes
}
```

**Critério de aceite:**
- CFOP muda automaticamente ao selecionar cliente de outro estado
- Tributos calculados corretamente (todos zerados para Simples)
- Rascunho salvo antes de emitir

---

### FAT-02 · Integração Focus NFe — NF-e
**Dev:** Tech Lead · **Estimativa:** 10h

**Descrição:**
Implementar o fluxo de transmissão da NF-e para a SEFAZ via Focus NFe.

**Fluxo:**
1. Montar payload com `montarPayloadNFe()` de `packages/fiscal`
2. Gerar `ref` única: `${empresaId}-${nanoid()}`
3. Salvar `ref` no banco antes de chamar a API
4. `POST /v2/nfe?ref={ref}` na Focus NFe
5. Polling a cada 3s por até 30s
6. Sucesso → salvar XML e DANFE no Supabase Storage, atualizar status
7. Erro → salvar mensagem de erro, manter como ERRO

**Backend:** `apps/api/src/application/use-cases/faturamento/emitir-nfe.use-case.ts`

**Critério de aceite:**
- NF-e emitida em homologação retorna XML válido e DANFE em PDF
- Falha na SEFAZ salva a mensagem de erro com o código de rejeição

---

### FAT-03 · Formulário NFS-e
**Dev:** Dev Pleno · **Estimativa:** 16h

**Descrição:**
Tela de emissão de NFS-e para ambas as empresas. Calcula ISS, PIS e COFINS automaticamente para a Múltipla.

**Tela:** `/faturamento/nfse/novo`

**Campos:**
- Cliente (busca por nome/CNPJ)
- Código de serviço LC 116/2003
- Discriminação do serviço (mín. 10 caracteres)
- Mês de competência
- Município de prestação (padrão: município da empresa)
- Valor do serviço
- ISS retido pelo tomador? (toggle)
- Deduções (opcional)

**Cálculo automático (Múltipla — LP):**
- ISS = valor × alíquota do produto selecionado
- PIS = valor × 0,65%
- COFINS = valor × 3,00%

**API:** `POST /api/faturamento/nfse`

**Critério de aceite:**
- Múltipla calcula ISS, PIS e COFINS automaticamente
- Enfratec emite NFS-e sem cálculo de ISS (zerado no Simples)

---

### FAT-04 · Integração Focus NFe — NFS-e
**Dev:** Dev Pleno · **Estimativa:** 8h

**Descrição:**
Transmitir NFS-e via Focus NFe para a prefeitura do município de prestação.

**Importante:** cada município tem seu webservice. A Focus NFe abstrai isso — enviar o código IBGE e ela cuida do resto.

**Fluxo similar ao FAT-02 mas para** `/v2/nfse`

**Critério de aceite:**
- NFS-e emitida em homologação retorna código de verificação da prefeitura
- Link de consulta na prefeitura salvo no banco

---

### FAT-05 · Nota de Locação (Múltipla)
**Dev:** Dev Pleno · **Estimativa:** 8h

**Descrição:**
Emissão específica da Múltipla para locação de equipamentos para o Sicredi.

**Tela:** `/faturamento/locacao/novo`

**Campos adicionais além dos da NFS-e:**
- Número do contrato
- Bem locado (texto descritivo)
- Data início da locação
- Data fim da locação
- Local de utilização
- Valor diário ou mensal (opcional — para compor a discriminação)

**Discriminação gerada automaticamente:**
```
LOCAÇÃO DE [BEM]
Contrato nº: [NÚMERO]
Período: [DD/MM/AAAA] a [DD/MM/AAAA]
Local de utilização: [LOCAL]
Valor total da locação: R$ [VALOR]
```

**Código de serviço:** `03.01` da LC 116/2003 (confirmar com contador o código exato)

**Critério de aceite:**
- Discriminação gerada com todos os campos obrigatórios
- Nota transmitida como NFS-e com código de locação

---

### FAT-06 · Listagem de Notas
**Dev:** Dev Pleno · **Estimativa:** 6h

**Descrição:**
Tela principal do módulo de faturamento com todas as notas emitidas.

**Tela:** `/faturamento/notas`

**Filtros:**
- Tipo: NF-e / NFS-e / Locação / Todos
- Status: Rascunho / Autorizada / Cancelada / Erro / Todos
- Período: De até (data emissão)
- Cliente: busca por nome ou CNPJ

**Cards de resumo no topo:**
- Total do período (soma das notas autorizadas)
- Quantidade por tipo

**Tabela com colunas:** Número, Tipo, Cliente, Data emissão, Valor, Status, Ações

**Ações por nota:**
- Ver detalhe
- Download XML (FAT-09)
- Download DANFE (FAT-09)
- Cancelar (FAT-07)

**Critério de aceite:**
- Filtros funcionam em combinação
- Badge de status com cores: verde=Autorizada, vermelho=Cancelada, amarelo=Rascunho

---

### FAT-07 · Cancelamento de Notas
**Dev:** Tech Lead · **Estimativa:** 6h

**Descrição:**
Cancelar NF-e (até 24h) e NFS-e (prazo municipal) com justificativa.

**Fluxo:**
1. Verificar prazo (NF-e: 24h após autorização)
2. Verificar justificativa (mín. 15 caracteres)
3. Transmitir cancelamento via Focus NFe
4. Atualizar nota: status=CANCELADA
5. Cancelar Conta a Receber vinculada
6. Restaurar estoque (apenas NF-e com produtos)

**API:** `DELETE /api/faturamento/notas/:id/cancelar`
**Body:** `{ justificativa: string }`

**Critério de aceite:**
- Cancelamento após 24h é bloqueado com mensagem clara
- Justificativa < 15 chars é bloqueada
- Conta a Receber fica com status CANCELADO
- Saldo de estoque restaurado para NF-e

---

### FAT-09 · Download XML e DANFE
**Dev:** Dev Pleno · **Estimativa:** 3h

**Descrição:**
Endpoints para baixar os arquivos de cada nota fiscal.

**API:**
```
GET /api/faturamento/notas/:id/xml    → retorna .xml
GET /api/faturamento/notas/:id/danfe  → retorna .pdf
```

**Critério de aceite:**
- XML baixa com Content-Type: application/xml
- DANFE baixa com Content-Type: application/pdf
- Arquivos com nome no formato `NFe-{chaveAcesso}.xml` e `DANFE-{numero}.pdf`

---

## Ordem de Desenvolvimento Recomendada

```
Semana 1:
  Dia 1-2: INF-01, INF-02, INF-03, INF-04
  Dia 3:   INF-05, INF-06, INF-07
  Dia 4-5: CAD-01, CAD-02

Semana 2:
  Dia 1-2: CAD-03, CAD-04, CAD-05
  Dia 3:   FAT-01, FAT-02
  Dia 4:   FAT-03, FAT-04
  Dia 5:   FAT-05, FAT-06, FAT-07, FAT-09
```

---

## Dependências entre Tarefas

```
INF-01 → INF-02 → INF-03 → INF-04 → todos os outros
INF-05 → todos os outros (frontend)
CAD-02 → FAT-01, FAT-03 (precisa ter clientes cadastrados)
CAD-03 → FAT-01 (precisa ter produtos cadastrados)
FAT-01 → FAT-02 (formulário antes da integração)
FAT-03 → FAT-04
```
