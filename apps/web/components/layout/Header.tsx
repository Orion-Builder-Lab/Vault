'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { EmpresaSelector } from './EmpresaSelector';
import { useSigefSession } from '@/lib/use-session';

export function Header() {
  const { session } = useSigefSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#1A6EFF]/20 bg-[#0D1B3E] px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A6EFF]">
          <span className="text-xs font-bold text-white">S</span>
        </div>
        <span className="text-sm font-semibold tracking-wide text-white">SIGEF</span>
      </div>

      <div className="flex items-center gap-3">
        <EmpresaSelector />

        <div className="h-5 w-px bg-[#1A6EFF]/20" />

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((value) => !value)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white transition-colors hover:bg-[#1A6EFF]/10"
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#1A6EFF]/50 bg-[#1A6EFF]/30">
              <User size={12} className="text-[#4D9FFF]" />
            </div>
            <span className="max-w-[120px] truncate text-gray-300">{session?.nome ?? '...'}</span>
            <ChevronDown
              size={12}
              className={`text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[#1A6EFF]/30 bg-[#0D1B3E] shadow-2xl shadow-black/50">
                <div className="border-b border-[#1A6EFF]/20 px-3 py-3">
                  <p className="truncate text-sm font-medium text-white">{session?.nome}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{session?.email}</p>
                  <span className="mt-1.5 inline-block rounded-full border border-[#1A6EFF]/30 bg-[#1A6EFF]/20 px-2 py-0.5 text-xs text-[#4D9FFF]">
                    {session?.role}
                  </span>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-900/20"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
