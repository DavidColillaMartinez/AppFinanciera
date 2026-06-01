"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { clearToken } from "@/lib/sheets/client";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  RefreshCw,
  Unlink,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function PreferenciasPage() {
  const { sheetId, sheetUrl, isConnected, disconnect } = useAppStore();
  const router = useRouter();
  const { success } = useToast();

  function handleChangeSheet() {
    disconnect();
    router.push("/onboarding?step=sheet");
  }

  function handleDisconnectSheet() {
    if (confirm("¿Desconectar la Sheet? La sesion de Google se mantiene.")) {
      disconnect();
      router.push("/onboarding?step=sheet");
      success("Sheet desconectada");
    }
  }

  function handleDisconnectGoogle() {
    if (confirm("¿Cerrar sesion de Google? Tendras que volver a iniciar sesion.")) {
      clearToken();
      disconnect();
      window.location.href = "/onboarding";
    }
  }

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Preferencias</h1>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Categorias
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Conexion
        </h2>

        {isConnected && sheetId && (
          <Card>
            <CardContent className="p-4 space-y-4">
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
                    <LinkIcon className="h-4 w-4" />
                    Abrir en Google Sheets
                  </Button>
                </a>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleChangeSheet}
                >
                  <RefreshCw className="h-4 w-4" />
                  Cambiar Sheet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleDisconnectSheet}
                >
                  <Unlink className="h-4 w-4" />
                  Desconectar
                </Button>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={handleDisconnectGoogle}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesion de Google
              </Button>
            </CardContent>
          </Card>
        )}

        {!isConnected && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-expense/10 p-2.5">
                  <Unlink className="h-5 w-5 text-expense" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Sin conexion</p>
                  <p className="text-xs text-muted-foreground">
                    Conecta tu Google Sheet
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-3 gap-2"
                onClick={() => {
                  window.location.href = "/onboarding";
                }}
              >
                <LinkIcon className="h-4 w-4" />
                Conectar Sheet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Informacion
        </h2>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Version de la app</span>
              <span className="text-sm font-medium">1.1.1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Moneda</span>
              <span className="text-sm font-medium">EUR</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}