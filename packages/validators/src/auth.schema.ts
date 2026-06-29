import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  empresaId: z.string().cuid('Empresa inválida'),
});

export const trocarEmpresaSchema = z.object({
  empresaId: z.string().cuid('Empresa inválida'),
});

export type LoginInput = z.infer<typeof loginSchema>;
