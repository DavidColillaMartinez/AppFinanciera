import { nowISO } from "@/lib/sheets/adapters";
import { getToken } from "@/lib/sheets/writer";
import { SHEET_NAMES, MOVIMIENTOS_HEADERS } from "@/constants/sheet-structure";
import { appendModelRow } from "@/lib/sheets/writer";
import { TransactionType } from "@/constants/enums";

export async function ensureMonthlySalary(
  sheetId: string,
  monthlyIncome: number,
  incomeType: "fixed" | "variable",
  salaryAddedMonths: string[],
  onMonthAdded?: (monthKey: string) => void
): Promise<{ added: boolean; monthKey: string }> {
  if (incomeType === "variable") {
    return { added: false, monthKey: generateMonthKey(new Date().toISOString()) };
  }

  const today = new Date();
  const monthKey = generateMonthKey(today.toISOString());

  if (salaryAddedMonths.includes(monthKey)) {
    return { added: false, monthKey };
  }

  const firstDayDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayStr = firstDayDate.toISOString().split("T")[0];

  const token = getToken();
  if (!token) {
    throw new Error("No access token");
  }

  const id = `TX-SALARY-${Date.now()}`;
  const now = nowISO();

  const rowData = {
    id,
    fecha: firstDayStr,
    mesClave: monthKey,
    concepto: "Nomina mensual",
    tipo: TransactionType.INGRESO as string,
    categoria: "Nomina",
    importe: monthlyIncome,
    metodo: "",
    cuentaOrigen: "",
    cuentaDestino: "",
    notas: "Nomina añadida automaticamente por la app",
    reservaId: "",
    createdAt: now,
    updatedAt: now,
    deletedAt: "",
  };

  await appendModelRow(
    sheetId,
    SHEET_NAMES.MOVIMIENTOS,
    MOVIMIENTOS_HEADERS,
    rowData,
    token
  );

  onMonthAdded?.(monthKey);

  return { added: true, monthKey };
}

export function generateMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function shouldAddSalaryToday(
  incomeType: "fixed" | "variable",
  salaryAddedMonths: string[]
): boolean {
  if (incomeType !== "fixed") return false;

  const today = new Date();
  const dayOfMonth = today.getDate();

  if (dayOfMonth !== 1) return false;

  const monthKey = generateMonthKey(today.toISOString());
  return !salaryAddedMonths.includes(monthKey);
}