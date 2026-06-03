"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Settings,
  Tag,
  Palette,
  HelpCircle,
  Activity,
  ChevronRight,
  Sparkles,
  PiggyBank,
  FileSpreadsheet,
  DollarSign,
  CalendarCheck,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";

export default function MorePage() {
  const { monthlyIncome, incomeType } = useAppStore();

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mas</h1>
        <p className="text-sm text-muted-foreground">
          Configuracion y herramientas adicionales
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Nomina
        </h2>

        <Card className="overflow-hidden transition-all hover:shadow-md border-primary/20">
          <CardContent className="p-0">
            <Link href="/more/salary" className="flex items-center justify-between p-4 active:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-income/10 p-3">
                  <DollarSign className="h-5 w-5 text-income" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Configurar nomina</p>
                  <p className="text-xs text-muted-foreground">
                    {monthlyIncome > 0
                      ? `${incomeType === "fixed" ? "Fija" : "Variable"}: ${monthlyIncome.toFixed(2)} €`
                      : "Define tu ingreso mensual"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {monthlyIncome > 0 && (
                  <span className="px-2 py-1 rounded-full bg-income/20 text-income text-xs font-medium">
                    Activo
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Configuracion
        </h2>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-0">
            <Link href="/fixed-expenses/confirm" className="flex items-center justify-between p-4 active:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-expense/10 p-3">
                  <CalendarCheck className="h-5 w-5 text-expense" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Confirmar gastos del mes</p>
                  <p className="text-xs text-muted-foreground">
                    Revisa y confirma tus gastos fijos mensuales
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-0">
            <Link href="/settings" className="flex items-center justify-between p-4 active:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Categorias</p>
                  <p className="text-xs text-muted-foreground">
                    Gestionar categorias y presupuestos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary/60" />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-0">
            <Link href="/settings/preferencias" className="flex items-center justify-between p-4 active:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Preferencias</p>
                  <p className="text-xs text-muted-foreground">
                    Conexion y configuracion general
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Ahorro
        </h2>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-0">
            <Link href="/savings" className="flex items-center justify-between p-4 active:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-savings/10 p-3">
                  <PiggyBank className="h-5 w-5 text-savings" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Reservas y Ahorros</p>
                  <p className="text-xs text-muted-foreground">
                    Gestionar tus reservas y objetivos de ahorro
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Herramientas
        </h2>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-0">
            <Link href="/more/diagnostico" className="flex items-center justify-between p-4 active:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-warning/10 p-3">
                  <Activity className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Diagnostico Sheet</p>
                  <p className="text-xs text-muted-foreground">
                    Verificar estructura y estado de la plantilla
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-0">
            <Link href="/" className="flex items-center justify-between p-4 active:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Personalizar Dashboard</p>
                  <p className="text-xs text-muted-foreground">
                    Elegir widgets y tipo de grafico
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Soporte
        </h2>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-muted p-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ayuda</p>
                  <p className="text-xs text-muted-foreground">
                    Documentacion y soporte tecnico
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6 space-y-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 text-center space-y-2">
            <FileSpreadsheet className="h-8 w-8 mx-auto text-primary/60" />
            <p className="text-sm font-semibold">AppFinanzas</p>
            <p className="text-xs text-muted-foreground">
              Conecta tu Google Sheet para sincronizar tus datos
            </p>
            <p className="text-xs text-primary font-medium">Version 1.1.1</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}