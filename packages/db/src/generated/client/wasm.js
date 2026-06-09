
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.EmpresaScalarFieldEnum = {
  id: 'id',
  razaoSocial: 'razaoSocial',
  nomeFantasia: 'nomeFantasia',
  cnpj: 'cnpj',
  inscricaoEstadual: 'inscricaoEstadual',
  inscricaoMunicipal: 'inscricaoMunicipal',
  regimeTributario: 'regimeTributario',
  hasEstoque: 'hasEstoque',
  cep: 'cep',
  logradouro: 'logradouro',
  numero: 'numero',
  complemento: 'complemento',
  bairro: 'bairro',
  municipio: 'municipio',
  uf: 'uf',
  codigoMunicipio: 'codigoMunicipio',
  cnae: 'cnae',
  telefone: 'telefone',
  email: 'email',
  certificadoPath: 'certificadoPath',
  certificadoSenhaEnc: 'certificadoSenhaEnc',
  focusNfeToken: 'focusNfeToken',
  limiteAprovacaoPagamento: 'limiteAprovacaoPagamento',
  diasVencimentoPadrao: 'diasVencimentoPadrao',
  ativa: 'ativa',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UsuarioScalarFieldEnum = {
  id: 'id',
  nome: 'nome',
  email: 'email',
  senhaHash: 'senhaHash',
  ativo: 'ativo',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UsuarioEmpresaScalarFieldEnum = {
  id: 'id',
  usuarioId: 'usuarioId',
  empresaId: 'empresaId',
  role: 'role',
  createdAt: 'createdAt'
};

exports.Prisma.ClienteFornecedorScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  tipo: 'tipo',
  tipoPessoa: 'tipoPessoa',
  razaoSocial: 'razaoSocial',
  nomeFantasia: 'nomeFantasia',
  cnpj: 'cnpj',
  inscricaoEstadual: 'inscricaoEstadual',
  inscricaoMunicipal: 'inscricaoMunicipal',
  nomeCompleto: 'nomeCompleto',
  cpf: 'cpf',
  cep: 'cep',
  logradouro: 'logradouro',
  numero: 'numero',
  complemento: 'complemento',
  bairro: 'bairro',
  municipio: 'municipio',
  uf: 'uf',
  codigoMunicipio: 'codigoMunicipio',
  email: 'email',
  telefone: 'telefone',
  limiteCredito: 'limiteCredito',
  condicaoPagamento: 'condicaoPagamento',
  ativo: 'ativo',
  observacoes: 'observacoes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProdutoScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  codigo: 'codigo',
  descricao: 'descricao',
  tipo: 'tipo',
  ncm: 'ncm',
  cest: 'cest',
  cfopPadrao: 'cfopPadrao',
  cstIcms: 'cstIcms',
  cstPis: 'cstPis',
  cstCofins: 'cstCofins',
  ean: 'ean',
  unidade: 'unidade',
  pesoLiquido: 'pesoLiquido',
  pesoBruto: 'pesoBruto',
  codigoServico: 'codigoServico',
  aliquotaIss: 'aliquotaIss',
  itemListaServico: 'itemListaServico',
  aliquotaIpi: 'aliquotaIpi',
  aliquotaPis: 'aliquotaPis',
  aliquotaCofins: 'aliquotaCofins',
  temST: 'temST',
  precoCusto: 'precoCusto',
  precoVenda: 'precoVenda',
  estoqueMinimo: 'estoqueMinimo',
  ativo: 'ativo',
  observacoes: 'observacoes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotaFiscalScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  tipo: 'tipo',
  status: 'status',
  numero: 'numero',
  serie: 'serie',
  referencia: 'referencia',
  clienteId: 'clienteId',
  naturezaOperacao: 'naturezaOperacao',
  dataEmissao: 'dataEmissao',
  dataCompetencia: 'dataCompetencia',
  dataSaida: 'dataSaida',
  valorProdutos: 'valorProdutos',
  valorServicos: 'valorServicos',
  valorDesconto: 'valorDesconto',
  valorFrete: 'valorFrete',
  valorSeguro: 'valorSeguro',
  valorOutras: 'valorOutras',
  valorIcms: 'valorIcms',
  valorIpi: 'valorIpi',
  valorPis: 'valorPis',
  valorCofins: 'valorCofins',
  valorIss: 'valorIss',
  valorIr: 'valorIr',
  valorCsll: 'valorCsll',
  valorInss: 'valorInss',
  valorTotal: 'valorTotal',
  cfop: 'cfop',
  modalidadeFrete: 'modalidadeFrete',
  codigoServico: 'codigoServico',
  municipioPrestacao: 'municipioPrestacao',
  discriminacao: 'discriminacao',
  chaveAcesso: 'chaveAcesso',
  protocolo: 'protocolo',
  xmlAutorizado: 'xmlAutorizado',
  danfePath: 'danfePath',
  codigoVerificacao: 'codigoVerificacao',
  linkNfse: 'linkNfse',
  mensagemErro: 'mensagemErro',
  cancelada: 'cancelada',
  motivoCancelamento: 'motivoCancelamento',
  dataCancelamento: 'dataCancelamento',
  xmlCancelamento: 'xmlCancelamento',
  observacoes: 'observacoes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ItemNotaScalarFieldEnum = {
  id: 'id',
  notaId: 'notaId',
  produtoId: 'produtoId',
  ordem: 'ordem',
  quantidade: 'quantidade',
  valorUnitario: 'valorUnitario',
  valorDesconto: 'valorDesconto',
  valorTotal: 'valorTotal',
  cfop: 'cfop',
  ncm: 'ncm',
  cstIcms: 'cstIcms',
  cstPis: 'cstPis',
  cstCofins: 'cstCofins',
  baseIcms: 'baseIcms',
  aliquotaIcms: 'aliquotaIcms',
  valorIcms: 'valorIcms',
  baseIpi: 'baseIpi',
  aliquotaIpi: 'aliquotaIpi',
  valorIpi: 'valorIpi',
  basePis: 'basePis',
  aliquotaPis: 'aliquotaPis',
  valorPis: 'valorPis',
  baseCofins: 'baseCofins',
  aliquotaCofins: 'aliquotaCofins',
  valorCofins: 'valorCofins'
};

exports.Prisma.NotaCompraScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  fornecedorId: 'fornecedorId',
  status: 'status',
  chaveAcesso: 'chaveAcesso',
  numero: 'numero',
  serie: 'serie',
  dataEmissao: 'dataEmissao',
  dataEntrada: 'dataEntrada',
  valorProdutos: 'valorProdutos',
  valorFrete: 'valorFrete',
  valorDesconto: 'valorDesconto',
  valorIcms: 'valorIcms',
  valorIpi: 'valorIpi',
  valorSt: 'valorSt',
  valorTotal: 'valorTotal',
  xmlPath: 'xmlPath',
  observacoes: 'observacoes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ItemNotaCompraScalarFieldEnum = {
  id: 'id',
  notaCompraId: 'notaCompraId',
  produtoId: 'produtoId',
  descricao: 'descricao',
  ncm: 'ncm',
  cfop: 'cfop',
  unidade: 'unidade',
  quantidade: 'quantidade',
  valorUnitario: 'valorUnitario',
  valorTotal: 'valorTotal',
  valorIcms: 'valorIcms',
  valorIpi: 'valorIpi',
  valorSt: 'valorSt',
  codigoFornecedor: 'codigoFornecedor'
};

exports.Prisma.SaldoEstoqueScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  produtoId: 'produtoId',
  quantidade: 'quantidade',
  custoMedio: 'custoMedio',
  updatedAt: 'updatedAt'
};

exports.Prisma.MovimentacaoEstoqueScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  produtoId: 'produtoId',
  tipo: 'tipo',
  quantidade: 'quantidade',
  custoUnitario: 'custoUnitario',
  custoTotal: 'custoTotal',
  saldoAnterior: 'saldoAnterior',
  saldoPosterior: 'saldoPosterior',
  custoMedioAntes: 'custoMedioAntes',
  custoMedioApos: 'custoMedioApos',
  dataMovimento: 'dataMovimento',
  notaFiscalId: 'notaFiscalId',
  notaCompraId: 'notaCompraId',
  ajusteJustificativa: 'ajusteJustificativa',
  aprovadoPor: 'aprovadoPor',
  observacoes: 'observacoes',
  createdAt: 'createdAt',
  criadoPor: 'criadoPor'
};

exports.Prisma.ContaReceberScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  clienteId: 'clienteId',
  notaFiscalId: 'notaFiscalId',
  descricao: 'descricao',
  valor: 'valor',
  valorRecebido: 'valorRecebido',
  status: 'status',
  categoria: 'categoria',
  dataVencimento: 'dataVencimento',
  dataRecebimento: 'dataRecebimento',
  formaPagamento: 'formaPagamento',
  observacoes: 'observacoes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContaPagarScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  fornecedorId: 'fornecedorId',
  notaCompraId: 'notaCompraId',
  descricao: 'descricao',
  valor: 'valor',
  valorPago: 'valorPago',
  status: 'status',
  categoria: 'categoria',
  dataVencimento: 'dataVencimento',
  dataPagamento: 'dataPagamento',
  formaPagamento: 'formaPagamento',
  aprovacaoNecessaria: 'aprovacaoNecessaria',
  aprovadoPor: 'aprovadoPor',
  dataAprovacao: 'dataAprovacao',
  observacoes: 'observacoes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ContaBancariaScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  nomeBanco: 'nomeBanco',
  codigoBanco: 'codigoBanco',
  agencia: 'agencia',
  conta: 'conta',
  digito: 'digito',
  tipo: 'tipo',
  saldoInicial: 'saldoInicial',
  dataInicial: 'dataInicial',
  ativa: 'ativa',
  createdAt: 'createdAt'
};

exports.Prisma.LancamentoBancarioScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  contaBancariaId: 'contaBancariaId',
  data: 'data',
  descricao: 'descricao',
  valor: 'valor',
  tipo: 'tipo',
  fitId: 'fitId',
  conciliado: 'conciliado',
  createdAt: 'createdAt'
};

exports.Prisma.ConciliacaoScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  lancamentoBancarioId: 'lancamentoBancarioId',
  contaReceberId: 'contaReceberId',
  contaPagarId: 'contaPagarId',
  tipo: 'tipo',
  createdAt: 'createdAt',
  criadoPor: 'criadoPor'
};

exports.Prisma.SpedArquivoScalarFieldEnum = {
  id: 'id',
  empresaId: 'empresaId',
  mesReferencia: 'mesReferencia',
  anoReferencia: 'anoReferencia',
  tipoSped: 'tipoSped',
  status: 'status',
  totalLinhas: 'totalLinhas',
  hashMd5: 'hashMd5',
  storagePath: 'storagePath',
  geradoPor: 'geradoPor',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.RegimeTributario = exports.$Enums.RegimeTributario = {
  SIMPLES_NACIONAL: 'SIMPLES_NACIONAL',
  LUCRO_PRESUMIDO: 'LUCRO_PRESUMIDO',
  LUCRO_REAL: 'LUCRO_REAL'
};

exports.Role = exports.$Enums.Role = {
  admin: 'admin',
  financeiro: 'financeiro',
  faturamento: 'faturamento',
  almoxarife: 'almoxarife',
  contador: 'contador'
};

exports.TipoPessoa = exports.$Enums.TipoPessoa = {
  PF: 'PF',
  PJ: 'PJ'
};

exports.TipoCadastro = exports.$Enums.TipoCadastro = {
  CLIENTE: 'CLIENTE',
  FORNECEDOR: 'FORNECEDOR'
};

exports.TipoProduto = exports.$Enums.TipoProduto = {
  PRODUTO: 'PRODUTO',
  SERVICO: 'SERVICO'
};

exports.TipoNota = exports.$Enums.TipoNota = {
  NFE: 'NFE',
  NFSE: 'NFSE',
  NFSE_LOC: 'NFSE_LOC'
};

exports.StatusNota = exports.$Enums.StatusNota = {
  RASCUNHO: 'RASCUNHO',
  ENVIANDO: 'ENVIANDO',
  AUTORIZADA: 'AUTORIZADA',
  CANCELADA: 'CANCELADA',
  DENEGADA: 'DENEGADA',
  ERRO: 'ERRO'
};

exports.StatusNotaCompra = exports.$Enums.StatusNotaCompra = {
  PENDENTE: 'PENDENTE',
  CONFIRMADA: 'CONFIRMADA',
  CANCELADA: 'CANCELADA'
};

exports.TipoMovimentacao = exports.$Enums.TipoMovimentacao = {
  ENTRADA_COMPRA: 'ENTRADA_COMPRA',
  SAIDA_VENDA: 'SAIDA_VENDA',
  ENTRADA_DEVOLUCAO_VENDA: 'ENTRADA_DEVOLUCAO_VENDA',
  SAIDA_DEVOLUCAO_COMPRA: 'SAIDA_DEVOLUCAO_COMPRA',
  AJUSTE_POSITIVO: 'AJUSTE_POSITIVO',
  AJUSTE_NEGATIVO: 'AJUSTE_NEGATIVO',
  TRANSFERENCIA_ENTRADA: 'TRANSFERENCIA_ENTRADA',
  TRANSFERENCIA_SAIDA: 'TRANSFERENCIA_SAIDA'
};

exports.StatusConta = exports.$Enums.StatusConta = {
  ABERTO: 'ABERTO',
  PARCIAL: 'PARCIAL',
  QUITADO: 'QUITADO',
  VENCIDO: 'VENCIDO',
  CANCELADO: 'CANCELADO',
  PENDENTE_APROVACAO: 'PENDENTE_APROVACAO'
};

exports.TipoConta = exports.$Enums.TipoConta = {
  CORRENTE: 'CORRENTE',
  POUPANCA: 'POUPANCA'
};

exports.Prisma.ModelName = {
  Empresa: 'Empresa',
  Usuario: 'Usuario',
  UsuarioEmpresa: 'UsuarioEmpresa',
  ClienteFornecedor: 'ClienteFornecedor',
  Produto: 'Produto',
  NotaFiscal: 'NotaFiscal',
  ItemNota: 'ItemNota',
  NotaCompra: 'NotaCompra',
  ItemNotaCompra: 'ItemNotaCompra',
  SaldoEstoque: 'SaldoEstoque',
  MovimentacaoEstoque: 'MovimentacaoEstoque',
  ContaReceber: 'ContaReceber',
  ContaPagar: 'ContaPagar',
  ContaBancaria: 'ContaBancaria',
  LancamentoBancario: 'LancamentoBancario',
  Conciliacao: 'Conciliacao',
  SpedArquivo: 'SpedArquivo'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
