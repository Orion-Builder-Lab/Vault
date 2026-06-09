export interface LancamentoOFX {
  fitId: string;
  data: Date;
  tipo: 'CREDIT' | 'DEBIT';
  valor: number; // centavos
  descricao: string;
}

export async function parseOFX(buffer: Buffer): Promise<LancamentoOFX[]> {
  const text = buffer.toString('utf-8');

  // Parser simples de OFX (SGML — não é XML válido)
  const extractTag = (content: string, tag: string): string =>
    content.match(new RegExp(`<${tag}>([^<]+)`))?.[1]?.trim() ?? '';

  const stmtTrnMatches = text.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/g) ?? [];

  return stmtTrnMatches.map((trn) => {
    const tipo = extractTag(trn, 'TRNTYPE') === 'CREDIT' ? 'CREDIT' : 'DEBIT';
    const valorRaw = parseFloat(extractTag(trn, 'TRNAMT'));
    const dtRaw = extractTag(trn, 'DTPOSTED').slice(0, 8);
    const data = new Date(
      parseInt(dtRaw.slice(0, 4)),
      parseInt(dtRaw.slice(4, 6)) - 1,
      parseInt(dtRaw.slice(6, 8)),
    );

    return {
      fitId: extractTag(trn, 'FITID'),
      data,
      tipo,
      valor: Math.round(Math.abs(valorRaw) * 100) * (tipo === 'DEBIT' ? -1 : 1),
      descricao: extractTag(trn, 'MEMO') || extractTag(trn, 'NAME'),
    };
  });
}
