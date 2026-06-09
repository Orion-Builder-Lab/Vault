import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// Plugins de segurança
app.register(helmet, { global: true });
app.register(cors, {
  origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  credentials: true,
});
app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// TODO: Registrar rotas dos módulos
// app.register(cadastrosRoutes, { prefix: '/api/cadastros' });
// app.register(faturamentoRoutes, { prefix: '/api/faturamento' });
// app.register(estoqueRoutes, { prefix: '/api/estoque' });
// app.register(financeiroRoutes, { prefix: '/api/financeiro' });
// app.register(spedRoutes, { prefix: '/api/sped' });

const PORT = parseInt(process.env.PORT ?? '3001');
const HOST = process.env.HOST ?? '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  app.log.info(`API rodando em http://${HOST}:${PORT}`);
});

export default app;
