import { formatarValorSped, formatarQuantidadeSped, formatarDataSped } from '../../utils/formatters';

export interface ItemInventario {
  codItem: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number; // centavos
  valorTotal: number;    // centavos
  indProp: string;       // '0'=próprio
  cstIcms?: string;
  bcIcms?: number;
  vlIcms?: number;
}

export function gerarBlocoH(
  dataInventario: Date,
  motivoInventario: string,
  itens: ItemInventario[],
): string {
  const lines: string[] = [];
  let totalLinhas = 0;

  const temDados = itens.length > 0 ? '1' : '0';
  lines.push(`|H001|${temDados}|`);
  totalLinhas++;

  if (itens.length > 0) {
    const vlInventario = itens.reduce((sum, i) => sum + i.valorTotal, 0);
    lines.push(`|H005|${formatarDataSped(dataInventario)}|${formatarValorSped(vlInventario)}|${motivoInventario}|`);
    totalLinhas++;

    for (const item of itens) {
      lines.push([
        '|H010', item.codItem, item.unidade,
        formatarQuantidadeSped(item.quantidade),
        formatarValorSped(item.valorUnitario),
        formatarValorSped(item.valorTotal),
        item.indProp, '', '', '', '', '|',
      ].join('|'));
      totalLinhas++;

      if (item.cstIcms && item.bcIcms !== undefined && item.vlIcms !== undefined) {
        lines.push([
          '|H020', item.cstIcms,
          formatarValorSped(item.bcIcms),
          formatarValorSped(item.vlIcms), '|',
        ].join('|'));
        totalLinhas++;
      }
    }
  }

  lines.push(`|H990|${totalLinhas + 1}|`);
  return lines.join('\n');
}
