"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { clearToken, getToken } from "@/lib/sheets/client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileSpreadsheet,
  RefreshCw,
  Unlink,
  Link as LinkIcon,
  LogOut,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function PreferenciasPage() {
  const {
    sheetId,
    sheetUrl,
    isConnected,
    disconnect,
    logoutGoogle,
    lastConnectedAt,
    templateVersion,
  } = useAppStore();
  const router = useRouter();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function handleChangeSheet() {
    disconnect();
    router.push("/onboarding?step=sheet");
  }

  function handleDisconnectSheet() {
    setShowDisconnectConfirm(true);
  }

  function onConfirmDisconnect() {
    disconnect();
    localStorage.removeItem("last_sheet_url");
    router.push("/onboarding?step=sheet");
    success("Sheet desconectada. Sesión de Google mantenida.");
  }

  async function handleLogout() {
    setShowLogoutConfirm(true);
  }

  async function onConfirmLogout() {
    setLoggingOut(true);

    const token = getToken();

    if (token) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
          { method: "POST" },
        );
      } catch {
        // Revoke failure is acceptable — clear local state regardless
      }
    }

    clearToken();
    logoutGoogle();
    queryClient.clear();

    success("Sesión de Google cerrada.");

    window.location.href = "/onboarding";
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
          Conexión
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
                  {sheetUrl && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {sheetUrl}
                    </p>
                  )}
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

              {lastConnectedAt && (
                <p className="text-xs text-muted-foreground">
                  Conectada el {new Date(lastConnectedAt).toLocaleString("es-ES")}
                </p>
              )}
              {templateVersion && (
                <p className="text-xs text-muted-foreground">
                  Versión de plantilla: {templateVersion}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

              <p className="text-xs text-muted-foreground">
                Cambiar o desconectar la Sheet no cierra tu sesión de Google.
              </p>

              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {loggingOut ? "Cerrando sesión..." : "Cerrar sesión de Google"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Al cerrar sesión de Google también se desconecta la Sheet actual.
              </p>
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
                  <p className="font-medium text-sm">Sin conexión</p>
                  <p className="text-xs text-muted-foreground">
                    Conecta tu Google Sheet
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-3 gap-2"
                onClick={() => {
                  if (getToken()) {
                    window.location.href = "/onboarding?step=sheet";
                  } else {
                    window.location.href = "/onboarding?error=auth_required";
                  }
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
          Información
        </h2>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Versión de la app</span>
              <span className="text-sm font-medium">1.1.1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Moneda</span>
              <span className="text-sm font-medium">EUR</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
        title="Desconectar Sheet"
        description="La sesión de Google se mantiene. Podrás conectar otra hoja sin volver a iniciar sesión."
        confirmLabel="Desconectar"
        destructive={false}
        onConfirm={onConfirmDisconnect}
      />

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Cerrar sesión de Google"
        description="Se desconectará también la Sheet actual y tendrás que volver a iniciar sesión."
        confirmLabel="Cerrar sesión"
        destructive={true}
        onConfirm={onConfirmLogout}
      />
    </div>
  );
}
