-- CreateEnum
CREATE TYPE "RegimeTributario" AS ENUM ('SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'financeiro', 'faturamento', 'almoxarife', 'contador');

-- CreateEnum
CREATE TYPE "TipoNota" AS ENUM ('NFE', 'NFSE', 'NFSE_LOC');

-- CreateEnum
CREATE TYPE "StatusNota" AS ENUM ('RASCUNHO', 'ENVIANDO', 'AUTORIZADA', 'CANCELADA', 'DENEGADA', 'ERRO');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('PRODUTO', 'SERVICO');

-- CreateEnum
CREATE TYPE "TipoCadastro" AS ENUM ('CLIENTE', 'FORNECEDOR');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA_COMPRA', 'SAIDA_VENDA', 'ENTRADA_DEVOLUCAO_VENDA', 'SAIDA_DEVOLUCAO_COMPRA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SAIDA');

-- CreateEnum
CREATE TYPE "StatusConta" AS ENUM ('ABERTO', 'PARCIAL', 'QUITADO', 'VENCIDO', 'CANCELADO', 'PENDENTE_APROVACAO');

-- CreateEnum
CREATE TYPE "StatusNotaCompra" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('CORRENTE', 'POUPANCA');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "regimeTributario" "RegimeTributario" NOT NULL,
    "hasEstoque" BOOLEAN NOT NULL DEFAULT false,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "codigoMunicipio" TEXT NOT NULL,
    "cnae" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "certificadoPath" TEXT,
    "certificadoSenhaEnc" TEXT,
    "focusNfeToken" TEXT,
    "limiteAprovacaoPagamento" INTEGER NOT NULL DEFAULT 500000,
    "diasVencimentoPadrao" INTEGER NOT NULL DEFAULT 30,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_empresas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes_fornecedores" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoCadastro"[],
    "tipoPessoa" "TipoPessoa" NOT NULL,
    "razaoSocial" TEXT,
    "nomeFantasia" TEXT,
    "cnpj" TEXT,
    "inscricaoEstadual" TEXT,
    "inscricaoMunicipal" TEXT,
    "nomeCompleto" TEXT,
    "cpf" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "municipio" TEXT,
    "uf" CHAR(2),
    "codigoMunicipio" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "limiteCredito" INTEGER,
    "condicaoPagamento" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "ncm" TEXT,
    "cest" TEXT,
    "cfopPadrao" TEXT,
    "cstIcms" TEXT,
    "cstPis" TEXT,
    "cstCofins" TEXT,
    "ean" TEXT,
    "unidade" TEXT NOT NULL,
    "pesoLiquido" DOUBLE PRECISION,
    "pesoBruto" DOUBLE PRECISION,
    "codigoServico" TEXT,
    "aliquotaIss" INTEGER,
    "itemListaServico" TEXT,
    "aliquotaIpi" INTEGER,
    "aliquotaPis" INTEGER,
    "aliquotaCofins" INTEGER,
    "temST" BOOLEAN NOT NULL DEFAULT false,
    "precoCusto" INTEGER,
    "precoVenda" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tipo" "TipoNota" NOT NULL,
    "status" "StatusNota" NOT NULL DEFAULT 'RASCUNHO',
    "numero" INTEGER,
    "serie" TEXT NOT NULL DEFAULT '1',
    "referencia" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "naturezaOperacao" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataCompetencia" TIMESTAMP(3),
    "dataSaida" TIMESTAMP(3),
    "valorProdutos" INTEGER NOT NULL DEFAULT 0,
    "valorServicos" INTEGER NOT NULL DEFAULT 0,
    "valorDesconto" INTEGER NOT NULL DEFAULT 0,
    "valorFrete" INTEGER NOT NULL DEFAULT 0,
    "valorSeguro" INTEGER NOT NULL DEFAULT 0,
    "valorOutras" INTEGER NOT NULL DEFAULT 0,
    "valorIcms" INTEGER NOT NULL DEFAULT 0,
    "valorIpi" INTEGER NOT NULL DEFAULT 0,
    "valorPis" INTEGER NOT NULL DEFAULT 0,
    "valorCofins" INTEGER NOT NULL DEFAULT 0,
    "valorIss" INTEGER NOT NULL DEFAULT 0,
    "valorIr" INTEGER NOT NULL DEFAULT 0,
    "valorCsll" INTEGER NOT NULL DEFAULT 0,
    "valorInss" INTEGER NOT NULL DEFAULT 0,
    "valorTotal" INTEGER NOT NULL DEFAULT 0,
    "cfop" TEXT,
    "modalidadeFrete" INTEGER,
    "codigoServico" TEXT,
    "municipioPrestacao" TEXT,
    "discriminacao" TEXT,
    "chaveAcesso" TEXT,
    "protocolo" TEXT,
    "xmlAutorizado" TEXT,
    "danfePath" TEXT,
    "codigoVerificacao" TEXT,
    "linkNfse" TEXT,
    "mensagemErro" TEXT,
    "cancelada" BOOLEAN NOT NULL DEFAULT false,
    "motivoCancelamento" TEXT,
    "dataCancelamento" TIMESTAMP(3),
    "xmlCancelamento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_nota" (
    "id" TEXT NOT NULL,
    "notaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" INTEGER NOT NULL,
    "valorDesconto" INTEGER NOT NULL DEFAULT 0,
    "valorTotal" INTEGER NOT NULL,
    "cfop" TEXT NOT NULL,
    "ncm" TEXT,
    "cstIcms" TEXT,
    "cstPis" TEXT,
    "cstCofins" TEXT,
    "baseIcms" INTEGER NOT NULL DEFAULT 0,
    "aliquotaIcms" INTEGER NOT NULL DEFAULT 0,
    "valorIcms" INTEGER NOT NULL DEFAULT 0,
    "baseIpi" INTEGER NOT NULL DEFAULT 0,
    "aliquotaIpi" INTEGER NOT NULL DEFAULT 0,
    "valorIpi" INTEGER NOT NULL DEFAULT 0,
    "basePis" INTEGER NOT NULL DEFAULT 0,
    "aliquotaPis" INTEGER NOT NULL DEFAULT 0,
    "valorPis" INTEGER NOT NULL DEFAULT 0,
    "baseCofins" INTEGER NOT NULL DEFAULT 0,
    "aliquotaCofins" INTEGER NOT NULL DEFAULT 0,
    "valorCofins" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "itens_nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_compra" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "status" "StatusNotaCompra" NOT NULL DEFAULT 'PENDENTE',
    "chaveAcesso" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorProdutos" INTEGER NOT NULL,
    "valorFrete" INTEGER NOT NULL DEFAULT 0,
    "valorDesconto" INTEGER NOT NULL DEFAULT 0,
    "valorIcms" INTEGER NOT NULL DEFAULT 0,
    "valorIpi" INTEGER NOT NULL DEFAULT 0,
    "valorSt" INTEGER NOT NULL DEFAULT 0,
    "valorTotal" INTEGER NOT NULL,
    "xmlPath" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_nota_compra" (
    "id" TEXT NOT NULL,
    "notaCompraId" TEXT NOT NULL,
    "produtoId" TEXT,
    "descricao" TEXT NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" INTEGER NOT NULL,
    "valorTotal" INTEGER NOT NULL,
    "valorIcms" INTEGER NOT NULL DEFAULT 0,
    "valorIpi" INTEGER NOT NULL DEFAULT 0,
    "valorSt" INTEGER NOT NULL DEFAULT 0,
    "codigoFornecedor" TEXT,

    CONSTRAINT "itens_nota_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldo_estoque" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "custoMedio" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saldo_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "custoUnitario" INTEGER NOT NULL,
    "custoTotal" INTEGER NOT NULL,
    "saldoAnterior" DOUBLE PRECISION NOT NULL,
    "saldoPosterior" DOUBLE PRECISION NOT NULL,
    "custoMedioAntes" INTEGER NOT NULL,
    "custoMedioApos" INTEGER NOT NULL,
    "dataMovimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notaFiscalId" TEXT,
    "notaCompraId" TEXT,
    "ajusteJustificativa" TEXT,
    "aprovadoPor" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPor" TEXT NOT NULL,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_receber" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "notaFiscalId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "valorRecebido" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusConta" NOT NULL DEFAULT 'ABERTO',
    "categoria" TEXT,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataRecebimento" TIMESTAMP(3),
    "formaPagamento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_receber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_pagar" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "fornecedorId" TEXT,
    "notaCompraId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "valorPago" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusConta" NOT NULL DEFAULT 'ABERTO',
    "categoria" TEXT,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "formaPagamento" TEXT,
    "aprovacaoNecessaria" BOOLEAN NOT NULL DEFAULT false,
    "aprovadoPor" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_bancarias" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nomeBanco" TEXT NOT NULL,
    "codigoBanco" TEXT NOT NULL,
    "agencia" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "digito" TEXT,
    "tipo" "TipoConta" NOT NULL,
    "saldoInicial" INTEGER NOT NULL DEFAULT 0,
    "dataInicial" TIMESTAMP(3) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos_bancarios" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "contaBancariaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "fitId" TEXT NOT NULL,
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lancamentos_bancarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliacoes" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "lancamentoBancarioId" TEXT NOT NULL,
    "contaReceberId" TEXT,
    "contaPagarId" TEXT,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPor" TEXT NOT NULL,

    CONSTRAINT "conciliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sped_arquivos" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anoReferencia" INTEGER NOT NULL,
    "tipoSped" TEXT NOT NULL DEFAULT 'FISCAL',
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "totalLinhas" INTEGER NOT NULL,
    "hashMd5" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "geradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sped_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_empresas_usuarioId_empresaId_key" ON "usuarios_empresas"("usuarioId", "empresaId");

-- CreateIndex
CREATE INDEX "clientes_fornecedores_empresaId_cnpj_idx" ON "clientes_fornecedores"("empresaId", "cnpj");

-- CreateIndex
CREATE INDEX "clientes_fornecedores_empresaId_cpf_idx" ON "clientes_fornecedores"("empresaId", "cpf");

-- CreateIndex
CREATE INDEX "produtos_empresaId_tipo_idx" ON "produtos"("empresaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_empresaId_codigo_key" ON "produtos"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_referencia_key" ON "notas_fiscais"("referencia");

-- CreateIndex
CREATE INDEX "notas_fiscais_empresaId_status_idx" ON "notas_fiscais"("empresaId", "status");

-- CreateIndex
CREATE INDEX "notas_fiscais_empresaId_tipo_idx" ON "notas_fiscais"("empresaId", "tipo");

-- CreateIndex
CREATE INDEX "notas_fiscais_empresaId_dataEmissao_idx" ON "notas_fiscais"("empresaId", "dataEmissao");

-- CreateIndex
CREATE UNIQUE INDEX "notas_compra_chaveAcesso_key" ON "notas_compra"("chaveAcesso");

-- CreateIndex
CREATE INDEX "notas_compra_empresaId_fornecedorId_idx" ON "notas_compra"("empresaId", "fornecedorId");

-- CreateIndex
CREATE INDEX "notas_compra_empresaId_dataEmissao_idx" ON "notas_compra"("empresaId", "dataEmissao");

-- CreateIndex
CREATE UNIQUE INDEX "saldo_estoque_produtoId_key" ON "saldo_estoque"("produtoId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_empresaId_produtoId_idx" ON "movimentacoes_estoque"("empresaId", "produtoId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_empresaId_dataMovimento_idx" ON "movimentacoes_estoque"("empresaId", "dataMovimento");

-- CreateIndex
CREATE UNIQUE INDEX "contas_receber_notaFiscalId_key" ON "contas_receber"("notaFiscalId");

-- CreateIndex
CREATE INDEX "contas_receber_empresaId_status_idx" ON "contas_receber"("empresaId", "status");

-- CreateIndex
CREATE INDEX "contas_receber_empresaId_dataVencimento_idx" ON "contas_receber"("empresaId", "dataVencimento");

-- CreateIndex
CREATE UNIQUE INDEX "contas_pagar_notaCompraId_key" ON "contas_pagar"("notaCompraId");

-- CreateIndex
CREATE INDEX "contas_pagar_empresaId_status_idx" ON "contas_pagar"("empresaId", "status");

-- CreateIndex
CREATE INDEX "contas_pagar_empresaId_dataVencimento_idx" ON "contas_pagar"("empresaId", "dataVencimento");

-- CreateIndex
CREATE INDEX "lancamentos_bancarios_empresaId_data_idx" ON "lancamentos_bancarios"("empresaId", "data");

-- CreateIndex
CREATE INDEX "lancamentos_bancarios_empresaId_conciliado_idx" ON "lancamentos_bancarios"("empresaId", "conciliado");

-- CreateIndex
CREATE UNIQUE INDEX "lancamentos_bancarios_contaBancariaId_fitId_key" ON "lancamentos_bancarios"("contaBancariaId", "fitId");

-- CreateIndex
CREATE UNIQUE INDEX "sped_arquivos_empresaId_mesReferencia_anoReferencia_tipoSpe_key" ON "sped_arquivos"("empresaId", "mesReferencia", "anoReferencia", "tipoSped");

-- AddForeignKey
ALTER TABLE "usuarios_empresas" ADD CONSTRAINT "usuarios_empresas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_empresas" ADD CONSTRAINT "usuarios_empresas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_fornecedores" ADD CONSTRAINT "clientes_fornecedores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes_fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota" ADD CONSTRAINT "itens_nota_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota" ADD CONSTRAINT "itens_nota_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_compra" ADD CONSTRAINT "notas_compra_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_compra" ADD CONSTRAINT "notas_compra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "clientes_fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_compra" ADD CONSTRAINT "itens_nota_compra_notaCompraId_fkey" FOREIGN KEY ("notaCompraId") REFERENCES "notas_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_nota_compra" ADD CONSTRAINT "itens_nota_compra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldo_estoque" ADD CONSTRAINT "saldo_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "notas_fiscais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_notaCompraId_fkey" FOREIGN KEY ("notaCompraId") REFERENCES "notas_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes_fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_receber" ADD CONSTRAINT "contas_receber_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "notas_fiscais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "clientes_fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_notaCompraId_fkey" FOREIGN KEY ("notaCompraId") REFERENCES "notas_compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_bancarias" ADD CONSTRAINT "contas_bancarias_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_bancarios" ADD CONSTRAINT "lancamentos_bancarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_bancarios" ADD CONSTRAINT "lancamentos_bancarios_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES "contas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacoes" ADD CONSTRAINT "conciliacoes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacoes" ADD CONSTRAINT "conciliacoes_lancamentoBancarioId_fkey" FOREIGN KEY ("lancamentoBancarioId") REFERENCES "lancamentos_bancarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacoes" ADD CONSTRAINT "conciliacoes_contaReceberId_fkey" FOREIGN KEY ("contaReceberId") REFERENCES "contas_receber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacoes" ADD CONSTRAINT "conciliacoes_contaPagarId_fkey" FOREIGN KEY ("contaPagarId") REFERENCES "contas_pagar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sped_arquivos" ADD CONSTRAINT "sped_arquivos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
