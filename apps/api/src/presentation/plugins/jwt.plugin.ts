import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@sigef/db';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    empresaId: string;
    role: Role;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      empresaId: string;
      role: Role;
      nome: string;
      email: string;
      empresaNome: string;
    };
  }
}

export const jwtPlugin = fp(async (fastify) => {
  fastify.register(jwt, {
    secret: process.env.NEXTAUTH_SECRET!,
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        request.userId = request.user.userId;
        request.empresaId = request.user.empresaId;
        request.role = request.user.role;
      } catch {
        reply.code(401).send({ error: 'Token inválido ou expirado' });
      }
    }
  );
});
