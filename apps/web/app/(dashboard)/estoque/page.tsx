import { PageHeader } from '@/components/layout/PageHeader';
import { requireEmpresaComEstoque } from '@/lib/require-estoque';

export default async function EstoquePage() {
  await requireEmpresaComEstoque();

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Produtos, saldos e movimentações."
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Estoque' }]}
      />

      <div className="rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-6">
        <p className="text-center text-sm text-gray-500">
          Estoque será implementado nas tasks EST.
        </p>
      </div>
    </div>
  );
}
