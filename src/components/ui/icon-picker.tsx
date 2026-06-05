"use client";

import { useState, useMemo } from "react";
import {
  Tag,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  HeartPulse,
  Fuel,
  Plane,
  GraduationCap,
  Baby,
  PawPrint,
  Gift,
  Music,
  Tv,
  Wifi,
  Smartphone,
  CreditCard,
  Banknote,
  Wallet,
  PiggyBank,
  TrendingUp,
  Briefcase,
  Coffee,
  Shirt,
  Wrench,
  Hammer,
  Sprout,
  Star,
  Zap,
  Droplet,
  Flame,
  Bike,
  Bus,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ICON_OPTIONS = [
  { value: "Tag", label: "Etiqueta" },
  { value: "ShoppingCart", label: "Compra" },
  { value: "Home", label: "Hogar" },
  { value: "Car", label: "Coche" },
  { value: "Utensils", label: "Comida" },
  { value: "HeartPulse", label: "Salud" },
  { value: "Fuel", label: "Gasolina" },
  { value: "Plane", label: "Viaje" },
  { value: "GraduationCap", label: "Formación" },
  { value: "Baby", label: "Bebé" },
  { value: "PawPrint", label: "Mascota" },
  { value: "Gift", label: "Regalo" },
  { value: "Music", label: "Música" },
  { value: "Tv", label: "Ocio" },
  { value: "Wifi", label: "Internet" },
  { value: "Smartphone", label: "Móvil" },
  { value: "CreditCard", label: "Tarjeta" },
  { value: "Banknote", label: "Efectivo" },
  { value: "Wallet", label: "Cartera" },
  { value: "PiggyBank", label: "Ahorro" },
  { value: "TrendingUp", label: "Inversión" },
  { value: "Briefcase", label: "Trabajo" },
  { value: "Coffee", label: "Café" },
  { value: "Shirt", label: "Ropa" },
  { value: "Wrench", label: "Reparación" },
  { value: "Hammer", label: "Obra" },
  { value: "Sprout", label: "Planta" },
  { value: "Star", label: "Estrella" },
  { value: "Zap", label: "Luz" },
  { value: "Droplet", label: "Agua" },
  { value: "Flame", label: "Calefacción" },
  { value: "Bike", label: "Bici" },
  { value: "Bus", label: "Transporte" },
  { value: "Trash2", label: "Basura" },
  { value: "HelpCircle", label: "Otro" },
] as const;

const ICON_MAP: Record<string, typeof Tag> = {
  Tag,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  HeartPulse,
  Fuel,
  Plane,
  GraduationCap,
  Baby,
  PawPrint,
  Gift,
  Music,
  Tv,
  Wifi,
  Smartphone,
  CreditCard,
  Banknote,
  Wallet,
  PiggyBank,
  TrendingUp,
  Briefcase,
  Coffee,
  Shirt,
  Wrench,
  Hammer,
  Sprout,
  Star,
  Zap,
  Droplet,
  Flame,
  Bike,
  Bus,
  Trash2,
  HelpCircle,
};

export function renderIcon(
  name: string | undefined | null,
  className?: string,
  fallback = Tag,
) {
  if (!name) {
    const Fallback = fallback;
    return <Fallback className={className} />;
  }
  const Icon = ICON_MAP[name] ?? fallback;
  return <Icon className={className} />;
}

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showPreview?: boolean;
  gridCols?: number;
}

export function IconPicker({
  value,
  onChange,
  className,
  showPreview = true,
  gridCols = 6,
}: IconPickerProps) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ICON_OPTIONS;
    return ICON_OPTIONS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className={cn("space-y-2", className)}>
      {showPreview && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            {renderIcon(value, "h-5 w-5")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Icono seleccionado</p>
            <p className="text-sm font-medium truncate">
              {ICON_OPTIONS.find((i) => i.value === value)?.label ?? (value || "Sin icono")}
            </p>
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar icono..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
      />

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {filtered.map((opt) => {
          const Icon = ICON_MAP[opt.value] ?? Tag;
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md border p-2 transition-all",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] truncate w-full text-center">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Sin resultados.
        </p>
      )}
    </div>
  );
}
