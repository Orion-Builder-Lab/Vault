import { z } from 'zod';

export const produtoSchema = z.object({
  codigo: z.string().min(1).max(60),
  descricao: z.string().min(2).max(120),
  tipo: z.enum(['PRODUTO', 'SERVICO']),
  ncm: z.string().regex(/^\d{8}$/).optional(),
  cest: z.string().regex(/^\d{7}$/).optional(),
  cfopPadrao: z.string().regex(/^\d{4}$/).optional(),
  cstIcms: z.string().max(3).optional(),
  unidade: z.string().min(1).max(6),
  ean: z.string().optional(),
  aliquotaIss: z.number().int().min(0).max(500).optional(),
  codigoServico: z.string().optional(),
  aliquotaPis: z.number().int().min(0).optional(),
  aliquotaCofins: z.number().int().min(0).optional(),
  temST: z.boolean().default(false),
  precoCusto: z.number().int().min(0).optional(),
  precoVenda: z.number().int().min(0),
  estoqueMinimo: z.number().min(0).optional(),
}).refine((d) => d.tipo === 'PRODUTO' ? !!d.ncm : true, {
  message: 'NCM é obrigatório para produtos físicos',
  path: ['ncm'],
}).refine((d) => d.tipo === 'SERVICO' ? d.aliquotaIss !== undefined : true, {
  message: 'Alíquota ISS é obrigatória para serviços',
  path: ['aliquotaIss'],
});

export type ProdutoInput = z.infer<typeof produtoSchema>;
