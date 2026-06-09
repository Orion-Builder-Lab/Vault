import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'SIGEF', template: '%s | SIGEF — Orion Lab' },
  description: 'Sistema Integrado de Gestão Fiscal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
