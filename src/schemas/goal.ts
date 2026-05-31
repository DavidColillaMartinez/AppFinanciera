import { z } from "zod";
import { GoalType, Priority, GenericStatus } from "@/constants/enums";

export const goalSchema = z.object({
  objetivoId: z.string().min(1),
  nombre: z.string().min(1).max(200),
  tipo: z.enum([
    GoalType.SEGURIDAD,
    GoalType.VACACIONES,
    GoalType.EMERGENCIA,
    GoalType.VEHICULO,
    GoalType.HOGAR,
    GoalType.OTRO,
  ]),
  cuentaAhorro: z.string().max(100).optional(),
  importeObjetivo: z.number().positive(),
  fechaObjetivo: z.string().optional(),
  prioridad: z.enum([Priority.ALTA, Priority.MEDIA, Priority.BAJA]),
  saldoActual: z.number().min(0),
  mesesRestantes: z.number().int().min(0).optional(),
  aporteMensual: z.number().positive().optional(),
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

export type GoalInput = z.infer<typeof goalSchema>;

export const goalCreateSchema = goalSchema.omit({
  objetivoId: true,
  createdAt: true,
  updatedAt: true,
  mesesRestantes: true,
  aporteMensual: true,
});

export type GoalCreateInput = z.infer<typeof goalCreateSchema>;

export const goalUpdateSchema = goalSchema.partial();

export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;

export const goalSheetSchema = goalSchema.omit({
  objetivoId: true,
});
