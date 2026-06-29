export interface FocusNfePort {
  emitirNFe(ref: string, payload: object): Promise<unknown>;
  consultarNFe(ref: string): Promise<unknown>;
  cancelarNFe(ref: string, justificativa: string): Promise<unknown>;

  emitirNFSe(ref: string, payload: object): Promise<unknown>;
  consultarNFSe(ref: string): Promise<unknown>;
  cancelarNFSe(ref: string): Promise<unknown>;

  testarConexao(): Promise<{ ok: boolean; ambiente: string; mensagem?: string }>;
}
