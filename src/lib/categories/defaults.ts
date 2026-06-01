import { CategoryRow } from "@/types/models";

export interface DefaultCategory {
  nombre: string;
  tipoHabitual: "Ingreso" | "Gasto" | "Ahorro";
  presupuestoMensual: number;
  grupo: string;
  color: string;
  icono: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // INGRESOS
  {
    nombre: "Nomina",
    tipoHabitual: "Ingreso",
    presupuestoMensual: 0,
    grupo: "Ingresos",
    color: "#10B981",
    icono: "wallet",
  },
  {
    nombre: "Ingresos extra",
    tipoHabitual: "Ingreso",
    presupuestoMensual: 0,
    grupo: "Ingresos",
    color: "#34D399",
    icono: "plus-circle",
  },

  // GASTOS FIJOS (prioridad alta)
  {
    nombre: "Alquiler",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Vivienda",
    color: "#EF4444",
    icono: "home",
  },
  {
    nombre: "Luz",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Suministros",
    color: "#F59E0B",
    icono: "zap",
  },
  {
    nombre: "Agua",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Suministros",
    color: "#3B82F6",
    icono: "droplet",
  },
  {
    nombre: "Internet",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Suministros",
    color: "#8B5CF6",
    icono: "wifi",
  },
  {
    nombre: "Movil",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Suministros",
    color: "#EC4899",
    icono: "smartphone",
  },
  {
    nombre: "Seguros",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Compromisos",
    color: "#F97316",
    icono: "shield",
  },

  // GASTOS VARIABLES (prioridad media)
  {
    nombre: "Comida",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Alimentacion",
    color: "#22C55E",
    icono: "shopping-cart",
  },
  {
    nombre: "Restaurantes",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Alimentacion",
    color: "#16A34A",
    icono: "utensils",
  },
  {
    nombre: "Transporte",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Movilidad",
    color: "#64748B",
    icono: "car",
  },
  {
    nombre: "Gasolina",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Movilidad",
    color: "#78716C",
    icono: "fuel",
  },
  {
    nombre: "Vehiculo",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Movilidad",
    color: "#57534E",
    icono: "truck",
  },
  {
    nombre: "Mantenimiento",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Vivienda",
    color: "#A8A29E",
    icono: "wrench",
  },
  {
    nombre: "Salud",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Bienestar",
    color: "#DC2626",
    icono: "heart",
  },
  {
    nombre: "Suscripciones",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Ocio",
    color: "#7C3AED",
    icono: "credit-card",
  },

  // GASTOS BAJA PRIORIDAD
  {
    nombre: "Ocio",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Lazer",
    color: "#DB2777",
    icono: "film",
  },
  {
    nombre: "Ropa",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Personal",
    color: "#EA580C",
    icono: "shirt",
  },
  {
    nombre: "Regalos",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Social",
    color: "#C026D3",
    icono: "gift",
  },
  {
    nombre: "Otros gastos",
    tipoHabitual: "Gasto",
    presupuestoMensual: 0,
    grupo: "Varios",
    color: "#9CA3AF",
    icono: "more-horizontal",
  },

  // AHORRO
  {
    nombre: "Ahorro",
    tipoHabitual: "Ahorro",
    presupuestoMensual: 0,
    grupo: "Ahorro",
    color: "#059669",
    icono: "piggy-bank",
  },
  {
    nombre: "Fondo de emergencia",
    tipoHabitual: "Ahorro",
    presupuestoMensual: 0,
    grupo: "Ahorro",
    color: "#047857",
    icono: "shield-check",
  },
  {
    nombre: "Pagos futuros",
    tipoHabitual: "Ahorro",
    presupuestoMensual: 0,
    grupo: "Ahorro",
    color: "#065F46",
    icono: "calendar",
  },
];

export function buildCategoryRow(cat: DefaultCategory): Omit<CategoryRow, "categoriaId" | "createdAt" | "updatedAt"> {
  return {
    nombre: cat.nombre,
    tipoHabitual: cat.tipoHabitual,
    presupuestoMensual: cat.presupuestoMensual,
    activo: "S",
    grupo: cat.grupo,
    color: cat.color,
    icono: cat.icono,
    orden: 0,
    notas: "",
  };
}

export function hasCategories(categories: CategoryRow[]): boolean {
  return categories.length > 0;
}

export function getMissingCategories(
  existing: CategoryRow[],
  defaults: DefaultCategory[]
): DefaultCategory[] {
  const existingNames = new Set(
    existing
      .filter((c) => c.activo === "S")
      .map((c) => c.nombre.toLowerCase().trim())
  );

  return defaults.filter(
    (d) => !existingNames.has(d.nombre.toLowerCase().trim())
  );
}