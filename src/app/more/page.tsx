"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { clearToken } from "@/lib/sheets/client";
import { useRouter } from "next/navigation";
import {
  Settings,
  Tag,
  FileSpreadsheet,
  RefreshCw,
  Link,
  Unlink,
  Palette,
  HelpCircle,
  Activity,
} from "lucide-react";

export default function MorePage() {
  const { sheetId, sheetUrl, isConnected, disconnect } = useAppStore();
  const router = useRouter();

  function handleReconnect() {
    clearToken();
    router.push("/auth/google");
  }

  function handleChangeSheet() {
    disconnect();
    router.push("/onboarding");
  }

  function handleDisconnect() {
    if (confirm("¿Desconectar la Sheet? Tendrás que volver a conectarla.")) {
      clearToken();
      disconnect();
      router.push("/onboarding");
    }
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Más</h1>
        <p className="text-sm text-muted-foreground">
          Configuración y herramientas adicionales
        </p>
      </div>

      <div className="space-y-2">
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-4">
            <a href="/settings" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Ajustes</p>
                  <p className="text-xs text-muted-foreground">
                    Preferencias y configuración
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-4">
            <a href="/settings?tab=categories" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Categorías</p>
                  <p className="text-xs text-muted-foreground">
                    Gestionar categorías y presupuestos
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Conexión
        </h2>

        {isConnected && sheetId && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-income/10 p-2.5">
                    <FileSpreadsheet className="h-5 w-5 text-income" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Sheet conectada</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sheetId}
                    </p>
                  </div>
                </div>
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Link className="h-4 w-4" />
                      Abrir en Google Sheets
                    </Button>
                  </a>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleReconnect}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reconectar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleChangeSheet}
                  >
                    <Link className="h-4 w-4" />
                    Cambiar
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleDisconnect}
                >
                  <Unlink className="h-4 w-4" />
                  Desconectar Sheet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isConnected && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-expense/10 p-2.5">
                  <Unlink className="h-5 w-5 text-expense" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Sin conexión</p>
                  <p className="text-xs text-muted-foreground">
                    Conecta tu Google Sheet
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-3 gap-2"
                onClick={() => router.push("/onboarding")}
              >
                <Link className="h-4 w-4" />
                Conectar Sheet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Herramientas
        </h2>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-4">
            <a href="/#customize" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Personalizar Dashboard</p>
                  <p className="text-xs text-muted-foreground">
                    Elegir widgets y tipo de grafico
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-4">
            <a href="/more/diagnostico" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Diagnóstico Sheet</p>
                  <p className="text-xs text-muted-foreground">
                    Verificar estructura de la plantilla
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Ayuda</p>
                <p className="text-xs text-muted-foreground">
                  Documentación y soporte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          AppFinanzas v1.1.1
        </p>
      </div>
    </div>
  );
}
