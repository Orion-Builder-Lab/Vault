// ─── Result Type (Functional Error Handling) ──────────────────────────────
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export const ok = <T>(data: T): Result<T> => ({ success: true, data });
export const err = <E = AppError>(error: E): Result<never, E> => ({ success: false, error });

// ─── App Errors ───────────────────────────────────────────────────────────
export type AppErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'BUSINESS_ERROR'
  | 'FISCAL_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface AppError {
  code: AppErrorCode;
  message: string;
  details?: unknown;
}

export const createError = (code: AppErrorCode, message: string, details?: unknown): AppError =>
  ({ code, message, details });

// ─── Pagination ───────────────────────────────────────────────────────────
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Auth Context ─────────────────────────────────────────────────────────
export interface AuthContext {
  userId: string;
  empresaId: string;
  role: 'admin' | 'financeiro' | 'faturamento' | 'almoxarife' | 'contador';
}

// ─── Money ────────────────────────────────────────────────────────────────
// Sempre em centavos (inteiros)
export type Centavos = number;
export const toCentavos = (reais: number): Centavos => Math.round(reais * 100);
export const toReais = (centavos: Centavos): number => centavos / 100;
export const formatBRL = (centavos: Centavos): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
