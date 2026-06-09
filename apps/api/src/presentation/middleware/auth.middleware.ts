import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '@sigef/db';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    empresaId: string;
    role: Role;
  }
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    const payload = request.user as { userId: string; empresaId: string; role: Role };
    request.userId = payload.userId;
    request.empresaId = payload.empresaId;
    request.role = payload.role;
  } catch {
    reply.code(401).send({ error: 'Token inválido ou expirado' });
  }
};

export const requireRole = (...roles: Role[]) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(request.role)) {
      reply.code(403).send({ error: 'Sem permissão para esta operação' });
    }
  };

export const requireEstoque = async (request: FastifyRequest, reply: FastifyReply) => {
  // Verificar se empresa tem estoque habilitado
  // Implementação completa na skill 04_ESTOQUE_COMPRAS.md
};
