import { PageHeader } from '@/components/layout/PageHeader';

export default function CadastrosPage() {
  return (
    <div>
      <PageHeader
        title="Cadastros"
        description="Clientes, fornecedores, produtos e serviços."
        breadcrumb={[{ label: 'Dashboard', href: '/' }, { label: 'Cadastros' }]}
      />

      <div className="rounded-xl border border-[#1A6EFF]/20 bg-[#0D1B3E] p-6">
        <p className="text-center text-sm text-gray-500">
          Cadastros serão implementados nas tasks CAD.
        </p>
      </div>
    </div>
  );
}
