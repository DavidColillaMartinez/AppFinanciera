import { z } from "zod";
import { ReserveMovementType } from "@/constants/enums";

export const reserveMovementSchema = z.object({
  id: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  reservaId: z.string().min(1),
  tipoMovimiento: z.enum([
    ReserveMovementType.APORTACION,
    ReserveMovementType.DISPOSICION,
  ]),
  importe: z.number().positive(),
  cuentaOrigen: z.string().max(100).optional().default(""),
  cuentaDestino: z.string().max(100).optional().default(""),
  notas: z.string().max(500).optional().default(""),
  createdAt: z.string(),
});

export type ReserveMovementInput = z.infer<typeof reserveMovementSchema>;

export const reserveMovementCreateSchema = reserveMovementSchema.omit({
  id: true,
  createdAt: true,
});

export type ReserveMovementCreateInput = z.infer<
  typeof reserveMovementCreateSchema
>;

export const reserveMovementUpdateSchema = reserveMovementSchema.partial();

export type ReserveMovementUpdateInput = z.infer<
  typeof reserveMovementUpdateSchema
>;
