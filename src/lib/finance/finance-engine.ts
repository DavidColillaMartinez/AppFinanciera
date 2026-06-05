import type {
  TransactionRow,
  CategoryRow,
  AccountRow,
  FixedExpenseRow,
  FuturePaymentRow,
  InstallmentPaymentRow,
  ReserveRow,
  GoalRow,
  ReserveMovementRow,
} from "@/types/models";
import {
  TipoDestinoReserva,
  TipoMovimientoReserva,
  TransactionType,
} from "@/constants/enums";
import { SALARY_MOVEMENT_ID_PREFIX } from "./salary-config";
import { LEDGER_ID_PREFIX, getActiveMovements } from "./savings-ledger";
import { computeAllAccountBalances, type AccountBalanceBreakdown } from "./account-balances";

export type MonthKey = string;

export interface SalaryConfig {
  monthlyIncome: number;
  incomeType: "fixed" | "variable";
}

export interface FinanceContext {
  monthKey: MonthKey;
  transactions: TransactionRow[];
  categories: CategoryRow[];
  accounts: AccountRow[];
  fixedExpenses: FixedExpenseRow[];
  futurePayments: FuturePaymentRow[];
  deferredPayments: InstallmentPaymentRow[];
  reserves: ReserveRow[];
  goals: GoalRow[];
  reserveMovements: ReserveMovementRow[];
  salaryConfig: SalaryConfig;
  confirmedFixedExpenseIds?: ReadonlySet<string>;
  confirmedDeferredPaymentIds?: ReadonlySet<string>;
}

export type BalanceLineType =
  | "income"
  | "expense"
  | "saving"
  | "provision"
  | "adjustment";

export interface AvailableBalanceLine {
  label: string;
  amount: number;
  type: BalanceLineType;
}

export interface AvailableBalanceBreakdown {
  available: number;
  income: number;
  salaryIncome: number;
  extraIncome: number;
  variableExpenses: number;
  fixedExpensesConfirmed: number;
  fixedExpensesPending: number;
  deferredPayments: number;
  futurePaymentProvisions: number;
  plannedSavings: number;
  plannedSavingsIsFallback: boolean;
  plannedSavingsRecommended: number;
  executedSavings: number;
  explanation: AvailableBalanceLine[];
}

export interface SavingsTargetProgress {
  count: number;
  totalSaved: number;
  totalTarget: number;
  totalRemaining: number;
  progressPercent: number;
}

export interface SavingsSummary {
  totalSaved: number;
  totalTarget: number;
  totalRemaining: number;
  overallProgress: number;
  byReserves: SavingsTargetProgress;
  byGoals: SavingsTargetProgress;
  byFuturePayments: SavingsTargetProgress;
}

export interface MonthlySavingsBreakdown {
  totalForMonth: number;
  planned: number;
  byDestination: {
    reserva: number;
    objetivo: number;
    pago_futuro: number;
    general: number;
  };
  reserveMovements: ReserveMovementRow[];
  executionRatio: number;
}

export interface SavingsTargetDetail {
  id: string;
  name: string;
  saved: number;
  target: number;
  remaining: number;
  progressPercent: number;
  monthlyRecommended: number;
  estado?: string;
  prioridad?: string;
  fechaInicio?: string;
  fechaObjetivo?: string;
  monthsRemaining?: number;
  requiredMonthly?: number;
  dificultad?: "ok" | "tight" | "difficult" | "impossible";
}

export interface SavingsBreakdown {
  reserves: SavingsTargetDetail[];
  goals: SavingsTargetDetail[];
  futurePayments: SavingsTargetDetail[];
}

export type SavingsDifficulty = "ok" | "tight" | "difficult" | "impossible";

export interface MonthlySavingsPlanItem {
  targetType: "reserva" | "objetivo" | "pago_futuro";
  targetId: string;
  name: string;
  status: string;
  priority: "Alta" | "Media" | "Baja" | "—";
  currentSaved: number;
  targetAmount: number;
  remainingAmount: number;
  recommendedAmount: number;
  requiredMonthly: number;
  confirmedThisMonth: number;
  pendingAmount: number;
  difficulty: SavingsDifficulty;
  reason: string;
  hasTargetDate: boolean;
  monthsRemaining: number;
  isCompleted: boolean;
}

export interface MonthlySavingsPlan {
  monthKey: MonthKey;
  plannedTotal: number;
  confirmedTotal: number;
  pendingTotal: number;
  availableCapacity: number;
  capacityInsufficient: boolean;
  items: MonthlySavingsPlanItem[];
}

export interface DashboardFinanceSummary {
  available: AvailableBalanceBreakdown;
  savings: SavingsSummary;
  monthlySavings: MonthlySavingsBreakdown;
  savingsBreakdown: SavingsBreakdown;
  income: number;
  variableExpenses: number;
  fixedExpensesTotal: number;
  totalExpenses: number;
  futurePaymentProvisions: number;
  plannedSavings: number;
  executedSavings: number;
  accountTotalMoney: number;
  accountBalances: Map<string, AccountBalanceBreakdown>;
}

const SALARY_ID_PREFIXES = [SALARY_MOVEMENT_ID_PREFIX, "SALARY-"] as const;
const FIXED_CONFIRMED_ID_PREFIX = "TX-FIJO-";
const DEFERRED_CONFIRMED_ID_PREFIX = "TX-DEFER-";

const DEFAULT_SAVINGS_RATE = 0.2;

function isActiveTransaction(t: TransactionRow, monthKey: MonthKey): boolean {
  if (t.deletedAt) return false;
  if (t.mesClave) return t.mesClave === monthKey;
  return (t.fecha ?? "").slice(0, 7) === monthKey;
}

function startsWithAny(value: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => value.startsWith(p));
}

export function isSalaryMovement(t: TransactionRow): boolean {
  return startsWithAny(t.id, SALARY_ID_PREFIXES);
}

export function isConfirmedFixedMovement(t: TransactionRow): boolean {
  return t.id.startsWith(FIXED_CONFIRMED_ID_PREFIX);
}

export function isConfirmedDeferredMovement(t: TransactionRow): boolean {
  return t.id.startsWith(DEFERRED_CONFIRMED_ID_PREFIX);
}

function isAporteMovement(m: ReserveMovementRow): boolean {
  return m.tipoMovimiento === TipoMovimientoReserva.APORTE;
}

function isRetiradaMovement(m: ReserveMovementRow): boolean {
  return m.tipoMovimiento === TipoMovimientoReserva.RETIRADA;
}

export function isLedgerEntry(m: ReserveMovementRow): boolean {
  return m.id.startsWith(LEDGER_ID_PREFIX);
}

function sumMovementsBalance(movements: ReserveMovementRow[]): number {
  return movements.reduce((acc, m) => {
    if (isAporteMovement(m)) return acc + m.importe;
    if (isRetiradaMovement(m)) return acc - m.importe;
    return acc;
  }, 0);
}

function getReserveMovements(
  ctx: FinanceContext,
  reserveId: string,
): ReserveMovementRow[] {
  return getActiveMovements(ctx.reserveMovements).filter(
    (m) =>
      (m.tipoDestino === TipoDestinoReserva.RESERVA && m.destinoId === reserveId) ||
      m.reservaId === reserveId,
  );
}

function getGoalMovements(
  ctx: FinanceContext,
  goalId: string,
): ReserveMovementRow[] {
  return getActiveMovements(ctx.reserveMovements).filter(
    (m) => m.tipoDestino === TipoDestinoReserva.OBJETIVO && m.destinoId === goalId,
  );
}

function getFuturePaymentMovements(
  ctx: FinanceContext,
  pagoId: string,
): ReserveMovementRow[] {
  return getActiveMovements(ctx.reserveMovements).filter(
    (m) => m.tipoDestino === TipoDestinoReserva.PAGO_FUTURO && m.destinoId === pagoId,
  );
}

function computeEffectiveBalance(
  movements: ReserveMovementRow[],
  manualBalance: number,
): number {
  if (movements.length === 0) return manualBalance;
  return sumMovementsBalance(movements);
}

export function getTargetLedgerBalance(
  movements: ReserveMovementRow[],
  manualBalance: number,
): number {
  const active = getActiveMovements(movements);
  if (active.length === 0) return manualBalance;
  return sumMovementsBalance(active);
}

export function getMonthlyIncome(ctx: FinanceContext): number {
  return ctx.transactions
    .filter((t) => isActiveTransaction(t, ctx.monthKey))
    .filter((t) => t.tipo === TransactionType.INGRESO)
    .reduce((sum, t) => sum + t.importe, 0);
}

export function getSalaryForMonth(ctx: FinanceContext): number {
  return ctx.transactions
    .filter((t) => isActiveTransaction(t, ctx.monthKey))
    .filter(isSalaryMovement)
    .reduce((sum, t) => sum + t.importe, 0);
}

export function getExtraIncome(ctx: FinanceContext): number {
  return Math.max(0, getMonthlyIncome(ctx) - getSalaryForMonth(ctx));
}

export function getVariableExpenses(ctx: FinanceContext): number {
  return ctx.transactions
    .filter((t) => isActiveTransaction(t, ctx.monthKey))
    .filter((t) => t.tipo === TransactionType.GASTO)
    .filter((t) => !isConfirmedFixedMovement(t))
    .reduce((sum, t) => sum + t.importe, 0);
}

export function getFixedExpensesConfirmed(ctx: FinanceContext): number {
  const confirmed = ctx.confirmedFixedExpenseIds ?? new Set<string>();
  if (confirmed.size === 0) return 0;
  let total = 0;
  for (const fijo of ctx.fixedExpenses) {
    if (fijo.activo !== "S") continue;
    if (!confirmed.has(fijo.fijoId)) continue;
    const movementId = `${FIXED_CONFIRMED_ID_PREFIX}${ctx.monthKey}-${fijo.fijoId}`;
    const movement = ctx.transactions.find(
      (t) => t.id === movementId && !t.deletedAt,
    );
    total += movement ? movement.importe : fijo.importe;
  }
  return total;
}

export function getFixedExpensesPending(ctx: FinanceContext): number {
  const confirmed = ctx.confirmedFixedExpenseIds ?? new Set<string>();
  return ctx.fixedExpenses
    .filter((f) => f.activo === "S")
    .filter((f) => !confirmed.has(f.fijoId))
    .reduce((sum, f) => sum + f.importe, 0);
}

export function getDeferredPayments(ctx: FinanceContext): number {
  return ctx.deferredPayments
    .filter((d) => d.estado === "Activo")
    .reduce((sum, d) => sum + d.cuotaMensual, 0);
}

export function getFuturePaymentProvisions(ctx: FinanceContext): number {
  return ctx.futurePayments
    .filter((f) => f.estado === "Activo")
    .reduce((sum, f) => {
      if (f.aporteMensual > 0) return sum + f.aporteMensual;
      if (f.mesesRestantes > 0) {
        const remaining = Math.max(0, f.importeObjetivo - f.saldoReservado);
        return sum + remaining / f.mesesRestantes;
      }
      return sum;
    }, 0);
}

export function getTotalExpenses(ctx: FinanceContext): number {
  return (
    getVariableExpenses(ctx) +
    getFixedExpensesConfirmed(ctx) +
    getFixedExpensesPending(ctx) +
    getDeferredPayments(ctx)
  );
}

function isDateBeforeMonth(dateStr: string, monthKey: string): boolean {
  if (!dateStr) return true;
  return dateStr.slice(0, 7) <= monthKey;
}

function isActiveReserve(r: ReserveRow): boolean {
  return r.estado === "Activo";
}

function isActiveGoal(g: GoalRow): boolean {
  return g.estado === "Activo";
}

function isActiveFuturePayment(f: FuturePaymentRow): boolean {
  return f.estado === "Activo";
}

function priorityWeight(p: string | undefined | null): number {
  if (p === "Alta") return 3;
  if (p === "Media") return 2;
  if (p === "Baja") return 1;
  return 0;
}

function normalizePriority(p: string | undefined | null): "Alta" | "Media" | "Baja" | "—" {
  if (p === "Alta" || p === "Media" || p === "Baja") return p;
  return "—";
}

export function getGeneralSavings(ctx: FinanceContext): SavingsSummary {
  const reserves = ctx.reserves.filter(
    (r) => isActiveReserve(r) && isDateBeforeMonth(r.fechaInicio, ctx.monthKey),
  );
  const goals = ctx.goals.filter(
    (g) => isActiveGoal(g) && isDateBeforeMonth(g.fechaInicio, ctx.monthKey),
  );
  const futurePayments = ctx.futurePayments.filter(
    (f) => isActiveFuturePayment(f) && isDateBeforeMonth(f.fechaInicio, ctx.monthKey),
  );

  let reservesSaved = 0;
  let reservesTarget = 0;
  for (const r of reserves) {
    const movements = getReserveMovements(ctx, r.reservaId);
    reservesSaved += computeEffectiveBalance(movements, r.saldoActual);
    reservesTarget += r.importeObjetivo;
  }

  let goalsSaved = 0;
  let goalsTarget = 0;
  for (const g of goals) {
    const movements = getGoalMovements(ctx, g.objetivoId);
    goalsSaved += computeEffectiveBalance(movements, g.saldoActual);
    goalsTarget += g.importeObjetivo;
  }

  let futureSaved = 0;
  let futureTarget = 0;
  for (const f of futurePayments) {
    const movements = getFuturePaymentMovements(ctx, f.pagoId);
    futureSaved += computeEffectiveBalance(movements, f.saldoReservado);
    futureTarget += f.importeObjetivo;
  }

  const totalSaved = reservesSaved + goalsSaved + futureSaved;
  const totalTarget = reservesTarget + goalsTarget + futureTarget;
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0
    ? Math.min((totalSaved / totalTarget) * 100, 100)
    : 0;

  return {
    totalSaved,
    totalTarget,
    totalRemaining,
    overallProgress,
    byReserves: {
      count: reserves.length,
      totalSaved: reservesSaved,
      totalTarget: reservesTarget,
      totalRemaining: Math.max(0, reservesTarget - reservesSaved),
      progressPercent:
        reservesTarget > 0
          ? Math.min((reservesSaved / reservesTarget) * 100, 100)
          : 0,
    },
    byGoals: {
      count: goals.length,
      totalSaved: goalsSaved,
      totalTarget: goalsTarget,
      totalRemaining: Math.max(0, goalsTarget - goalsSaved),
      progressPercent:
        goalsTarget > 0
          ? Math.min((goalsSaved / goalsTarget) * 100, 100)
          : 0,
    },
    byFuturePayments: {
      count: futurePayments.length,
      totalSaved: futureSaved,
      totalTarget: futureTarget,
      totalRemaining: Math.max(0, futureTarget - futureSaved),
      progressPercent:
        futureTarget > 0
          ? Math.min((futureSaved / futureTarget) * 100, 100)
          : 0,
    },
  };
}

export function getMonthlySavings(ctx: FinanceContext): MonthlySavingsBreakdown {
  const movs = getActiveMovements(ctx.reserveMovements).filter(
    (m) => (m.mesClave || (m.fecha ?? "").slice(0, 7)) === ctx.monthKey,
  );

  let reserva = 0;
  let objetivo = 0;
  let pago_futuro = 0;
  for (const m of movs) {
    if (!isAporteMovement(m)) continue;
    if (m.tipoDestino === TipoDestinoReserva.RESERVA) {
      reserva += m.importe;
    } else if (m.tipoDestino === TipoDestinoReserva.OBJETIVO) {
      objetivo += m.importe;
    } else if (m.tipoDestino === TipoDestinoReserva.PAGO_FUTURO) {
      pago_futuro += m.importe;
    }
  }

  const general = ctx.transactions
    .filter((t) => isActiveTransaction(t, ctx.monthKey))
    .filter((t) => t.tipo === TransactionType.AHORRO)
    .filter((t) => !t.reservaId)
    .filter((t) => !t.id.startsWith(LEDGER_ID_PREFIX))
    .reduce((sum, t) => sum + t.importe, 0);

  const totalForMonth = reserva + objetivo + pago_futuro + general;

  const planned =
    ctx.reserves
      .filter((r) => isActiveReserve(r) && isDateBeforeMonth(r.fechaInicio, ctx.monthKey))
      .reduce((sum, r) => sum + r.aporteMensualSugerido, 0) +
    ctx.goals
      .filter((g) => isActiveGoal(g) && isDateBeforeMonth(g.fechaInicio, ctx.monthKey))
      .reduce((sum, g) => sum + g.aporteMensual, 0);

  const executionRatio = planned > 0 ? totalForMonth / planned : 0;

  return {
    totalForMonth,
    planned,
    byDestination: { reserva, objetivo, pago_futuro, general },
    reserveMovements: movs,
    executionRatio,
  };
}

function computeMonthsRemaining(fechaObjetivo: string, monthKey: string): number {
  if (!fechaObjetivo) return 0;
  const [y, m] = monthKey.split("-").map(Number);
  const [ty, tm] = fechaObjetivo.slice(0, 7).split("-").map(Number);
  if (!y || !m || !ty || !tm) return 0;
  return Math.max(0, (ty - y) * 12 + (tm - m));
}

export function getSavingsBreakdown(ctx: FinanceContext): SavingsBreakdown {
  const reserves: SavingsTargetDetail[] = ctx.reserves
    .filter((r) => isActiveReserve(r) && isDateBeforeMonth(r.fechaInicio, ctx.monthKey))
    .map((r) => {
      const movements = getReserveMovements(ctx, r.reservaId);
      const saved = computeEffectiveBalance(movements, r.saldoActual);
      const remaining = Math.max(0, r.importeObjetivo - saved);
      const monthsRemaining = computeMonthsRemaining(r.fechaObjetivo, ctx.monthKey);
      const requiredMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
      return {
        id: r.reservaId,
        name: r.nombre,
        saved,
        target: r.importeObjetivo,
        remaining,
        progressPercent:
          r.importeObjetivo > 0
            ? Math.min((saved / r.importeObjetivo) * 100, 100)
            : 0,
        monthlyRecommended: r.aporteMensualSugerido,
        estado: r.estado,
        prioridad: r.prioridad,
        fechaInicio: r.fechaInicio,
        fechaObjetivo: r.fechaObjetivo,
        monthsRemaining,
        requiredMonthly,
      };
    });

  const goals: SavingsTargetDetail[] = ctx.goals
    .filter((g) => isActiveGoal(g) && isDateBeforeMonth(g.fechaInicio, ctx.monthKey))
    .map((g) => {
      const movements = getGoalMovements(ctx, g.objetivoId);
      const saved = computeEffectiveBalance(movements, g.saldoActual);
      const remaining = Math.max(0, g.importeObjetivo - saved);
      const monthsRemaining = computeMonthsRemaining(g.fechaObjetivo, ctx.monthKey);
      const requiredMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
      return {
        id: g.objetivoId,
        name: g.nombre,
        saved,
        target: g.importeObjetivo,
        remaining,
        progressPercent:
          g.importeObjetivo > 0
            ? Math.min((saved / g.importeObjetivo) * 100, 100)
            : 0,
        monthlyRecommended: g.aporteMensual,
        estado: g.estado,
        prioridad: g.prioridad,
        fechaInicio: g.fechaInicio,
        fechaObjetivo: g.fechaObjetivo,
        monthsRemaining,
        requiredMonthly,
      };
    });

  const futurePayments: SavingsTargetDetail[] = ctx.futurePayments
    .filter((f) => isActiveFuturePayment(f) && isDateBeforeMonth(f.fechaInicio, ctx.monthKey))
    .map((f) => {
      const movements = getFuturePaymentMovements(ctx, f.pagoId);
      const saved = computeEffectiveBalance(movements, f.saldoReservado);
      const remaining = Math.max(0, f.importeObjetivo - saved);
      const monthsRemaining = computeMonthsRemaining(f.fechaVencimiento, ctx.monthKey);
      const requiredMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
      return {
        id: f.pagoId,
        name: f.concepto,
        saved,
        target: f.importeObjetivo,
        remaining,
        progressPercent:
          f.importeObjetivo > 0
            ? Math.min((saved / f.importeObjetivo) * 100, 100)
            : 0,
        monthlyRecommended: f.aporteMensual,
        estado: f.estado,
        prioridad: f.prioridad,
        fechaInicio: f.fechaInicio,
        fechaObjetivo: f.fechaVencimiento,
        monthsRemaining,
        requiredMonthly,
      };
    });

  return { reserves, goals, futurePayments };
}

export function getAvailableBalance(
  ctx: FinanceContext,
): AvailableBalanceBreakdown {
  const income = getMonthlyIncome(ctx);
  const salaryIncome = getSalaryForMonth(ctx);
  const extraIncome = income - salaryIncome;
  const variableExpenses = getVariableExpenses(ctx);
  const fixedExpensesConfirmed = getFixedExpensesConfirmed(ctx);
  const fixedExpensesPending = getFixedExpensesPending(ctx);
  const deferredPayments = getDeferredPayments(ctx);
  const futurePaymentProvisions = getFuturePaymentProvisions(ctx);

  const monthly = getMonthlySavings(ctx);
  const executedSavings = monthly.totalForMonth;

  const netForObligations =
    income - variableExpenses - fixedExpensesConfirmed - fixedExpensesPending - deferredPayments;
  const plannedSavingsRecommended = Math.max(
    0,
    netForObligations * DEFAULT_SAVINGS_RATE,
  );

  const userPlannedSavings = monthly.planned;
  const plannedSavingsIsFallback = userPlannedSavings <= 0;
  const plannedSavings = plannedSavingsIsFallback
    ? plannedSavingsRecommended
    : userPlannedSavings;

  const available =
    income -
    variableExpenses -
    fixedExpensesConfirmed -
    fixedExpensesPending -
    deferredPayments -
    futurePaymentProvisions -
    plannedSavings;

  return {
    available,
    income,
    salaryIncome,
    extraIncome,
    variableExpenses,
    fixedExpensesConfirmed,
    fixedExpensesPending,
    deferredPayments,
    futurePaymentProvisions,
    plannedSavings,
    plannedSavingsIsFallback,
    plannedSavingsRecommended,
    executedSavings,
    explanation: explainAvailableBalance({
      income,
      salaryIncome,
      extraIncome,
      variableExpenses,
      fixedExpensesConfirmed,
      fixedExpensesPending,
      deferredPayments,
      futurePaymentProvisions,
      plannedSavings,
      plannedSavingsIsFallback,
      plannedSavingsRecommended,
      executedSavings,
      available,
    }),
  };
}

export function explainAvailableBalance(
  values: Omit<AvailableBalanceBreakdown, "explanation">,
): AvailableBalanceLine[] {
  const lines: AvailableBalanceLine[] = [
    { label: "Ingresos del mes", amount: values.income, type: "income" },
  ];
  if (values.salaryIncome > 0) {
    lines.push({
      label: "  Nomina",
      amount: values.salaryIncome,
      type: "income",
    });
  }
  if (values.extraIncome > 0) {
    lines.push({
      label: "  Ingresos extra",
      amount: values.extraIncome,
      type: "income",
    });
  }
  lines.push({
    label: "Gastos variables",
    amount: -values.variableExpenses,
    type: "expense",
  });
  if (values.fixedExpensesConfirmed > 0) {
    lines.push({
      label: "Gastos fijos confirmados",
      amount: -values.fixedExpensesConfirmed,
      type: "expense",
    });
  }
  if (values.fixedExpensesPending > 0) {
    lines.push({
      label: "Gastos fijos pendientes",
      amount: -values.fixedExpensesPending,
      type: "expense",
    });
  }
  if (values.deferredPayments > 0) {
    lines.push({
      label: "Cuotas aplazadas",
      amount: -values.deferredPayments,
      type: "expense",
    });
  }
  if (values.futurePaymentProvisions > 0) {
    lines.push({
      label: "Provisiones pagos futuros",
      amount: -values.futurePaymentProvisions,
      type: "provision",
    });
  }
  if (values.plannedSavings > 0) {
    lines.push({
      label: values.plannedSavingsIsFallback
        ? "Ahorro recomendado (20% fallback)"
        : "Ahorro planificado",
      amount: -values.plannedSavings,
      type: "saving",
    });
  }
  return lines;
}

export function getReserveProgress(
  reserveId: string,
  ctx: FinanceContext,
): SavingsTargetDetail | null {
  const reserve = ctx.reserves.find((r) => r.reservaId === reserveId);
  if (!reserve) return null;
  const movements = getReserveMovements(ctx, reserveId);
  const saved = computeEffectiveBalance(movements, reserve.saldoActual);
  const remaining = Math.max(0, reserve.importeObjetivo - saved);
  return {
    id: reserve.reservaId,
    name: reserve.nombre,
    saved,
    target: reserve.importeObjetivo,
    remaining,
    progressPercent:
      reserve.importeObjetivo > 0
        ? Math.min((saved / reserve.importeObjetivo) * 100, 100)
        : 0,
    monthlyRecommended: reserve.aporteMensualSugerido,
  };
}

export function getGoalProgress(
  goalId: string,
  ctx: FinanceContext,
): SavingsTargetDetail | null {
  const goal = ctx.goals.find((g) => g.objetivoId === goalId);
  if (!goal) return null;
  const movements = getGoalMovements(ctx, goalId);
  const saved = computeEffectiveBalance(movements, goal.saldoActual);
  const remaining = Math.max(0, goal.importeObjetivo - saved);
  return {
    id: goal.objetivoId,
    name: goal.nombre,
    saved,
    target: goal.importeObjetivo,
    remaining,
    progressPercent:
      goal.importeObjetivo > 0
        ? Math.min((saved / goal.importeObjetivo) * 100, 100)
        : 0,
    monthlyRecommended: goal.aporteMensual,
  };
}

export function computeSavingsDifficulty(
  requiredMonthly: number,
  availableAfterObligations: number,
): "ok" | "tight" | "difficult" | "impossible" {
  if (availableAfterObligations <= 0) return "impossible";
  if (requiredMonthly > availableAfterObligations) return "impossible";
  if (requiredMonthly > availableAfterObligations * 0.75) return "difficult";
  if (requiredMonthly > availableAfterObligations * 0.4) return "tight";
  return "ok";
}

export function getFuturePaymentProgress(
  pagoId: string,
  ctx: FinanceContext,
): SavingsTargetDetail | null {
  const pago = ctx.futurePayments.find((f) => f.pagoId === pagoId);
  if (!pago) return null;
  const movements = getFuturePaymentMovements(ctx, pagoId);
  const saved = computeEffectiveBalance(movements, pago.saldoReservado);
  const remaining = Math.max(0, pago.importeObjetivo - saved);
  return {
    id: pago.pagoId,
    name: pago.concepto,
    saved,
    target: pago.importeObjetivo,
    remaining,
    progressPercent:
      pago.importeObjetivo > 0
        ? Math.min((saved / pago.importeObjetivo) * 100, 100)
        : 0,
    monthlyRecommended: pago.aporteMensual,
  };
}

export function getDashboardSummary(
  ctx: FinanceContext,
): DashboardFinanceSummary {
  const available = getAvailableBalance(ctx);
  const savings = getGeneralSavings(ctx);
  const monthlySavings = getMonthlySavings(ctx);
  const savingsBreakdown = getSavingsBreakdown(ctx);
  const accountBalances = computeAllAccountBalances(ctx.accounts, ctx.transactions);
  const accountTotalMoney = Array.from(accountBalances.values()).reduce(
    (sum, b) => sum + b.calculado,
    0,
  );

  return {
    available,
    savings,
    monthlySavings,
    savingsBreakdown,
    income: available.income,
    variableExpenses: available.variableExpenses,
    fixedExpensesTotal:
      available.fixedExpensesConfirmed + available.fixedExpensesPending,
    totalExpenses:
      available.variableExpenses +
      available.fixedExpensesConfirmed +
      available.fixedExpensesPending +
      available.deferredPayments,
    futurePaymentProvisions: available.futurePaymentProvisions,
    plannedSavings: available.plannedSavings,
    executedSavings: available.executedSavings,
    accountTotalMoney,
    accountBalances,
  };
}

export interface BuildMonthlySavingsPlanOptions {
  availableCapacity?: number;
  monthlyMovements?: ReserveMovementRow[];
}

function buildTargetSnapshot(
  targetType: "reserva" | "objetivo" | "pago_futuro",
  targetId: string,
  name: string,
  status: string,
  priorityRaw: string | undefined,
  fechaObjetivo: string,
  currentSaved: number,
  targetAmount: number,
  monthlyRecommended: number,
  monthKey: MonthKey,
  monthMovements: ReserveMovementRow[],
): MonthlySavingsPlanItem {
  const completed = status === "Completado" || (targetAmount > 0 && currentSaved >= targetAmount);
  const remaining = Math.max(0, targetAmount - currentSaved);
  const monthsRemaining = computeMonthsRemaining(fechaObjetivo, monthKey);
  const hasTargetDate = Boolean(fechaObjetivo);
  const requiredMonthly = hasTargetDate && monthsRemaining > 0
    ? remaining / monthsRemaining
    : 0;
  const confirmed = monthMovements
    .filter(
      (m) =>
        m.tipoMovimiento === TipoMovimientoReserva.APORTE &&
        m.tipoDestino === targetType &&
        m.destinoId === targetId,
    )
    .reduce((acc, m) => acc + m.importe, 0);
  const reason = completed
    ? "Objetivo completado"
    : hasTargetDate && monthsRemaining > 0
      ? `Reparte ${remaining.toFixed(2)} € en ${monthsRemaining} meses`
      : hasTargetDate
        ? "Fecha objetivo alcanzada"
        : "Sin fecha objetivo — distribución por prioridad";
  return {
    targetType,
    targetId,
    name,
    status,
    priority: normalizePriority(priorityRaw),
    currentSaved,
    targetAmount,
    remainingAmount: remaining,
    recommendedAmount: 0,
    requiredMonthly,
    confirmedThisMonth: confirmed,
    pendingAmount: 0,
    difficulty: "ok",
    reason,
    hasTargetDate,
    monthsRemaining,
    isCompleted: completed,
  };
}

export function buildMonthlySavingsPlan(
  ctx: FinanceContext,
  options: BuildMonthlySavingsPlanOptions = {},
): MonthlySavingsPlan {
  const monthMovements =
    options.monthlyMovements ??
    getActiveMovements(ctx.reserveMovements).filter((m) => {
      const mKey = m.mesClave || (m.fecha ?? "").slice(0, 7);
      return mKey === ctx.monthKey;
    });

  const snapshots: MonthlySavingsPlanItem[] = [];

  for (const r of ctx.reserves) {
    if (!isActiveReserve(r)) continue;
    if (r.importeObjetivo <= 0 && r.aporteMensualSugerido <= 0) continue;
    if (!isDateBeforeMonth(r.fechaInicio, ctx.monthKey)) continue;
    const movements = getReserveMovements(ctx, r.reservaId);
    const saved = computeEffectiveBalance(movements, r.saldoActual);
    snapshots.push(
      buildTargetSnapshot(
        "reserva",
        r.reservaId,
        r.nombre,
        r.estado,
        r.prioridad,
        r.fechaObjetivo,
        saved,
        r.importeObjetivo,
        r.aporteMensualSugerido,
        ctx.monthKey,
        monthMovements,
      ),
    );
  }

  for (const g of ctx.goals) {
    if (!isActiveGoal(g)) continue;
    if (g.importeObjetivo <= 0 && g.aporteMensual <= 0) continue;
    if (!isDateBeforeMonth(g.fechaInicio, ctx.monthKey)) continue;
    const movements = getGoalMovements(ctx, g.objetivoId);
    const saved = computeEffectiveBalance(movements, g.saldoActual);
    snapshots.push(
      buildTargetSnapshot(
        "objetivo",
        g.objetivoId,
        g.nombre,
        g.estado,
        g.prioridad,
        g.fechaObjetivo,
        saved,
        g.importeObjetivo,
        g.aporteMensual,
        ctx.monthKey,
        monthMovements,
      ),
    );
  }

  for (const f of ctx.futurePayments) {
    if (!isActiveFuturePayment(f)) continue;
    if (f.importeObjetivo <= 0 && f.aporteMensual <= 0) continue;
    if (!isDateBeforeMonth(f.fechaInicio, ctx.monthKey)) continue;
    const movements = getFuturePaymentMovements(ctx, f.pagoId);
    const saved = computeEffectiveBalance(movements, f.saldoReservado);
    snapshots.push(
      buildTargetSnapshot(
        "pago_futuro",
        f.pagoId,
        f.concepto,
        f.estado,
        f.prioridad,
        f.fechaVencimiento,
        saved,
        f.importeObjetivo,
        f.aporteMensual,
        ctx.monthKey,
        monthMovements,
      ),
    );
  }

  let capacity = options.availableCapacity ?? 0;
  if (!options.availableCapacity) {
    const available = getAvailableBalance(ctx);
    capacity = Math.max(0, available.available);
  }

  const fixedDateItems = snapshots.filter(
    (s) => !s.isCompleted && s.hasTargetDate && s.monthsRemaining > 0 && s.requiredMonthly > 0,
  );
  const noDateItems = snapshots.filter(
    (s) =>
      !s.isCompleted &&
      !s.hasTargetDate &&
      s.targetType === "objetivo",
  );

  for (const item of fixedDateItems) {
    item.recommendedAmount = item.requiredMonthly;
  }

  const fixedTotal = fixedDateItems.reduce((acc, i) => acc + i.recommendedAmount, 0);
  const remaining = Math.max(0, capacity - fixedTotal);

  const totalWeight = noDateItems.reduce(
    (acc, i) => acc + priorityWeight(i.priority),
    0,
  );
  if (totalWeight > 0) {
    for (const item of noDateItems) {
      const w = priorityWeight(item.priority);
      const share = w > 0 ? (remaining * w) / totalWeight : 0;
      item.recommendedAmount = share;
    }
  }

  for (const item of snapshots) {
    const capped = Math.max(0, item.recommendedAmount - item.confirmedThisMonth);
    item.pendingAmount = item.isCompleted ? 0 : capped;
    if (item.confirmedThisMonth >= item.recommendedAmount && item.recommendedAmount > 0) {
      item.difficulty = "ok";
    } else if (capacity <= 0) {
      item.difficulty = "impossible";
      item.reason = "Sin capacidad disponible este mes";
    } else if (item.recommendedAmount > capacity) {
      item.difficulty = "impossible";
      item.reason = "Capacidad insuficiente";
    } else if (item.recommendedAmount > capacity * 0.75) {
      item.difficulty = "difficult";
    } else if (item.recommendedAmount > capacity * 0.4) {
      item.difficulty = "tight";
    } else {
      item.difficulty = "ok";
    }
    if (item.confirmedThisMonth > 0) {
      item.difficulty = "ok";
    }
  }

  const plannedTotal = snapshots.reduce((acc, i) => acc + i.recommendedAmount, 0);
  const confirmedTotal = snapshots.reduce((acc, i) => acc + i.confirmedThisMonth, 0);
  const pendingTotal = Math.max(0, plannedTotal - confirmedTotal);
  const capacityInsufficient = capacity < fixedTotal;

  return {
    monthKey: ctx.monthKey,
    plannedTotal,
    confirmedTotal,
    pendingTotal,
    availableCapacity: capacity,
    capacityInsufficient,
    items: snapshots,
  };
}

export interface EmptyContextInput {
  monthKey: MonthKey;
  transactions: TransactionRow[];
  categories?: CategoryRow[];
  accounts?: AccountRow[];
  fixedExpenses?: FixedExpenseRow[];
  futurePayments?: FuturePaymentRow[];
  deferredPayments?: InstallmentPaymentRow[];
  reserves?: ReserveRow[];
  goals?: GoalRow[];
  reserveMovements?: ReserveMovementRow[];
  monthlyIncome?: number;
  incomeType?: "fixed" | "variable";
  confirmedFixedExpenseIds?: ReadonlySet<string>;
  confirmedDeferredPaymentIds?: ReadonlySet<string>;
}

export function buildFinanceContext(input: EmptyContextInput): FinanceContext {
  return {
    monthKey: input.monthKey,
    transactions: input.transactions ?? [],
    categories: input.categories ?? [],
    accounts: input.accounts ?? [],
    fixedExpenses: input.fixedExpenses ?? [],
    futurePayments: input.futurePayments ?? [],
    deferredPayments: input.deferredPayments ?? [],
    reserves: input.reserves ?? [],
    goals: input.goals ?? [],
    reserveMovements: input.reserveMovements ?? [],
    salaryConfig: {
      monthlyIncome: input.monthlyIncome ?? 0,
      incomeType: input.incomeType ?? "fixed",
    },
    confirmedFixedExpenseIds: input.confirmedFixedExpenseIds,
    confirmedDeferredPaymentIds: input.confirmedDeferredPaymentIds,
  };
}
