import { z } from "zod";
import { GenericStatus } from "@/constants/enums";

export const installmentPaymentSchema = z.object({
  aplazadoId: z.string().min(1),
  concepto: z.string().min(1).max(200),
  importeTotal: z.number().positive(),
  importePagado: z.number().min(0),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  cuotaMensual: z.number().positive(),
  categoria: z.string().max(100).optional(),
  cuentaOrigen: z.string().max(100).optional(),
  estado: z.enum([
    GenericStatus.ACTIVO,
    GenericStatus.PAUSADO,
    GenericStatus.COMPLETADO,
    GenericStatus.CANCELADO,
  ]),
  notas: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InstallmentPaymentInput = z.infer<typeof installmentPaymentSchema>;

export const installmentPaymentCreateSchema = installmentPaymentSchema.omit({
  aplazadoId: true,
  createdAt: true,
  updatedAt: true,
});

export type InstallmentPaymentCreateInput = z.infer<
  typeof installmentPaymentCreateSchema
>;

export const installmentPaymentUpdateSchema =
  installmentPaymentSchema.partial();

export type InstallmentPaymentUpdateInput = z.infer<
  typeof installmentPaymentUpdateSchema
>;

export const installmentPaymentSheetSchema = installmentPaymentSchema.omit({
  aplazadoId: true,
});
