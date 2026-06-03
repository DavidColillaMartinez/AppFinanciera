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
  deletedAt: z.string().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const transactionCreateSchema = transactionSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    mesClave: true,
  })
  .extend({
    concepto: z.string().max(200).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === TransactionType.INGRESO) {
      if (!data.cuentaDestino || data.cuentaDestino.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaDestino"],
          message: "La cuenta destino es obligatoria",
        });
      }
    }
    if (data.tipo === TransactionType.GASTO) {
      if (!data.cuentaOrigen || data.cuentaOrigen.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaOrigen"],
          message: "La cuenta origen es obligatoria",
        });
      }
      if (!data.metodo || data.metodo.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metodo"],
          message: "El metodo de pago es obligatorio",
        });
      }
    }
    if (data.tipo === TransactionType.TRANSFERENCIA_INTERNA) {
      if (!data.cuentaOrigen || data.cuentaOrigen.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaOrigen"],
          message: "La cuenta origen es obligatoria",
        });
      }
      if (!data.cuentaDestino || data.cuentaDestino.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaDestino"],
          message: "La cuenta destino es obligatoria",
        });
      }
      if (
        data.cuentaOrigen &&
        data.cuentaDestino &&
        data.cuentaOrigen === data.cuentaDestino
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaDestino"],
          message: "La cuenta destino no puede ser la misma que la de origen",
        });
      }
    }
  });

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;

export const transactionUpdateSchema = transactionSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    mesClave: true,
  })
  .extend({
    categoria: z.string().max(100).optional(),
    concepto: z.string().max(200).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === TransactionType.INGRESO) {
      if (!data.cuentaDestino || data.cuentaDestino.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaDestino"],
          message: "La cuenta destino es obligatoria",
        });
      }
    }
    if (data.tipo === TransactionType.GASTO) {
      if (!data.cuentaOrigen || data.cuentaOrigen.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaOrigen"],
          message: "La cuenta origen es obligatoria",
        });
      }
      if (!data.metodo || data.metodo.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metodo"],
          message: "El metodo de pago es obligatorio",
        });
      }
    }
    if (data.tipo === TransactionType.TRANSFERENCIA_INTERNA) {
      if (!data.cuentaOrigen || data.cuentaOrigen.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaOrigen"],
          message: "La cuenta origen es obligatoria",
        });
      }
      if (!data.cuentaDestino || data.cuentaDestino.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cuentaDestino"],
          message: "La cuenta destino es obligatoria",
        });
      }
    }
  });

export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;

export const transactionSheetSchema = transactionSchema;

export type TransactionSheetRow = z.infer<typeof transactionSheetSchema>;
