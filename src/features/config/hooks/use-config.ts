import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { readSheetData } from "@/lib/sheets/reader";
import { updateRowById, getToken } from "@/lib/sheets/writer";
import type { ConfigRow } from "@/types/models";

function rowToConfig(row: Record<string, string>): ConfigRow {
  return {
    Clave: row.Clave ?? "",
    Valor: row.Valor ?? "",
    Descripcion: row.Descripcion ?? "",
  };
}

export function useConfig(sheetId: string | null) {
  return useQuery({
    queryKey: ["config", sheetId],
    queryFn: async () => {
      if (!sheetId) return {};
      const rows = await readSheetData<ConfigRow>(
        sheetId,
        SHEET_NAMES.CONFIG,
        rowToConfig,
      );
      const config: Record<string, string> = {};
      for (const row of rows) {
        if (row.Clave) {
          config[row.Clave] = row.Valor;
        }
      }
      return config;
    },
    enabled: !!sheetId,
  });
}

export function useUpdateConfig(sheetId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      value,
      rowIndex,
    }: {
      value: string;
      rowIndex: number;
    }) => {
      if (!sheetId) throw new Error("No sheet connected");
      const token = getToken();
      if (!token) throw new Error("No access token");

      const headers = ["Clave", "Valor", "Descripcion"];
      await updateRowById(
        sheetId,
        SHEET_NAMES.CONFIG,
        rowIndex,
        { Valor: value },
        headers,
        token,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}
