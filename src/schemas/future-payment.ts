import { z } from "zod";
import { Frequency } from "@/constants/enums";

export const futurePaymentSchema = z.object({
  pagoId: z.string().min(1),
  concepto: z.string().min(1).max(200),
  categoria: z.string().max(100).optional().default(""),
  importeObjetivo: z.number().positive(),
  fechaVencimiento: z.string().optional().default(""),
  frecuencia: z.enum([
    Frequency.MENSUAL,
    Frequency.ANUAL,
    Frequency.TRIMESTRAL,
    Frequency.UNICO,
  ]),
  cuentaReserva: z.string().max(100).optional().default(""),
  activo: z.enum(["S", "N"]),
  saldoReservado: z.number().min(0),
  mesesRestantes: z.number().int().min(0).optional(),
  aporteMensual: z.number().positive().optional(),
  notas: z.string().max(500).optional().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FuturePaymentInput = z.infer<typeof futurePaymentSchema>;

export const futurePaymentCreateSchema = futurePaymentSchema.omit({
  pagoId: true,
  createdAt: true,
  updatedAt: true,
  mesesRestantes: true,
  aporteMensual: true,
});

export type FuturePaymentCreateInput = z.infer<
  typeof futurePaymentCreateSchema
>;

export const futurePaymentUpdateSchema = futurePaymentSchema.partial();

export type FuturePaymentUpdateInput = z.infer<
  typeof futurePaymentUpdateSchema
>;
