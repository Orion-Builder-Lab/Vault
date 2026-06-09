import { z } from 'zod';
import { validarCNPJ } from './cnpj';

export const empresaSchema = z.object({
  razaoSocial: z.string().min(3).max(150),
  nomeFantasia: z.string().max(60).optional(),
  cnpj: z.string().regex(/^\d{14}$/).refine(validarCNPJ, 'CNPJ inválido'),
  inscricaoEstadual: z.string().max(20).optional(),
  inscricaoMunicipal: z.string().max(20).optional(),
  regimeTributario: z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']),
  hasEstoque: z.boolean(),
  cep: z.string().regex(/^\d{8}$/),
  logradouro: z.string().min(3).max(60),
  numero: z.string().max(10),
  complemento: z.string().max(60).optional(),
  bairro: z.string().max(60),
  municipio: z.string().max(60),
  uf: z.string().length(2),
  codigoMunicipio: z.string().length(7),
  cnae: z.string().max(10).optional(),
  telefone: z.string().max(15).optional(),
  email: z.string().email().optional(),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
