import { PageHeader } from '@/components/layout/PageHeader';

export default function FaturamentoPage() {
  return (
    <div>
      <PageHeader
        title="Faturamento"
        description="Emissão e consulta de notas fiscais."
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Faturamento' }]}
      />

      <div className="rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-6">
        <p className="text-center text-sm text-gray-500">
          Faturamento será implementado nas tasks FAT.
        </p>
      </div>
    </div>
  );
}
