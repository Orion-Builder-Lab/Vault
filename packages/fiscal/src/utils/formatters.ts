export const formatarValorSped = (centavos: number): string => {
  if (centavos === 0) return '0,00';
  return (Math.abs(centavos) / 100).toFixed(2).replace('.', ',');
};

export const formatarQuantidadeSped = (qtd: number): string =>
  qtd.toFixed(3).replace('.', ',');

export const formatarAliquotaSped = (basisPoints: number): string =>
  (basisPoints / 100).toFixed(2).replace('.', ',');

export const formatarDataSped = (date: Date): string => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}${m}${y}`;
};

export const descricaoUnidade = (unid: string): string => {
  const mapa: Record<string, string> = {
    UN: 'UNIDADE', KG: 'KILOGRAMA', CX: 'CAIXA', MT: 'METRO',
    SRV: 'SERVICO', HR: 'HORA', LT: 'LITRO', M2: 'METRO QUADRADO',
    PC: 'PECA', GL: 'GALAO',
  };
  return mapa[unid] ?? unid;
};
