import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      userId: string;
      nome: string;
      role: 'admin' | 'financeiro' | 'faturamento' | 'almoxarife' | 'contador';
      empresaId: string;
      empresaNome: string;
    };
  }
}
