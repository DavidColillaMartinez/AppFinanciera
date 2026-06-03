import { z } from "zod";
import { CategoryType } from "@/constants/enums";

export const categorySchema = z.object({
  categoriaId: z.string().min(1),
  nombre: z.string().min(1).max(100),
  presupuestoMensual: z.number().min(0),
  tipoHabitual: z.enum([CategoryType.INGRESO, CategoryType.GASTO, CategoryType.AHORRO]),
  activo: z.enum(["S", "N"]),
  grupo: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex valido"),
  icono: z.string().max(50).optional(),
  orden: z.number().int().min(0),
  notas: z.string().max(500).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const categoryCreateSchema = categorySchema.omit({
  categoriaId: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const categorySheetSchema = categorySchema.omit({
  categoriaId: true,
});

export const categoryUpdateSchema = categorySchema.partial();

export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
