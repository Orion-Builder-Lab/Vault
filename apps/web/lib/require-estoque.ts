import { redirect } from 'next/navigation';
import { PrismaClient } from '@sigef/db';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function requireEmpresaComEstoque() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: session.user.empresaId },
    select: { hasEstoque: true },
  });

  if (!empresa?.hasEstoque) {
    redirect('/');
  }
}
