# SIGEF — Backlog Completo MVP

> **Total:** 59 itens críticos (🔴) · 358h estimadas · 2 devs × 4 semanas
> **Prioridade:** 🔴 Crítico (MVP) · 🟡 Importante · 🟢 Nice-to-have

---

## Épico INF — Infraestrutura & Setup

| ID | Prioridade | Tarefa | Dev | Horas | Sprint |
|----|-----------|--------|-----|-------|--------|
| INF-01 | 🔴 | Setup do monorepo (Next.js + Fastify + Prisma) | Tech Lead | 8h | S1 |
| INF-02 | 🔴 | Schema Prisma completo + migrations | Tech Lead | 4h | S1 |
| INF-03 | 🔴 | Autenticação NextAuth v5 + JWT + roles | Tech Lead | 8h | S1 |
| INF-04 | 🔴 | Middleware multi-tenant (empresa_id injetado) | Tech Lead | 6h | S1 |
| INF-05 | 🔴 | Layout base: Sidebar, Header, EmpresaSelector | Dev Pleno | 8h | S1 |
| INF-06 | 🔴 | CI/CD GitHub Actions → Vercel + Railway | Tech Lead | 6h | S1 |
| INF-07 | 🔴 | Client Focus NFe configurado em homologação | Dev Pleno | 4h | S1 |
| INF-08 | 🟡 | Sentry para monitoramento de erros | Dev Pleno | 2h | S1 |

**Total INF:** 46h

---

## Épico CAD — Cadastros

| ID | Prioridade | Tarefa | Dev | Horas | Sprint |
|----|-----------|--------|-----|-------|--------|
| CAD-01 | 🔴 | CRUD de Empresas + upload certificado A1 | Dev Pleno | 12h | S1 |
| CAD-02 | 🔴 | CRUD de Clientes/Fornecedores + validação CNPJ | Dev Pleno | 10h | S1 |
| CAD-03 | 🔴 | CRUD de Produtos/Serviços com campos fiscais | Dev Pleno | 14h | S1 |
| CAD-04 | 🔴 | Cadastro de Contas Bancárias | Dev Pleno | 4h | S1 |
| CAD-05 | 🟡 | Auto-preenchimento de endereço via ViaCEP | Dev Pleno | 2h | S1 |
| CAD-06 | 🟡 | Importação de clientes via CSV | Dev Pleno | 4h | S2 |

**Total CAD:** 46h

---

## Épico FAT — Faturamento / Saídas

| ID | Prioridade | Tarefa | Dev | Horas | Sprint |
|----|-----------|--------|-----|-------|--------|
| FAT-01 | 🔴 | Formulário NF-e (Enfratec) com cálculo automático de tributos | Tech Lead | 20h | S1 |
| FAT-02 | 🔴 | Integração Focus NFe: NF-e → SEFAZ → XML + DANFE | Tech Lead | 10h | S1 |
| FAT-03 | 🔴 | Formulário NFS-e (Múltipla e Enfratec) | Dev Pleno | 16h | S1 |
| FAT-04 | 🔴 | Integração Focus NFe: NFS-e → prefeitura | Dev Pleno | 8h | S1 |
| FAT-05 | 🔴 | Nota de Locação (Múltipla) com campos de contrato | Dev Pleno | 8h | S1 |
| FAT-06 | 🔴 | Listagem de notas com filtros completos | Dev Pleno | 6h | S1 |
| FAT-07 | 🔴 | Cancelamento de NF-e e NFS-e com justificativa | Tech Lead | 6h | S1 |
| FAT-08 | 🔴 | Emissão em lote de NFS-e (caso Sicredi — 71 notas) | Tech Lead | 10h | S2 |
| FAT-09 | 🟡 | Download de XML e DANFE | Dev Pleno | 3h | S1 |
| FAT-10 | 🟡 | Envio de NF por e-mail via Resend | Dev Pleno | 4h | S2 |
| FAT-11 | 🟢 | Orçamento / pré-venda com conversão em NF | Dev Pleno | 10h | Pós-MVP |

**Total FAT (críticos):** 84h

---

## Épico EST — Compras, Estoque e Inventário

| ID | Prioridade | Tarefa | Dev | Horas | Sprint |
|----|-----------|--------|-----|-------|--------|
| EST-01 | 🔴 | Upload e leitura de XML de NF-e de fornecedor | Tech Lead | 10h | S2 |
| EST-02 | 🔴 | Parser XML: extração completa de dados da nota | Tech Lead | 8h | S2 |
| EST-03 | 🔴 | Entrada automática no estoque (Custo Médio Ponderado) | Tech Lead | 6h | S2 |
| EST-04 | 🔴 | Conta a Pagar criada automaticamente ao confirmar compra | Dev Pleno | 4h | S2 |
| EST-05 | 🔴 | Tela de saldo de estoque com busca e filtros | Dev Pleno | 8h | S2 |
| EST-06 | 🔴 | Baixa automática de estoque ao emitir NF-e de venda | Tech Lead | 6h | S2 |
| EST-07 | 🔴 | Ajuste manual de estoque com justificativa e aprovação | Dev Pleno | 6h | S2 |
| EST-08 | 🔴 | Histórico de movimentações por produto | Dev Pleno | 6h | S2 |
| EST-09 | 🔴 | Geração do Bloco H (inventário) para o SPED | Tech Lead | 14h | S2 |
| EST-10 | 🟡 | Alerta de estoque mínimo (e-mail + notificação) | Dev Pleno | 4h | S2 |
| EST-11 | 🟡 | Relatório de custo médio por produto | Dev Pleno | 6h | Pós-MVP |
| EST-12 | 🟡 | Lançamento manual de compra (sem XML, com PDF) | Dev Pleno | 8h | S2 |
| EST-13 | 🟢 | Controle de múltiplos depósitos | — | 10h | Pós-MVP |

**Total EST (críticos):** 68h

---

## Épico FIN — Financeiro

| ID | Prioridade | Tarefa | Dev | Horas | Sprint |
|----|-----------|--------|-----|-------|--------|
| FIN-01 | 🔴 | Contas a Receber: listagem, filtros, baixa manual | Dev Pleno | 12h | S2 |
| FIN-02 | 🔴 | Contas a Pagar: listagem, filtros, baixa, aprovação | Dev Pleno | 12h | S2 |
| FIN-03 | 🔴 | Dashboard de Fluxo de Caixa em tempo real | Dev Pleno | 14h | S2 |
| FIN-04 | 🔴 | Importação de extrato bancário OFX | Tech Lead | 10h | S2 |
| FIN-05 | 🔴 | Motor de conciliação automática | Tech Lead | 14h | S2 |
| FIN-06 | 🔴 | Tela de revisão de itens não conciliados | Dev Pleno | 10h | S2 |
| FIN-07 | 🔴 | Relatório de inconsistências bancárias | Dev Pleno | 8h | S2 |
| FIN-08 | 🔴 | Resumo anual de entradas e saídas (XLSX) | Dev Pleno | 8h | S2 |
| FIN-09 | 🟡 | Categorias de despesa configuráveis | Dev Pleno | 6h | S2 |
| FIN-10 | 🟡 | DRE simplificado por período | Dev Pleno | 10h | S2 |
| FIN-11 | 🟡 | Relatório consolidado do grupo | Dev Pleno | 10h | Pós-MVP |
| FIN-12 | 🟢 | Integração Open Finance (Sicoob, Inter, Bradesco) | Tech Lead | 20h | Pós-MVP |

**Total FIN (críticos):** 88h

---

## Épico SPD — SPED Fiscal

| ID | Prioridade | Tarefa | Dev | Horas | Sprint |
|----|-----------|--------|-----|-------|--------|
| SPD-01 | 🔴 | Motor SPED: Bloco 0 (abertura e cadastros) | Tech Lead | 12h | S2 |
| SPD-02 | 🔴 | Motor SPED: Bloco C (NF-e mercadorias) | Tech Lead | 14h | S2 |
| SPD-03 | 🔴 | Motor SPED: Bloco A (NFS-e) | Tech Lead | 10h | S2 |
| SPD-04 | 🔴 | Motor SPED: Bloco E (apuração ICMS/IPI) | Tech Lead | 12h | S2 |
| SPD-05 | 🔴 | Motor SPED: Bloco H (integrado com EST-09) | Tech Lead | 8h | S2 |
| SPD-06 | 🔴 | Motor SPED: Bloco 9 (encerramento e totalizadores) | Tech Lead | 6h | S2 |
| SPD-07 | 🔴 | Tela: seleção período, preview, geração, download | Dev Pleno | 10h | S2 |
| SPD-08 | 🟡 | Histórico de arquivos com hash MD5 | Dev Pleno | 4h | S2 |
| SPD-09 | 🟡 | Validação interna dos registros antes de gerar | Tech Lead | 8h | Pós-MVP |

**Total SPD (críticos):** 72h

---

## Resumo por Sprint

| Sprint | Duração | Épicos | Horas | Meta |
|--------|---------|--------|-------|------|
| Sprint 1 | Semanas 1 e 2 | INF + CAD + FAT (base) | ~180h | Setup, cadastros, emissão de notas funcionando |
| Sprint 2 | Semanas 3 e 4 | FAT (lote) + EST + FIN + SPD | ~180h | Estoque, financeiro, conciliação e SPED completo |
| Pós-MVP | — | FAT-11, EST-11/13, FIN-11/12, SPD-09 | — | Funcionalidades de expansão |

---

## Critério de Definition of Done (DoD)

Toda tarefa só é **DONE** quando:

- [ ] Código escrito e revisado
- [ ] Validação Zod implementada no endpoint (backend)
- [ ] Filtro `empresa_id` presente em todas as queries
- [ ] Nenhum `console.log` de debug no código final
- [ ] Erro tratado com mensagem amigável (não expor stack trace)
- [ ] Deploy no staging funcionando
- [ ] Testado no browser (desktop)
- [ ] Critério de aceite da tarefa verificado
