"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readSalaryConfigFromSheet,
  writeSalaryConfigToSheet,
  saveVariableSalaryForMonth,
  ensureSalaryForMonth,
  EMPTY_SALARY_CONFIG,
  type SalaryConfigRecord,
  type EnsureSalaryResult,
  type SaveVariableSalaryResult,
} from "@/lib/finance/salary";

export function useSalaryConfig(sheetId: string | null) {
  return useQuery({
    queryKey: ["salaryConfig", sheetId],
    queryFn: async () => {
      if (!sheetId) return EMPTY_SALARY_CONFIG;
      const result = await readSalaryConfigFromSheet(sheetId);
      return result.config;
    },
    enabled: !!sheetId,
    staleTime: 30_000,
  });
}

export function useUpdateSalaryConfig(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: SalaryConfigRecord) => {
      if (!sheetId) throw new Error("No sheet connected");
      return writeSalaryConfigToSheet({ sheetId, config });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryConfig", sheetId] });
      queryClient.invalidateQueries({ queryKey: ["config", sheetId] });
    },
  });
}

export function useSaveVariableSalary(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      monthKey: string;
      amount: number;
      destinationAccount: string;
      description?: string;
      category?: string;
      day?: number;
    }): Promise<SaveVariableSalaryResult> => {
      if (!sheetId) throw new Error("No sheet connected");
      const result = await saveVariableSalaryForMonth({ sheetId, ...args });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", sheetId] });
    },
  });
}

export function useEnsureSalaryForMonth(sheetId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      monthKey: string;
      config: SalaryConfigRecord;
    }): Promise<EnsureSalaryResult> => {
      if (!sheetId) throw new Error("No sheet connected");
      const result = await ensureSalaryForMonth({ sheetId, ...args });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", sheetId] });
    },
  });
}
