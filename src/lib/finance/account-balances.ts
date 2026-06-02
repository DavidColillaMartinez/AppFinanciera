import type { AccountRow, TransactionRow } from "@/types/models";
import { TransactionType } from "@/constants/enums";

export interface AccountBalanceBreakdown {
  cuentaId: string;
  saldoInicial: number;
  ingresos: number;
  gastos: number;
  transferenciasEntrantes: number;
  transferenciasSalientes: number;
  calculado: number;
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function computeAccountBalance(
  account: AccountRow,
  transactions: ReadonlyArray<TransactionRow>,
): AccountBalanceBreakdown {
  const cuentaId = account.cuentaId;
  const saldoInicial = safeNumber(account.saldoInicial);

  let ingresos = 0;
  let gastos = 0;
  let transferenciasEntrantes = 0;
  let transferenciasSalientes = 0;

  for (const tx of transactions) {
    if (!tx || tx.deletedAt) continue;

    if (tx.cuentaDestino === cuentaId && tx.cuentaDestino !== "") {
      if (tx.tipo === TransactionType.INGRESO) {
        ingresos += safeNumber(tx.importe);
      } else if (tx.tipo === TransactionType.TRANSFERENCIA_INTERNA) {
        transferenciasEntrantes += safeNumber(tx.importe);
      }
    }

    if (tx.cuentaOrigen === cuentaId && tx.cuentaOrigen !== "") {
      if (tx.tipo === TransactionType.GASTO) {
        gastos += safeNumber(tx.importe);
      } else if (tx.tipo === TransactionType.TRANSFERENCIA_INTERNA) {
        transferenciasSalientes += safeNumber(tx.importe);
      }
    }
  }

  const calculado =
    saldoInicial + ingresos + transferenciasEntrantes - gastos - transferenciasSalientes;

  return {
    cuentaId,
    saldoInicial,
    ingresos,
    gastos,
    transferenciasEntrantes,
    transferenciasSalientes,
    calculado,
  };
}

export function computeAllAccountBalances(
  accounts: ReadonlyArray<AccountRow>,
  transactions: ReadonlyArray<TransactionRow>,
): Map<string, AccountBalanceBreakdown> {
  const result = new Map<string, AccountBalanceBreakdown>();
  for (const account of accounts) {
    result.set(account.cuentaId, computeAccountBalance(account, transactions));
  }
  return result;
}
