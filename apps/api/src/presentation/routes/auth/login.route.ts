import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@sigef/db';
import { loginSchema, trocarEmpresaSchema } from '@sigef/validators';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function loginRoutes(fastify: FastifyInstance) {
  fastify.post('/api/auth/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(422).send({
        error: 'Dados inválidos',
        details: body.error.flatten().fieldErrors,
      });
    }

    const { email, senha, empresaId } = body.data;

    const usuario = await prisma.usuario.findUnique({
      where: { email, ativo: true },
    });

    if (!usuario) {
      return reply.code(401).send({ error: 'E-mail ou senha incorretos' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaCorreta) {
      return reply.code(401).send({ error: 'E-mail ou senha incorretos' });
    }

    const acesso = await prisma.usuarioEmpresa.findUnique({
      where: { usuarioId_empresaId: { usuarioId: usuario.id, empresaId } },
      include: {
        empresa: { select: { nomeFantasia: true, razaoSocial: true } },
      },
    });

    if (!acesso) {
      return reply.code(403).send({ error: 'Sem acesso a esta empresa' });
    }

    const empresaNome = acesso.empresa.nomeFantasia ?? acesso.empresa.razaoSocial;

    return reply.code(200).send({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: acesso.role,
      empresaId,
      empresaNome,
    });
  });

  fastify.get<{ Querystring: { email: string } }>(
    '/api/auth/empresas',
    async (request, reply) => {
      const { email } = request.query;

      if (!email || !email.includes('@')) {
        return reply.code(400).send({ error: 'E-mail inválido' });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { email, ativo: true },
        include: {
          empresas: {
            include: {
              empresa: {
                select: {
                  id: true,
                  nomeFantasia: true,
                  razaoSocial: true,
                  cnpj: true,
                },
              },
            },
          },
        },
      });

      if (!usuario) {
        return reply.code(200).send({ empresas: [] });
      }

      return reply.code(200).send({
        empresas: usuario.empresas.map((ue: any) => ({
          id: ue.empresa.id,
          nome: ue.empresa.nomeFantasia ?? ue.empresa.razaoSocial,
          cnpj: ue.empresa.cnpj,
          role: ue.role,
        })),
      });
    }
  );

  fastify.post(
    '/api/auth/trocar-empresa',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = trocarEmpresaSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(422).send({ error: 'empresaId inválido' });
      }

      const { empresaId } = body.data;

      const acesso = await prisma.usuarioEmpresa.findUnique({
        where: {
          usuarioId_empresaId: {
            usuarioId: request.userId,
            empresaId,
          },
        },
        include: {
          empresa: { select: { nomeFantasia: true, razaoSocial: true } },
          usuario: { select: { nome: true, email: true } },
        },
      });

      if (!acesso) {
        return reply.code(403).send({ error: 'Sem acesso a esta empresa' });
      }

      const empresaNome = acesso.empresa.nomeFantasia ?? acesso.empresa.razaoSocial;
      const token = fastify.jwt.sign({
        userId: request.userId,
        empresaId,
        role: acesso.role,
        empresaNome,
        nome: acesso.usuario.nome,
        email: acesso.usuario.email,
      });

      return reply.code(200).send({ token });
    }
  );
}
