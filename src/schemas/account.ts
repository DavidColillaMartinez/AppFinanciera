import { z } from "zod";
import { AccountType } from "@/constants/enums";

export const accountSchema = z.object({
  cuentaId: z.string().min(1),
  nombre: z.string().min(1).max(100),
  tipo: z.enum([
    AccountType.BANCO,
    AccountType.EFECTIVO,
    AccountType.VIRTUAL,
    AccountType.OTRO,
  ]),
  moneda: z.string().length(3),
  saldoInicial: z.number(),
  saldoActualManual: z.number(),
  incluirDashboard: z.enum(["S", "N"]),
  activo: z.enum(["S", "N"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex valido"),
  notas: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AccountInput = z.infer<typeof accountSchema>;

export const accountCreateSchema = accountSchema.omit({
  cuentaId: true,
  createdAt: true,
  updatedAt: true,
});

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;

export const accountUpdateSchema = accountSchema.partial();

export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;

export const accountSheetSchema = accountSchema.omit({
  cuentaId: true,
});
