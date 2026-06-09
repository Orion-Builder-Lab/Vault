import { XMLParser } from 'fast-xml-parser';

export interface DadosNFeFormatado {
  chaveAcesso: string;
  numero: string;
  serie: string;
  dataEmissao: Date;
  emitente: { cnpj: string; razaoSocial: string };
  totais: { valorTotal: number; valorProdutos: number };
  itens: Array<{
    codigoFornecedor: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number; // centavos
    valorTotal: number;    // centavos
  }>;
}

export async function parseXmlNFe(xmlBuffer: Buffer): Promise<DadosNFeFormatado> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const parsed = parser.parse(xmlBuffer.toString('utf-8')) as Record<string, unknown>;

  const nfe = (parsed['nfeProc'] as Record<string, unknown> | undefined)?.['NFe'] ??
               (parsed['NFe'] as Record<string, unknown> | undefined);
  const infNFe = (nfe as Record<string, unknown> | undefined)?.['infNFe'] as Record<string, unknown>;

  if (!infNFe) throw new Error('XML inválido: estrutura NF-e não encontrada');

  const emit = infNFe['emit'] as Record<string, unknown>;
  const det = infNFe['det'];
  const lista = Array.isArray(det) ? det : [det];
  const total = (infNFe['total'] as Record<string, unknown>)['ICMSTot'] as Record<string, unknown>;

  return {
    chaveAcesso: ((infNFe['@_Id'] as string) ?? '').replace('NFe', ''),
    numero: String((infNFe['ide'] as Record<string, unknown>)['nNF']),
    serie: String((infNFe['ide'] as Record<string, unknown>)['serie']),
    dataEmissao: new Date(String((infNFe['ide'] as Record<string, unknown>)['dhEmi'])),
    emitente: {
      cnpj: String(emit['CNPJ']),
      razaoSocial: String(emit['xNome']),
    },
    totais: {
      valorTotal: Math.round(parseFloat(String(total['vNF'])) * 100),
      valorProdutos: Math.round(parseFloat(String(total['vProd'])) * 100),
    },
    itens: lista.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const prod = i['prod'] as Record<string, unknown>;
      return {
        codigoFornecedor: String(prod['cProd']),
        descricao: String(prod['xProd']),
        ncm: String(prod['NCM']),
        cfop: String(prod['CFOP']),
        unidade: String(prod['uCom']),
        quantidade: parseFloat(String(prod['qCom'])),
        valorUnitario: Math.round(parseFloat(String(prod['vUnCom'])) * 100),
        valorTotal: Math.round(parseFloat(String(prod['vProd'])) * 100),
      };
    }),
  };
}
