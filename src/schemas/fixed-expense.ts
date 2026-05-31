import { z } from "zod";
import { Frequency } from "@/constants/enums";

export const fixedExpenseSchema = z.object({
  fijoId: z.string().min(1),
  concepto: z.string().min(1).max(200),
  categoria: z.string().max(100).optional().default(""),
  importe: z.number().positive(),
  frecuencia: z.enum([
    Frequency.MENSUAL,
    Frequency.ANUAL,
    Frequency.TRIMESTRAL,
    Frequency.UNICO,
  ]),
  diaCargo: z.number().int().min(1).max(31),
  cuentaOrigen: z.string().max(100).optional().default(""),
  activo: z.enum(["S", "N"]),
  fechaInicio: z.string().optional().default(""),
  fechaFin: z.string().optional().default(""),
  notas: z.string().max(500).optional().default(""),
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
