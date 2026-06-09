import { describe, it, expect } from 'vitest';
import { calcularTributosSimples } from '../calculadora/simples-nacional';
import { calcularTributosLucroPresumido } from '../calculadora/lucro-presumido';

describe('Simples Nacional', () => {
  it('retorna tributos zerados para CSOSN 400', () => {
    const r = calcularTributosSimples({ valorTotal: 100000, csosn: '400', temST: false });
    expect(r.valorIcms).toBe(0);
    expect(r.valorPis).toBe(0);
    expect(r.valorCofins).toBe(0);
  });
});

describe('Lucro Presumido', () => {
  it('calcula ISS de 5%', () => {
    expect(calcularTributosLucroPresumido(100000, 500).valorIss).toBe(5000);
  });
  it('calcula PIS de 0,65%', () => {
    expect(calcularTributosLucroPresumido(100000, 500).valorPis).toBe(650);
  });
  it('calcula COFINS de 3%', () => {
    expect(calcularTributosLucroPresumido(100000, 500).valorCofins).toBe(3000);
  });
});
