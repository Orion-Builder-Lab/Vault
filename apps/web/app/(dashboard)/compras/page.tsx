import { PageHeader } from '@/components/layout/PageHeader';
import { requireEmpresaComEstoque } from '@/lib/require-estoque';

export default async function ComprasPage() {
  await requireEmpresaComEstoque();

  return (
    <div>
      <PageHeader
        title="Compras"
        description="Notas de compra, entradas e parcelas."
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Compras' }]}
      />

      <div className="rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-6">
        <p className="text-center text-sm text-gray-500">
          Compras serão implementadas nas tasks EST.
        </p>
      </div>
    </div>
  );
}
