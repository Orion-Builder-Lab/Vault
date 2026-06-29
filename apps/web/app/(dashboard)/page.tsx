import { PageHeader } from '@/components/layout/PageHeader';
import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Bem-vindo, ${session?.user?.nome?.split(' ')[0] ?? 'usuário'}`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Saldo atual', valor: '-', cor: 'text-white' },
          { label: 'A receber (30d)', valor: '-', cor: 'text-emerald-400' },
          { label: 'A pagar (30d)', valor: '-', cor: 'text-red-400' },
          { label: 'Resultado mês', valor: '-', cor: 'text-[#4D9FFF]' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-4"
          >
            <p className="mb-1 text-xs uppercase tracking-wider text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.cor}`}>{card.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-6">
        <p className="text-center text-sm text-gray-500">
          Dashboard completo será implementado na task FIN-03
        </p>
      </div>
    </div>
  );
}
