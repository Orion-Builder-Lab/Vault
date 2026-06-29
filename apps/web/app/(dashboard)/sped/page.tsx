import { PageHeader } from '@/components/layout/PageHeader';
import { requireEmpresaComEstoque } from '@/lib/require-estoque';

export default async function SpedPage() {
  await requireEmpresaComEstoque();

  return (
    <div>
      <PageHeader
        title="SPED Fiscal"
        description="Geração e histórico dos arquivos fiscais."
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'SPED Fiscal' }]}
      />

      <div className="rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-6">
        <p className="text-center text-sm text-gray-500">
          SPED Fiscal será implementado nas tasks SPD.
        </p>
      </div>
    </div>
  );
}
