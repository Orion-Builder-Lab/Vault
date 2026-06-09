import { z } from 'zod';

export const itemNotaSchema = z.object({
  produtoId: z.string().cuid(),
  ordem: z.number().int().min(1),
  quantidade: z.number().positive(),
  valorUnitario: z.number().int().positive(),
  valorDesconto: z.number().int().min(0).default(0),
  cfop: z.string().regex(/^\d{4}$/),
});

export const emitirNFeSchema = z.object({
  clienteId: z.string().cuid(),
  naturezaOperacao: z.string().min(3).max(60),
  dataSaida: z.coerce.date().optional(),
  modalidadeFrete: z.number().int().min(0).max(9).default(9),
  itens: z.array(itemNotaSchema).min(1),
  observacoes: z.string().max(500).optional(),
});

export const emitirNFSeSchema = z.object({
  clienteId: z.string().cuid(),
  codigoServico: z.string(),
  discriminacao: z.string().min(10).max(2000),
  dataCompetencia: z.coerce.date(),
  municipioPrestacao: z.string().length(7).optional(),
  itens: z.array(itemNotaSchema).min(1),
});

export const emitirLocacaoSchema = emitirNFSeSchema.extend({
  numeroContrato: z.string(),
  bemLocado: z.string(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
  localUtilizacao: z.string(),
});

export type EmitirNFeInput = z.infer<typeof emitirNFeSchema>;
export type EmitirNFSeInput = z.infer<typeof emitirNFSeSchema>;
export type EmitirLocacaoInput = z.infer<typeof emitirLocacaoSchema>;
