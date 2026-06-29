import type { FocusNfePort } from '../../../domain/ports/fiscal/focus-nfe.port';

export class FocusNfeClient implements FocusNfePort {
  private get baseUrl(): string {
    return process.env.FOCUS_NFE_BASE_URL ?? 'https://homologacao.focusnfe.com.br';
  }

  private get token(): string {
    return process.env.FOCUS_NFE_TOKEN ?? '';
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.token}:`).toString('base64')}`;
  }

  private async req<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`FocusNFe HTTP ${res.status}: ${text}`);
    try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
  }

  emitirNFe(ref: string, payload: object) { return this.req('POST', `/v2/nfe?ref=${ref}`, payload); }
  consultarNFe(ref: string) { return this.req('GET', `/v2/nfe/${ref}`); }
  cancelarNFe(ref: string, justificativa: string) { return this.req('DELETE', `/v2/nfe/${ref}`, { justificativa }); }
  emitirNFSe(ref: string, payload: object) { return this.req('POST', `/v2/nfse?ref=${ref}`, payload); }
  consultarNFSe(ref: string) { return this.req('GET', `/v2/nfse/${ref}`); }
  cancelarNFSe(ref: string) { return this.req('DELETE', `/v2/nfse/${ref}`); }

  async testarConexao(): Promise<{ ok: boolean; ambiente: string; mensagem?: string }> {
    const ambiente = this.baseUrl.includes('homologacao') ? 'homologação' : 'produção';
    try {
      const res = await fetch(`${this.baseUrl}/v2/nfe/sigef-health-check`, {
        method: 'GET',
        headers: { Authorization: this.authHeader },
      });
      if (res.status === 404 || res.status === 200) return { ok: true, ambiente };
      return { ok: false, ambiente, mensagem: `Token inválido ou sem permissão (HTTP ${res.status})` };
    } catch (e) {
      return { ok: false, ambiente, mensagem: `Erro de conexão: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
}

export const focusNfeClient = new FocusNfeClient();