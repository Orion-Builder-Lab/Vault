export interface ResultadoCalculoLP {
  valorIss: number;
  valorPis: number;
  valorCofins: number;
}

// Lucro Presumido — regime cumulativo
// PIS: 0,65% | COFINS: 3,00% | ISS: conforme alíquota municipal
export function calcularTributosLucroPresumido(
  valorServico: number, // centavos
  aliquotaIss: number,  // basis points (ex: 500 = 5,00%)
): ResultadoCalculoLP {
  return {
    valorIss: Math.round(valorServico * aliquotaIss / 10000),
    valorPis: Math.round(valorServico * 65 / 10000),      // 0,65%
    valorCofins: Math.round(valorServico * 300 / 10000),  // 3,00%
  };
}
