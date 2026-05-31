import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES, CATEGORIAS_HEADERS } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import {
  appendModelRow,
  softDeleteRow,
  findRowIndexByColumnValue,
  updateRowByColumn,
  getToken,
} from "@/lib/sheets/writer";
import { categorySheetSchema } from "@/schemas/category";
import type { CategoryRow } from "@/types/models";
import { nowISO } from "@/lib/sheets/adapters";

function rowToCategory(row: Record<string, string>): CategoryRow {
  return {
    categoriaId: row.categoriaId ?? "",
    nombre: row.nombre ?? "",
    presupuestoMensual: Number(row.presupuestoMensual) || 0,
    tipoHabitual: (row.tipoHabitual as CategoryRow["tipoHabitual"]) ?? "Gasto",
    activo: (row.activo as CategoryRow["activo"]) ?? "S",
    grupo: row.grupo ?? "",
    color: row.color ?? "",
    icono: row.icono ?? "",
    orden: Number(row.orden) || 0,
    notas: row.notas ?? "",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export function useCategories(sheetId: string | null) {
  return useQuery({
    queryKey: ["categories", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      const rows = await readSheetData<CategoryRow>(
        sheetId,
        SHEET_NAMES.CATEGORIAS,
        rowToCategory,
      );
      return rows.filter((r) => r.categoriaId && r.activo === "S");
    },
    enabled: !!sheetId,
  });
}

export function useCreateCategory(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nombre: string;
      presupuestoMensual: number;
      tipoHabitual: string;
      grupo?: string;
      color?: string;
      icono?: string;
      orden?: number;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const now = nowISO();
      const rowData = {
        categoriaId: `CAT-${Date.now()}`,
        nombre: data.nombre,
        presupuestoMensual: data.presupuestoMensual,
        tipoHabitual: data.tipoHabitual as CategoryRow["tipoHabitual"],
        activo: "S" as const,
        grupo: data.grupo ?? "",
        color: data.color ?? "#3B82F6",
        icono: data.icono ?? "",
        orden: data.orden ?? 0,
        notas: data.notas ?? "",
        createdAt: now,
        updatedAt: now,
      };

      await appendModelRow(
        sheetId,
        SHEET_NAMES.CATEGORIAS,
        CATEGORIAS_HEADERS,
        rowData,
        token,
      );

      return rowData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categoriaId: string;
      nombre: string;
      presupuestoMensual: number;
      tipoHabitual: string;
      grupo?: string;
      color?: string;
      icono?: string;
      orden?: number;
      notas?: string;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.CATEGORIAS,
        "categoriaId",
        data.categoriaId,
        token,
      );
      if (rowIndex === null) throw new Error("Categoria no encontrada");

      const now = nowISO();

      const updates = {
        nombre: data.nombre,
        presupuestoMensual: data.presupuestoMensual,
        tipoHabitual: data.tipoHabitual as CategoryRow["tipoHabitual"],
        grupo: data.grupo ?? "",
        color: data.color ?? "",
        icono: data.icono ?? "",
        orden: data.orden ?? 0,
        notas: data.notas ?? "",
        updatedAt: now,
      };

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.CATEGORIAS,
        rowIndex,
        updates,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoriaId: string) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const rowIndex = await findRowIndexByColumnValue(
        sheetId,
        SHEET_NAMES.CATEGORIAS,
        "categoriaId",
        categoriaId,
        token,
      );
      if (rowIndex === null) throw new Error("Categoria no encontrada");

      await updateRowByColumn(
        sheetId,
        SHEET_NAMES.CATEGORIAS,
        rowIndex,
        { activo: "N", updatedAt: nowISO() },
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
