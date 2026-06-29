import { redirect } from 'next/navigation';
import { PrismaClient } from '@sigef/db';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  let hasEstoque = false;
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: session.user.empresaId },
      select: { hasEstoque: true },
    });
    hasEstoque = empresa?.hasEstoque ?? false;
  } catch {
    hasEstoque = false;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#060D1F]">
      <Header />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar hasEstoque={hasEstoque} />

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
