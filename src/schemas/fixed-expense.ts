import { z } from "zod";
import { Frequency } from "@/constants/enums";

export const fixedExpenseSchema = z.object({
  fijoId: z.string().min(1),
  concepto: z.string().min(1).max(200),
  categoria: z.string().max(100).optional(),
  importe: z.number().positive(),
  frecuencia: z.enum([
    Frequency.MENSUAL,
    Frequency.ANUAL,
    Frequency.TRIMESTRAL,
    Frequency.UNICO,
  ]),
  diaCargo: z.number().int().min(1).max(31),
  cuentaOrigen: z.string().max(100).optional(),
  activo: z.enum(["S", "N"]),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  notas: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FixedExpenseInput = z.infer<typeof fixedExpenseSchema>;

export const fixedExpenseCreateSchema = fixedExpenseSchema.omit({
  fijoId: true,
  createdAt: true,
  updatedAt: true,
});

export type FixedExpenseCreateInput = z.infer<typeof fixedExpenseCreateSchema>;

export const fixedExpenseUpdateSchema = fixedExpenseSchema.partial();

export type FixedExpenseUpdateInput = z.infer<typeof fixedExpenseUpdateSchema>;

export const fixedExpenseSheetSchema = fixedExpenseSchema.omit({
  fijoId: true,
});
