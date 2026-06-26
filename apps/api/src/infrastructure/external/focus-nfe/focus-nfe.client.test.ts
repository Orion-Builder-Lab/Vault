import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusNfeClient } from './focus-nfe.client';
import { gerarRef } from './ref-generator';

describe('FocusNfeClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('FOCUS_NFE_TOKEN', 'token_teste');
    vi.stubEnv('FOCUS_NFE_BASE_URL', 'https://homologacao.focusnfe.com.br');
  });

  it('monta o header de autenticacao corretamente', () => {
    const client = new FocusNfeClient();
    // @ts-expect-error acessa membro privado para validar o contrato de autenticacao.
    const header = client.authHeader;

    expect(header).toBe(`Basic ${Buffer.from('token_teste:').toString('base64')}`);
  });

  it('identifica ambiente de homologacao', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 404,
        text: async () => '{"status":"erro","erros":[{"codigo":"nfe_nao_encontrada"}]}',
        ok: false,
      })
    );

    const client = new FocusNfeClient();
    const resultado = await client.testarConexao();

    expect(resultado.ok).toBe(true);
    expect(resultado.ambiente).toBe('homologação');
  });

  it('retorna ok false quando token e invalido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 401,
        text: async () => 'Unauthorized',
        ok: false,
      })
    );

    const client = new FocusNfeClient();
    const resultado = await client.testarConexao();

    expect(resultado.ok).toBe(false);
    expect(resultado.mensagem).toContain('401');
  });

  it('gera ref unica para cada chamada', () => {
    const ref1 = gerarRef('empresa-id-123');
    const ref2 = gerarRef('empresa-id-123');

    expect(ref1).not.toBe(ref2);
    expect(ref1).toMatch(/^a-id-123-\d{13}-[a-f0-9]{8}$/);
  });
});
