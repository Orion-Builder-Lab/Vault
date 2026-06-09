export class FocusNfeClient {
  private baseUrl: string;
  private token: string;

  constructor(token: string, baseUrl: string) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.token}:`).toString('base64')}`;
  }

  private async request<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Focus NFe error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  emitirNFe(ref: string, payload: object) {
    return this.request('POST', `/v2/nfe?ref=${ref}`, payload);
  }

  consultarNFe(ref: string) {
    return this.request('GET', `/v2/nfe/${ref}`);
  }

  cancelarNFe(ref: string, justificativa: string) {
    return this.request('DELETE', `/v2/nfe/${ref}`, { justificativa });
  }

  emitirNFSe(ref: string, payload: object) {
    return this.request('POST', `/v2/nfse?ref=${ref}`, payload);
  }

  consultarNFSe(ref: string) {
    return this.request('GET', `/v2/nfse/${ref}`);
  }

  cancelarNFSe(ref: string) {
    return this.request('DELETE', `/v2/nfse/${ref}`);
  }
}
