'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface EmpresaOption {
  id: string;
  nome: string;
  cnpj: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!email.includes('@') || !email.includes('.')) {
      setEmpresas([]);
      setEmpresaId('');
      return;
    }

    const timeout = setTimeout(async () => {
      setLoadingEmpresas(true);
      try {
        const res = await fetch(
          `${API_URL}/api/auth/empresas?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        setEmpresas(data.empresas ?? []);

        if (data.empresas?.length === 1) {
          setEmpresaId(data.empresas[0].id);
        }
      } catch {
        setEmpresas([]);
      } finally {
        setLoadingEmpresas(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [email]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!empresaId) {
      setErro('Selecione uma empresa');
      return;
    }

    setLoading(true);
    setErro('');

    const resultado = await signIn('credentials', {
      email,
      senha,
      empresaId,
      redirect: false,
    });

    setLoading(false);

    if (resultado?.error) {
      setErro('E-mail, senha ou empresa incorretos');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060D1F] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">SIGEF</h1>
          <p className="mt-1 text-sm text-[#4D9FFF]">Sistema Integrado de Gestão Fiscal</p>
          <p className="mt-1 text-xs text-gray-500">Orion Lab</p>
        </div>

        <div className="rounded-xl border border-[#1A6EFF]/30 bg-[#0D1B3E] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com.br"
                required
                className="w-full rounded-lg border border-[#1A6EFF]/30 bg-[#060D1F] px-3 py-2.5 text-sm text-white placeholder-gray-600 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1A6EFF]"
              />
            </div>

            {(empresas.length > 0 || loadingEmpresas) && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Empresa
                </label>
                {loadingEmpresas ? (
                  <div className="py-2 text-sm text-gray-500">Carregando...</div>
                ) : (
                  <select
                    value={empresaId}
                    onChange={(event) => setEmpresaId(event.target.value)}
                    required
                    className="w-full rounded-lg border border-[#1A6EFF]/30 bg-[#060D1F] px-3 py-2.5 text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#1A6EFF]"
                  >
                    <option value="">Selecione a empresa</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-[#1A6EFF]/30 bg-[#060D1F] px-3 py-2.5 text-sm text-white placeholder-gray-600 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1A6EFF]"
              />
            </div>

            {erro && (
              <div className="rounded-lg border border-red-900/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !empresaId}
              className="w-full rounded-lg bg-[#1A6EFF] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1560E0] focus:outline-none focus:ring-2 focus:ring-[#1A6EFF] focus:ring-offset-2 focus:ring-offset-[#0D1B3E] disabled:cursor-not-allowed disabled:bg-[#1A6EFF]/40"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
