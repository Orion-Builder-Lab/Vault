import { randomBytes } from 'node:crypto';

/**
 * Gera uma referencia unica para uma nota fiscal.
 * A ref deve ser salva no banco antes da chamada para a Focus NFe.
 */
export function gerarRef(empresaId: string): string {
  const idCurto = empresaId.slice(-8);
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  return `${idCurto}-${timestamp}-${random}`;
}
