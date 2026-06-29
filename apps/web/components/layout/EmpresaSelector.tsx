'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useSigefSession } from '@/lib/use-session';
import type { Role } from '@/lib/nav-items';

interface EmpresaOption {
  id: string;
  nome: string;
  cnpj: string;
  role: Role;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function EmpresaSelector() {
  const { session, updateEmpresa } = useSigefSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  async function handleOpen() {
    if (!open && empresas.length === 0 && session?.email) {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/auth/empresas?email=${encodeURIComponent(session.email)}`
        );
        const data = await res.json();
        setEmpresas(data.empresas ?? []);
      } finally {
        setLoading(false);
      }
    }

    setOpen((value) => !value);
  }

  async function handleTrocar(empresa: EmpresaOption) {
    if (empresa.id === session?.empresaId) {
      setOpen(false);
      return;
    }

    setSwitchingId(empresa.id);
    try {
      await updateEmpresa({
        empresaId: empresa.id,
        empresaNome: empresa.nome,
        role: empresa.role,
      });
      setOpen(false);
      router.push('/');
      router.refresh();
    } finally {
      setSwitchingId(null);
    }
  }

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg border border-[#1A6EFF]/30 bg-[#0D1B3E] px-3 py-1.5 text-sm font-medium text-white transition-all hover:border-[#1A6EFF]/60 hover:bg-[#1A2F5E] focus:outline-none focus:ring-2 focus:ring-[#1A6EFF]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Building2 size={14} className="text-[#4D9FFF]" />
        <span className="max-w-[160px] truncate">{session.empresaNome}</span>
        <ChevronDown
          size={14}
          className={`text-[#4D9FFF] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div
            className="absolute left-0 z-20 mt-1 w-64 overflow-hidden rounded-xl border border-[#1A6EFF]/30 bg-[#0D1B3E] shadow-2xl shadow-black/50"
            role="listbox"
          >
            <div className="border-b border-[#1A6EFF]/20 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wider text-[#4D9FFF]">
                Trocar empresa
              </p>
            </div>

            {loading ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                Carregando...
              </div>
            ) : (
              <ul className="py-1">
                {empresas.map((empresa) => (
                  <li key={empresa.id}>
                    <button
                      onClick={() => handleTrocar(empresa)}
                      disabled={switchingId === empresa.id}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-[#1A6EFF]/20 disabled:cursor-wait disabled:opacity-70"
                      role="option"
                      aria-selected={empresa.id === session.empresaId}
                    >
                      <Building2 size={14} className="flex-shrink-0 text-[#4D9FFF]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{empresa.nome}</p>
                        <p className="font-mono text-xs text-gray-500">
                          {formatCnpj(empresa.cnpj)}
                        </p>
                      </div>
                      {empresa.id === session.empresaId && (
                        <Check size={14} className="flex-shrink-0 text-[#1A6EFF]" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
