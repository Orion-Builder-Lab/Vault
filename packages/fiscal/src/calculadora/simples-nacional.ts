export interface ItemCalculoSimples {
  valorTotal: number; // centavos
  csosn: string;
  temST: boolean;
}

export interface ResultadoCalculoSimples {
  baseIcms: number;
  valorIcms: number;
  valorIpi: number;
  valorPis: number;
  valorCofins: number;
}

// No Simples Nacional, ICMS/PIS/COFINS estão dentro do DAS
// As notas informam mas com valor zero (exceto ST e DIFAL)
export function calcularTributosSimples(item: ItemCalculoSimples): ResultadoCalculoSimples {
  return {
    baseIcms: item.valorTotal,
    valorIcms: 0,   // recolhido via DAS
    valorIpi: 0,    // geralmente não incide
    valorPis: 0,    // recolhido via DAS
    valorCofins: 0, // recolhido via DAS
  };
}
