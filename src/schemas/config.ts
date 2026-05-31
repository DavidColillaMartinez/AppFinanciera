import { z } from "zod";

export const configSchema = z.object({
  Clave: z.string().min(1),
  Valor: z.string(),
  Descripcion: z.string().optional().default(""),
});

export type ConfigRow = z.infer<typeof configSchema>;

export const configCreateSchema = configSchema;

export type ConfigCreateInput = z.infer<typeof configCreateSchema>;

export const configUpdateSchema = z.object({
  Clave: z.string().min(1),
  Valor: z.string(),
});

export type ConfigUpdateInput = z.infer<typeof configUpdateSchema>;
