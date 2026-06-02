import { DefaultOptions } from "@tanstack/react-query";
import { SheetsAuthError } from "@/lib/sheets/client";

export const queryClientDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof SheetsAuthError) return false;
      if (failureCount >= 1) return false;
      return true;
    },
    retryDelay: 1500,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: (failureCount, error) => {
      if (error instanceof SheetsAuthError) return false;
      if (failureCount >= 1) return false;
      return true;
    },
    retryDelay: 1500,
  },
};
