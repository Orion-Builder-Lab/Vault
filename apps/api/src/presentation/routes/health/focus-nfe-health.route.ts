import type { FastifyInstance } from 'fastify';
import { focusNfeClient } from '../../../infrastructure/external/focus-nfe/focus-nfe.client';

export async function focusNfeHealthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/health/focus-nfe', async (_request, reply) => {
    const inicio = Date.now();
    const resultado = await focusNfeClient.testarConexao();
    const latenciaMs = Date.now() - inicio;

    return reply.code(resultado.ok ? 200 : 503).send({
      servico: 'Focus NFe',
      status: resultado.ok ? 'ok' : 'erro',
      ambiente: resultado.ambiente,
      latenciaMs,
      baseUrl: process.env.FOCUS_NFE_BASE_URL,
      tokenConfigurado: !!process.env.FOCUS_NFE_TOKEN,
      ...(resultado.mensagem ? { mensagem: resultado.mensagem } : {}),
      timestamp: new Date().toISOString(),
    });
  });
}
