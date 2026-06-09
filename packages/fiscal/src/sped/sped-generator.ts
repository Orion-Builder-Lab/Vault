// Motor principal de geração do SPED Fiscal
// Implementação detalhada na skill 06_SPED_FISCAL.md
export interface SpedOptions {
  empresaId: string;
  periodo: { mes: number; ano: number };
  motivoInventario?: string;
}

export async function gerarSpedFiscal(_options: SpedOptions): Promise<string> {
  // TODO: implementar chamando os geradores de cada bloco
  // Ver skill 06_SPED_FISCAL.md para a implementação completa
  throw new Error('Não implementado — ver skill 06_SPED_FISCAL.md');
}
