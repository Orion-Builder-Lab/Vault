import { PrismaClient } from './generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Empresa: Múltipla Gestão
  const multipla = await prisma.empresa.upsert({
    where: { cnpj: '00000000000191' },
    update: {},
    create: {
      razaoSocial: 'Múltipla Gestão LTDA',
      nomeFantasia: 'Múltipla',
      cnpj: '00000000000191',
      regimeTributario: 'LUCRO_PRESUMIDO',
      hasEstoque: false,
      cep: '88010000',
      logradouro: 'Rua Felipe Schmidt',
      numero: '100',
      bairro: 'Centro',
      municipio: 'Florianópolis',
      uf: 'SC',
      codigoMunicipio: '4205407',
      email: 'contato@multipla.com.br',
    },
  });

  // Empresa: Enfratec
  const enfratec = await prisma.empresa.upsert({
    where: { cnpj: '00000000000273' },
    update: {},
    create: {
      razaoSocial: 'Enfratec LTDA',
      nomeFantasia: 'Enfratec',
      cnpj: '00000000000273',
      regimeTributario: 'SIMPLES_NACIONAL',
      hasEstoque: true,
      cep: '88010000',
      logradouro: 'Rua Trajano',
      numero: '200',
      bairro: 'Centro',
      municipio: 'Florianópolis',
      uf: 'SC',
      codigoMunicipio: '4205407',
      email: 'contato@enfratec.com.br',
    },
  });

  // Usuário admin
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@orionlab.com.br' },
    update: {},
    create: {
      nome: 'Admin Orion Lab',
      email: 'admin@orionlab.com.br',
      senhaHash,
    },
  });

  // Dar acesso admin às duas empresas
  await prisma.usuarioEmpresa.createMany({
    skipDuplicates: true,
    data: [
      { usuarioId: admin.id, empresaId: multipla.id, role: 'admin' },
      { usuarioId: admin.id, empresaId: enfratec.id, role: 'admin' },
    ],
  });

  // Sicredi SC como cliente de ambas
  for (const empresaId of [multipla.id, enfratec.id]) {
    await prisma.clienteFornecedor.upsert({
      where: { id: `sicredi-${empresaId}` },
      update: {},
      create: {
        id: `sicredi-${empresaId}`,
        empresaId,
        tipo: ['CLIENTE'],
        tipoPessoa: 'PJ',
        razaoSocial: 'Sicredi – SC',
        cnpj: '01181521000155',
        uf: 'SC',
        municipio: 'Florianópolis',
        codigoMunicipio: '4205407',
        email: 'financeiro@sicredisc.com.br',
      },
    });
  }

  console.log('✅ Seed concluído!');
  console.log('   Login: admin@orionlab.com.br / admin123');
  console.log('   Empresas: Múltipla + Enfratec');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
