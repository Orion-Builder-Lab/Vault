import { describe, it, expect } from 'vitest';
import { gerarBlocoH } from '../sped/blocos/bloco-h';

describe('Bloco H', () => {
  const itens = [
    { codItem: 'P001', unidade: 'UN', quantidade: 10, valorUnitario: 5000, valorTotal: 50000, indProp: '0' },
    { codItem: 'P002', unidade: 'KG', quantidade: 2.5, valorUnitario: 3000, valorTotal: 7500, indProp: '0' },
  ];

  it('gera estrutura com abertura e encerramento', () => {
    const bloco = gerarBlocoH(new Date('2024-12-31'), '05', itens);
    expect(bloco).toContain('|H001|1|');
    expect(bloco).toContain('|H005|31122024|');
    expect(bloco).toContain('|H010|P001|');
    expect(bloco).toContain('|H010|P002|');
    expect(bloco).toMatch(/\|H990\|\d+\|/);
  });

  it('gera H001 com indicador 0 quando sem itens', () => {
    const bloco = gerarBlocoH(new Date(), '05', []);
    expect(bloco).toContain('|H001|0|');
  });
});
