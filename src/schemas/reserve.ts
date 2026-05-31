import { z } from "zod";
import { ReserveType, Priority } from "@/constants/enums";

export const reserveSchema = z.object({
  reservaId: z.string().min(1),
  nombre: z.string().min(1).max(200),
  tipo: z.enum([
    ReserveType.IMPREVISTOS,
    ReserveType.EMERGENCIA,
    ReserveType.PAGO_FUTURO,
    ReserveType.OBJETIVO,
    ReserveType.OTRO,
  ]),
  importeObjetivo: z.number().min(0),
  saldoActual: z.number().min(0),
  aporteMensualSugerido: z.number().min(0),
  cuentaFisica: z.string().max(100).optional(),
  activo: z.enum(["S", "N"]),
  prioridad: z.enum([Priority.ALTA, Priority.MEDIA, Priority.BAJA]),
  notas: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ReserveInput = z.infer<typeof reserveSchema>;

export const reserveCreateSchema = reserveSchema.omit({
  reservaId: true,
  createdAt: true,
  updatedAt: true,
});

export type ReserveCreateInput = z.infer<typeof reserveCreateSchema>;

export const reserveUpdateSchema = reserveSchema.partial();

export type ReserveUpdateInput = z.infer<typeof reserveUpdateSchema>;

export const reserveSheetSchema = reserveSchema.omit({
  reservaId: true,
});
