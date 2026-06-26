'use client';

import { useSession } from 'next-auth/react';
import type { Role } from '@/lib/nav-items';

export type SigefSession = {
  userId: string;
  nome: string;
  email: string;
  role: Role;
  empresaId: string;
  empresaNome: string;
};

export function useSigefSession() {
  const { data: session, status, update } = useSession();

  return {
    session: session?.user as SigefSession | undefined,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    updateEmpresa: (empresa: { empresaId: string; empresaNome: string; role: Role }) =>
      update(empresa),
  };
}
