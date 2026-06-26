import { PageHeader } from '@/components/layout/PageHeader';

export default function FinanceiroPage() {
  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Contas, fluxo de caixa e conciliação."
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Financeiro' }]}
      />

      <div className="rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-6">
        <p className="text-center text-sm text-gray-500">
          Financeiro será implementado nas tasks FIN.
        </p>
      </div>
    </div>
  );
}
