# SIGEF — Prompts para Agentes de IA (Codex / Claude Code)
> Cole o prompt inteiro no agente. Substitua os [colchetes] com o que for necessário.

---

## Como usar estes prompts

1. Abra o Codex (ou Claude Code / Cursor / Cline)
2. Cole o **prompt base** + o **prompt da tarefa** específica
3. O agente terá contexto suficiente para implementar sem perguntas desnecessárias

---

## PROMPT BASE — Cole sempre no início de cada sessão

```
Você é um desenvolvedor TypeScript sênior trabalhando no projeto SIGEF (Sistema Integrado de Gestão Fiscal) da Orion Lab.

REGRAS OBRIGATÓRIAS:
- Toda query ao banco DEVE filtrar por empresaId — NUNCA fazer query sem where: { empresaId }
- Valores monetários são SEMPRE em centavos (inteiros). Nunca usar float para dinheiro.
- Error handling: usar Result<T, AppError> de packages/types — nunca throw direto para o cliente
- Validar input com Zod antes de qualquer processamento no handler
- Logs fiscais são imutáveis — cancelamentos criam novos registros, nunca deletam
- NF-e autorizada é imutável — só cancela, nunca edita
- Estoque só existe para a Enfratec — verificar empresa.hasEstoque === true

STACK:
- Frontend: Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- Backend: Fastify 4 + TypeScript (Arquitetura Hexagonal)
- ORM: Prisma 5 + PostgreSQL 16 (porta 5433 local)
- Auth: NextAuth v5 + JWT
- API Fiscal: Focus NFe REST v2
- Monorepo: Turborepo + pnpm workspaces

ESTRUTURA:
- apps/web → Next.js (porta 3000)
- apps/api → Fastify backend (porta 3001)
- packages/db → Prisma schema + client
- packages/types → Result<T>, AppError, AuthContext
- packages/validators → Zod schemas + validação CNPJ
- packages/fiscal → Motor SPED, calculadora tributos, parsers XML/OFX

EMPRESAS:
- Múltipla Gestão: Lucro Presumido, NFS-e + Nota de Locação, SEM estoque
- Enfratec: Simples Nacional, NF-e + NFS-e, COM estoque (Bloco H)
- Cliente: Sicredi SC (múltiplas agências com CNPJs distintos)

Skill de referência: [INFORMAR QUAL SKILL — ex: SKILL-03-FATURAMENTO.md]
```

---

## PROMPTS POR TAREFA

---

### INF-03 · Autenticação NextAuth + JWT

```
[PROMPT BASE acima]
Skill de referência: SKILL-01-INFRA.md

Tarefa: INF-03 — Implementar sistema de autenticação completo

Implemente:

1. BACKEND — Endpoint de login:
   Arquivo: apps/api/src/presentation/routes/auth/login.route.ts
   POST /api/auth/login
   Body: { email: string, senha: string, empresaId: string }
   - Buscar usuário por email no banco
   - Verificar senha com bcrypt
   - Verificar que usuário tem acesso à empresaId em usuarios_empresas
   - Retornar: { id, nome, email, role, empresaId, empresaNome }
   - Erro 401 se credenciais inválidas

2. BACKEND — Plugin JWT:
   Arquivo: apps/api/src/presentation/plugins/jwt.plugin.ts
   - Registrar @fastify/jwt com process.env.NEXTAUTH_SECRET
   - Decorator fastify.authenticate que:
     - Verifica JWT
     - Injeta request.empresaId, request.userId, request.role

3. FRONTEND — Auth config:
   Arquivo: apps/web/lib/auth.ts
   - NextAuth v5 com Credentials provider
   - Chamar POST API_URL/api/auth/login
   - Callbacks jwt e session para persistir role, empresaId, empresaNome no token

4. FRONTEND — Tela de login:
   Arquivo: apps/web/app/(auth)/login/page.tsx
   - Formulário com campos: email, senha, empresa (dropdown)
   - Dropdown de empresa carregado após validar o email
   - Usar React Hook Form + Zod para validação
   - Ao enviar: chamar signIn('credentials', { email, senha, empresaId })
   - Redirecionar para / após sucesso
   - Mensagem de erro clara em caso de falha

5. FRONTEND — Middleware de proteção:
   Arquivo: apps/web/middleware.ts
   - Proteger todas as rotas exceto /login
   - Redirecionar para /login se não autenticado
```

---

### INF-05 · Layout Base

```
[PROMPT BASE acima]
Skill de referência: SKILL-01-INFRA.md

Tarefa: INF-05 — Implementar layout base da aplicação

Implemente:

1. Sidebar:
   Arquivo: apps/web/components/layout/Sidebar.tsx
   - Lista de itens de menu com ícones (usar lucide-react)
   - Itens condicionais por role e hasEstoque:
     Dashboard → todos
     Cadastros → admin, financeiro, faturamento
     Faturamento → admin, financeiro, faturamento
     Compras → admin, financeiro, almoxarife (só se empresa.hasEstoque)
     Estoque → admin, financeiro, almoxarife (só se empresa.hasEstoque)
     Financeiro → admin, financeiro
     SPED Fiscal → admin, contador (só se empresa.hasEstoque)
   - Item ativo com destaque visual
   - Usar as cores do tema Orion Lab (azul escuro #0D1B3E, azul elétrico #1A6EFF)

2. Header:
   Arquivo: apps/web/components/layout/Header.tsx
   - Nome e logo da empresa ativa
   - Componente EmpresaSelector (dropdown)
   - Nome do usuário logado + botão de logout

3. EmpresaSelector:
   Arquivo: apps/web/components/layout/EmpresaSelector.tsx
   - Dropdown mostrando as empresas que o usuário tem acesso
   - Ao selecionar: POST /api/auth/trocar-empresa → novo JWT → router.refresh()

4. Layout do dashboard:
   Arquivo: apps/web/app/(dashboard)/layout.tsx
   - Envolver com Sidebar + Header
   - Verificar autenticação (redirecionar para login se não autenticado)
```

---

### CAD-02 · CRUD de Clientes e Fornecedores

```
[PROMPT BASE acima]
Skill de referência: SKILL-02-CADASTROS.md

Tarefa: CAD-02 — CRUD de Clientes e Fornecedores com validação CNPJ

Contexto importante: O principal cliente é o Sicredi SC com múltiplas agências,
cada uma com CNPJ próprio. O Sicredi já está no seed como cliente de ambas as empresas.

Implemente:

1. BACKEND — Rotas:
   GET    /api/clientes-fornecedores?tipo=CLIENTE|FORNECEDOR|all&q=busca&page=1
   POST   /api/clientes-fornecedores
   GET    /api/clientes-fornecedores/:id
   PATCH  /api/clientes-fornecedores/:id
   DELETE /api/clientes-fornecedores/:id  (soft delete: ativo=false)
   GET    /api/clientes-fornecedores/cnpj/:cnpj  (consulta Receita Federal)

   - Validar CNPJ com a função validarCNPJ de packages/validators
   - Ao buscar CNPJ: chamar brasilapi.com.br/api/cnpj/v1/{cnpj} e retornar dados

2. FRONTEND — Lista:
   Arquivo: apps/web/app/(dashboard)/cadastros/clientes-fornecedores/page.tsx
   - Tabs: Clientes / Fornecedores / Todos
   - Busca em tempo real (debounce 300ms)
   - Tabela: razão social, CNPJ, município/UF, tipo, situação, ações
   - Botão "Novo" → redireciona para /novo

3. FRONTEND — Formulário:
   Arquivo: apps/web/app/(dashboard)/cadastros/clientes-fornecedores/novo/page.tsx
   - Toggle PF/PJ no início do formulário
   - Campo CNPJ/CPF com máscara e validação em tempo real
   - Ao digitar CNPJ válido: buscar na Receita Federal e auto-preencher campos
   - Campos de endereço: CEP com auto-preenchimento via ViaCEP
   - Campos: tipo (CLIENTE/FORNECEDOR/ambos), inscrição estadual, e-mail, telefone
```

---

### CAD-03 · CRUD de Produtos e Serviços

```
[PROMPT BASE acima]
Skill de referência: SKILL-02-CADASTROS.md

Tarefa: CAD-03 — CRUD de Produtos e Serviços com campos fiscais

ATENÇÃO: Campos fiscais incorretos causam rejeição na SEFAZ.
NCM obrigatório para produtos físicos. ISS obrigatório para serviços.

Implemente:

1. BACKEND — Rotas:
   GET    /api/produtos?tipo=PRODUTO|SERVICO&q=&ativo=true
   POST   /api/produtos
   GET    /api/produtos/:id
   PATCH  /api/produtos/:id
   DELETE /api/produtos/:id  (soft delete: ativo=false)

   Ao criar produto tipo PRODUTO para empresa com hasEstoque=true:
   → Criar automaticamente registro em saldo_estoque com quantidade=0 e custoMedio=0

2. FRONTEND — Lista:
   apps/web/app/(dashboard)/cadastros/produtos/page.tsx
   - Tabs: Produtos Físicos / Serviços / Todos
   - Colunas: código, descrição, NCM/código serviço, unidade, preço venda, situação
   - Badge de estoque mínimo para produtos da Enfratec

3. FRONTEND — Formulário:
   apps/web/app/(dashboard)/cadastros/produtos/novo/page.tsx
   - Radio: PRODUTO / SERVIÇO (muda os campos exibidos)
   
   Para PRODUTO mostrar: NCM (8 dígitos, validar), CEST, CFOP padrão, CSOSN,
   EAN/GTIN, unidade (dropdown), peso, preço custo, preço venda, estoque mínimo
   
   Para SERVIÇO mostrar: código LC 116/2003, item da lista, alíquota ISS (%),
   unidade (SRV/HR), preço venda
   
   - Validar: NCM obrigatório para PRODUTO, ISS obrigatório para SERVIÇO
   - Máscara no campo NCM (####.##.##)
```

---

### FAT-01/02 · Emissão de NF-e

```
[PROMPT BASE acima]
Skill de referência: SKILL-03-FATURAMENTO.md

Tarefa: FAT-01 e FAT-02 — Formulário e emissão de NF-e (Enfratec)

Contexto: Enfratec vende equipamentos de segurança (NVR, HD, câmeras) e presta
serviços de instalação para agências Sicredi SC. Opera no Simples Nacional —
ICMS, IPI, PIS e COFINS são zerados na nota (recolhidos via DAS).

Implemente:

1. BACKEND — Use case de emissão:
   apps/api/src/application/use-cases/faturamento/emitir-nfe.use-case.ts
   
   Fluxo:
   a) Validar body com Zod (emitirNFeSchema de packages/validators)
   b) Verificar empresa.hasEstoque === true
   c) Verificar saldo de estoque para cada item (alertar se insuficiente, não bloquear)
   d) Calcular tributos com calcularSimples() de packages/fiscal
   e) Calcular CFOP: se empresa.uf === cliente.uf → 5.102, senão → 6.102
   f) Salvar nota com status=RASCUNHO
   g) Montar payload com montarPayloadNFe() de packages/fiscal
   h) Gerar ref única: `${empresaId}-${Date.now()}`
   i) Salvar ref no banco ANTES de chamar Focus NFe
   j) POST /v2/nfe?ref={ref} no Focus NFe
   k) Polling a cada 3s por até 30s para obter status
   l) Sucesso: salvar XML e DANFE no Supabase Storage, status=AUTORIZADA
   m) Após autorizar: dar baixa no estoque + criar Conta a Receber
   n) Erro: salvar mensagem, status=ERRO

2. FRONTEND — Formulário:
   apps/web/app/(dashboard)/faturamento/nfe/novo/page.tsx
   
   Seções:
   - Cliente: input de busca por nome/CNPJ com dropdown de resultados
   - Dados: natureza da operação (dropdown), data emissão, data saída, frete
   - Itens: busca de produto, quantidade, valor unitário
     → Mostrar CFOP calculado automaticamente
     → Mostrar tributos zerados (Simples Nacional)
     → Botão "Adicionar item"
   - Totais: produtos, frete, seguro, outras despesas, TOTAL
   - Pagamento: forma de pagamento
   - Botões: "Salvar rascunho" e "Emitir"
   
   Ao clicar em Emitir:
   - Mostrar spinner/loading "Transmitindo para a SEFAZ..."
   - Polling de status a cada 3s
   - Sucesso: toast "NF-e autorizada!" + link para download do DANFE
   - Erro: exibir código e mensagem de rejeição da SEFAZ
```

---

### FAT-03/04 · Emissão de NFS-e

```
[PROMPT BASE acima]
Skill de referência: SKILL-03-FATURAMENTO.md

Tarefa: FAT-03 e FAT-04 — Formulário e emissão de NFS-e (ambas as empresas)

Contexto: 
- Múltipla emite NFS-e de monitoramento, manutenção e gerenciamento para Sicredi SC
  Tributos calculados: ISS (alíquota municipal), PIS 0,65%, COFINS 3,00%
- Enfratec emite NFS-e de instalação e suporte técnico
  Tributos: zerados (Simples Nacional)

Implemente:

1. BACKEND — Use case de emissão NFS-e:
   apps/api/src/application/use-cases/faturamento/emitir-nfse.use-case.ts
   
   Para Múltipla (LUCRO_PRESUMIDO):
   - Calcular com calcularLP(valorServico, aliquotaIss) de packages/fiscal
   - ISS = valorServico × aliquotaIss (do produto selecionado)
   - PIS = valorServico × 65 / 10000
   - COFINS = valorServico × 300 / 10000
   
   Para Enfratec (SIMPLES_NACIONAL): todos os tributos = 0
   
   Fluxo similar ao FAT-02 mas usando /v2/nfse do Focus NFe

2. FRONTEND — Formulário NFS-e:
   apps/web/app/(dashboard)/faturamento/nfse/novo/page.tsx
   
   Campos:
   - Cliente (busca)
   - Produto/serviço (busca — tipo SERVICO apenas)
   - Discriminação detalhada (mín. 10 chars, mínimo 3 linhas de texto)
   - Mês de competência (date picker — mês/ano)
   - Município de prestação (padrão: município da empresa)
   - Valor do serviço
   - ISS retido pelo tomador? (toggle — Sicredi pode reter)
   - Preview dos tributos calculados (Múltipla: ISS, PIS, COFINS; Enfratec: todos 0)
```

---

### FAT-05 · Nota de Locação

```
[PROMPT BASE acima]
Skill de referência: SKILL-03-FATURAMENTO.md

Tarefa: FAT-05 — Nota Fiscal de Locação (Múltipla)

Contexto: A Múltipla aluga equipamentos e o galpão para o Sicredi SC.
Ex do vídeo: "RECIBO SICREDI ALUGUEL GALPAO 01/2024" — R$ 3.100,00
É emitida como NFS-e com código de serviço 3.01 da LC 116/2003.

Implemente:

1. FRONTEND — Formulário de Locação:
   apps/web/app/(dashboard)/faturamento/locacao/novo/page.tsx
   
   Campos obrigatórios adicionais (além dos da NFS-e):
   - Número do contrato
   - Bem locado (texto descritivo — ex: "Galpão Industrial")
   - Data início da locação (date picker)
   - Data fim da locação (date picker)
   - Local de utilização (endereço completo ou nome da agência)
   - Valor diário (opcional) — para mostrar na discriminação
   
   Discriminação gerada automaticamente e exibida em tempo real:
   "LOCAÇÃO DE [BEM]
   Contrato nº: [NÚMERO]
   Período: [DD/MM/AAAA] a [DD/MM/AAAA]
   Local de utilização: [LOCAL]
   Valor total da locação: R$ [VALOR]"
   
   - Campo de código de serviço pré-preenchido com "03.01" (editável)
   - Tributos calculados automaticamente (ISS, PIS, COFINS — Múltipla LP)

2. BACKEND — Rota específica:
   POST /api/faturamento/locacao
   Usar o mesmo use-case de NFS-e mas com a discriminação gerada pelo template
```

---

### FAT-08 · Emissão em Lote

```
[PROMPT BASE acima]
Skill de referência: SKILL-03-FATURAMENTO.md

Tarefa: FAT-08 — Emissão em Lote de NFS-e (caso Sicredi — 71 notas)

Contexto: A Múltipla emite ~71 NFS-e mensais para agências Sicredi SC,
todas com o mesmo serviço mas CNPJs diferentes.
No Everflow foi visto: NF 531 IA até NF 543 IA, todas R$ 1.105,00 para SICREDI VALE LITORAL SC.

Implemente:

1. FRONTEND — Tela de emissão em lote:
   apps/web/app/(dashboard)/faturamento/lote/page.tsx
   
   Passo 1 — Selecionar clientes:
   - Lista de todos os clientes tipo CLIENTE com checkbox
   - Filtro por nome/CNPJ para encontrar as agências Sicredi
   - Botão "Selecionar todos Sicredi"
   - Contador: "47 clientes selecionados"
   
   Passo 2 — Dados comuns:
   - Serviço (dropdown de produtos tipo SERVICO)
   - Discriminação base (pode personalizar por cliente depois)
   - Mês de competência
   - Valor padrão (R$ 1.105,00 para Sicredi)
   - Toggle: "Valor personalizado por cliente" → mostra campo por linha
   
   Passo 3 — Revisar e Emitir:
   - Tabela resumo: cliente, CNPJ, valor
   - Botão "Emitir X notas"
   
   Progresso:
   - Barra de progresso: "43 de 71 emitidas..."
   - Lista em tempo real com status de cada nota (✅ / ❌)
   - Notas com erro ficam vermelhas para reemissão manual

2. BACKEND:
   POST /api/faturamento/lote
   Body: { clienteIds: string[], servicoBase: {...}, valorPadrao: number, valoresPorCliente?: Record<string,number> }
   
   - Processar sequencialmente (não em paralelo — rate limit Focus NFe)
   - 500ms de delay entre cada emissão
   - Retornar: { total, sucesso, erros: [{clienteId, mensagem}] }
```

---

### EST-01/02 · Upload e Parser de XML

```
[PROMPT BASE acima]
Skill de referência: SKILL-04-ESTOQUE.md

Tarefa: EST-01 e EST-02 — Upload e parser de XML de NF-e de fornecedor

Contexto: A Enfratec compra equipamentos parcelados de fornecedores como
S1 Comércio LTDA, FSEG Com. de Produtos Eletrônicos, Segurança 1 LTDA.
Parcelas de 10x a 12x (R$ 583,17, R$ 2.331,00, R$ 653,94).

Implemente:

1. BACKEND — Parser XML:
   packages/fiscal/src/parsers/xml-nfe.ts (já existe esqueleto — completar)
   
   Extrair:
   - Chave de acesso (44 dígitos do @_Id)
   - Emitente: CNPJ, razão social, IE
   - Itens: cProd, xProd, NCM, CFOP, uCom, qCom, vUnCom, vProd
   - Totais: vNF, vProd, vFrete, vICMS, vIPI, vST
   
   Após parse: validar chave de acesso em https://brasilapi.com.br/api/sefaz/v1/nfe/{chave}

2. BACKEND — Rota de upload:
   POST /api/compras/xml (multipart)
   - Receber arquivo XML
   - Parsear com parseXmlNFe()
   - Tentar match de itens por NCM com produtos cadastrados
   - Retornar pré-visualização (NÃO salvar ainda — apenas mostrar para o usuário)

3. FRONTEND — Tela de importação:
   apps/web/app/(dashboard)/compras/importar-xml/page.tsx
   
   Passo 1: Upload
   - Drag & drop ou clique para selecionar arquivo .xml
   - Validar extensão no frontend
   
   Passo 2: Pré-visualização (após upload)
   - Card do fornecedor (CNPJ + razão social — criar novo se não existir?)
   - Tabela de itens:
     Descrição | NCM | CFOP | Qtd | Valor Unit | Total | Produto interno
     Onde "Produto interno" é:
     ✅ [Nome do produto] se match automático por NCM
     ❓ [Selecionar produto...] se sem match
   - Totais: produtos, frete, IPI, ICMS-ST, total
   - Campo: Número de parcelas (ex: 12)
   - Campo: Data do primeiro vencimento
   - Botão: "Confirmar Entrada"
```

---

### EST-03/04 · Entrada no Estoque + Contas a Pagar

```
[PROMPT BASE acima]
Skill de referência: SKILL-04-ESTOQUE.md

Tarefa: EST-03 e EST-04 — Entrada no estoque e criação de contas a pagar

Implemente:

1. BACKEND — Use case de confirmação de compra:
   apps/api/src/application/use-cases/estoque/confirmar-compra.use-case.ts
   
   Executar tudo dentro de uma única prisma.$transaction([...]):
   
   a) Criar NotaCompra com status=CONFIRMADA
   b) Para cada item confirmado:
      - Buscar saldo atual em saldo_estoque
      - Calcular novo CMP: (qtdAtual × cmpAtual + qtdEntrada × custoEntrada) / (qtdAtual + qtdEntrada)
      - Upsert em saldo_estoque com nova quantidade e novo CMP
      - Criar MovimentacaoEstoque com tipo=ENTRADA_COMPRA
   c) Para as contas a pagar (parcelamento):
      - Para cada parcela i de 1 a N:
        - dataVencimento = dataVencimento1 + (i-1) meses
        - Criar ContaPagar com: fornecedorId, notaCompraId (só na 1ª), valor, data
        - Se valor > empresa.limiteAprovacaoPagamento → status=PENDENTE_APROVACAO
   
   Se qualquer parte falhar → rollback completo

2. Verificar alerta de estoque mínimo após cada entrada:
   Se saldo.quantidade <= produto.estoqueMinimo → enviar e-mail via Resend

Critério de teste:
- Simular compra de 10 UN produto X a R$ 150,00/un (CMP anterior: R$ 120,00, saldo anterior: 5 UN)
- Novo CMP esperado: (5×120 + 10×150) / 15 = (600 + 1500) / 15 = R$ 140,00
```

---

### FIN-04/05 · Importação OFX e Conciliação

```
[PROMPT BASE acima]
Skill de referência: SKILL-05-FINANCEIRO.md

Tarefa: FIN-04 e FIN-05 — Importação de extrato OFX e motor de conciliação

Contexto real: No Conta Azul da Múltipla, Janeiro 2024 tinha:
- Vencidos: R$ 133.890,95
- Recebidos: R$ 209.286,03
- Em aberto: "Gerenciamento de Infraestrutura 01/2024" — R$ 23.890,95
A conciliação bancária deve identificar quais pagamentos do extrato correspondem a quais contas.

Implemente:

1. BACKEND — Parser OFX:
   packages/fiscal/src/parsers/ofx-parser.ts (já existe esqueleto — completar)
   
   Extrair de cada <STMTTRN>:
   - FITID (ID único — usar para deduplicação)
   - DTPOSTED (data)
   - TRNTYPE (CREDIT ou DEBIT)
   - TRNAMT (valor — converter para centavos)
   - MEMO ou NAME (descrição)

2. BACKEND — Rota de importação:
   POST /api/financeiro/extrato/importar (multipart)
   - Receber arquivo OFX + contaBancariaId
   - Parsear com parseOFX()
   - Inserir em lancamentos_bancarios com tratamento de duplicatas:
     try { insert } catch (P2002) { duplicado++ } // @@unique([contaBancariaId, fitId])
   - Retornar: { importados, duplicados, total }

3. BACKEND — Motor de conciliação:
   apps/api/src/application/use-cases/financeiro/conciliacao.use-case.ts
   
   Para cada lançamento não conciliado:
   - Se CREDIT: buscar ContaReceber com valor exato ± 3 dias
   - Se DEBIT: buscar ContaPagar com valor exato ± 3 dias
   - Se encontrado: criar Conciliacao + marcar como QUITADO + conciliado=true
   - Se não encontrado: deixar para revisão manual
   
   Retornar: { conciliados, naoEncontrados, total }

4. FRONTEND — Tela de conciliação:
   apps/web/app/(dashboard)/financeiro/conciliacao/page.tsx
   
   Aba 1 — Importar:
   - Selecionar conta bancária (dropdown)
   - Upload do arquivo OFX
   - Resultado: "47 lançamentos importados, 3 duplicados ignorados"
   - Botão "Conciliar automaticamente"
   
   Aba 2 — Revisão:
   - Lista dos lançamentos não conciliados
   - Para cada um:
     Data | Descrição do extrato | Valor | Ações
     [Vincular a CR/CP existente] [Criar novo lançamento] [Ignorar]
   
   Aba 3 — Histórico:
   - Lançamentos conciliados com suas vinculações
```

---

### SPD-07 · Tela de Geração do SPED

```
[PROMPT BASE acima]
Skill de referência: SKILL-06-SPED.md

Tarefa: SPD-07 — Tela de geração e download do SPED Fiscal

Contexto: O SPED Fiscal é gerado apenas para a Enfratec.
O arquivo .txt deve ser validado no PVA (Programa Validador Assinador) da Receita Federal.

Implemente:

1. BACKEND — Endpoint de geração:
   POST /api/sped/gerar
   Body: { empresaId, mes: number, ano: number, incluirInventario: boolean, motivoInventario: string }
   
   - Verificar empresa.hasEstoque === true (bloquear para Múltipla)
   - Chamar gerarSpedFiscal() de packages/fiscal
   - Salvar arquivo no Supabase Storage
   - Calcular hash MD5 do conteúdo
   - Salvar metadados em sped_arquivos
   - Retornar: { arquivoId, totalLinhas, preview: { blocos: [{ nome, registros }] } }
   
   GET /api/sped/download/:arquivoId
   - Baixar do Supabase Storage
   - Content-Disposition: attachment; filename="SPED-{empresa}-{mes}{ano}.txt"
   
   GET /api/sped/historico
   - Listar sped_arquivos da empresa, ordenados por data desc

2. FRONTEND:
   apps/web/app/(dashboard)/sped/page.tsx
   
   Seção 1 — Formulário de geração:
   - Empresa: fixo "Enfratec" (ou avisar que Múltipla não gera SPED Fiscal)
   - Seletor: Mês e Ano (dropdown)
   - Toggle: "Incluir inventário (Bloco H)"
   - Condicional: se toggle ativo, mostrar "Motivo do inventário" (dropdown)
   
   Seção 2 — Preview (após selecionar período):
   - Cards mostrando registros por bloco:
     Bloco 0: N registros ✅
     Bloco A: N NFS-e ✅
     Bloco C: N NF-e ✅
     Bloco E: Apuração ICMS ✅
     Bloco H: N produtos (se incluído) ✅
     Bloco 9: Totalizadores ✅
     Total de linhas: N
   - Aviso: "⚠️ Validar no PVA antes de transmitir"
   
   Botões:
   - "Gerar Arquivo" (spinner durante geração)
   - "Download .txt" (ativo após gerar)
   
   Seção 3 — Histórico:
   - Tabela: Período | Gerado em | Por | Linhas | Hash MD5 | Download
```

---

## Dicas de Uso com o Codex

1. **Uma tarefa por sessão** — não tentar implementar duas tasks ao mesmo tempo
2. **Começar pelos testes** — peça ao Codex para escrever os testes antes do código
3. **Revisar o schema Prisma** antes de qualquer tarefa que toque no banco
4. **Sempre verificar empresa_id** — pedir ao Codex para confirmar que todas as queries têm o filtro
5. **Testar em homologação** antes de mudar para produção (variável `FOCUS_NFE_BASE_URL`)
