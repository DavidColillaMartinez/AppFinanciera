import { z } from "zod";
import { TransactionType } from "@/constants/enums";

export const transactionSchema = z.object({
  id: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  mesClave: z.string().regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM"),
  concepto: z.string().min(1).max(200),
  tipo: z.enum([
    TransactionType.INGRESO,
    TransactionType.GASTO,
    TransactionType.AHORRO,
    TransactionType.TRANSFERENCIA_INTERNA,
  ]),
  categoria: z.string().min(1).max(100),
  importe: z.number().positive("Importe debe ser positivo"),
  metodo: z.string().max(50).optional(),
  cuentaOrigen: z.string().max(100).optional(),
  cuentaDestino: z.string().max(100).optional(),
  notas: z.string().max(500).optional(),
  reservaId: z.string().max(100).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const transactionCreateSchema = transactionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  mesClave: true,
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;

export const transactionSheetSchema = transactionSchema.omit({
  id: true,
});

export const transactionUpdateSchema = transactionSchema.partial();

export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
