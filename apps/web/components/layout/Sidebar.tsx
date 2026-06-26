'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { filterNavItems } from '@/lib/nav-items';
import { useSigefSession } from '@/lib/use-session';

interface SidebarProps {
  hasEstoque: boolean;
}

export function Sidebar({ hasEstoque }: SidebarProps) {
  const { session } = useSigefSession();
  const pathname = usePathname();

  if (!session) return null;

  const items = filterNavItems(session.role, hasEstoque);

  return (
    <aside className="flex w-56 min-h-0 flex-shrink-0 flex-col border-r border-[#1A6EFF]/20 bg-[#0D1B3E]">
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'border border-[#1A6EFF]/40 bg-[#1A6EFF]/20 text-white'
                  : 'text-gray-400 hover:bg-[#1A6EFF]/10 hover:text-white'
              }`}
            >
              <Icon
                size={16}
                className={`flex-shrink-0 transition-colors ${
                  isActive ? 'text-[#1A6EFF]' : 'text-gray-500 group-hover:text-[#4D9FFF]'
                }`}
              />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto h-4 w-1 rounded-full bg-[#1A6EFF]" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1A6EFF]/20 px-3 py-3">
        <p className="truncate text-xs text-gray-600">{session.empresaNome}</p>
        <span className="text-xs text-[#4D9FFF]">
          {hasEstoque ? 'Simples Nacional' : 'Lucro Presumido'}
        </span>
      </div>
    </aside>
  );
}
