"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGoogleAuthUrl, isGoogleAuthConfigured } from "@/lib/google/auth";
import { parseSheetId, buildSpreadsheetUrl } from "@/lib/google/types";
import { AlertCircle, CheckCircle2, Link2 } from "lucide-react";

type ConnectionStep = "start" | "paste" | "connected" | "error";

export default function OnboardingPage() {
  const [step, setStep] = useState<ConnectionStep>("start");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUseGoogleOAuth = isGoogleAuthConfigured();

  function handlePasteNext() {
    const parsed = parseSheetId(sheetUrl);
    if (!parsed) {
      setError(
        "URL o ID de Google Sheets no valido. Asegurate de copiar la URL completa o el ID.",
      );
      return;
    }
    setSheetId(parsed);
    setError(null);
  }

  function handleGoogleAuth() {
    const url = getGoogleAuthUrl();
    window.location.href = url;
  }

  function handleManualConnect() {
    setStep("paste");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Conectar Google Sheet
          </h1>
          <p className="text-sm text-muted-foreground">
            Vincula tu copia de la plantilla de finanzas personales.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Paso 1: Copia la plantilla
            </CardTitle>
            <CardDescription>
              Si no tienes la plantilla, descargala desde el repositorio del
              proyecto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>1. Haz una copia de la plantilla en tu Google Drive.</p>
              <p>2. Abre la copia y copia la URL completa del navegador.</p>
              <p>3. Pegala abajo para conectarla.</p>
            </div>
          </CardContent>
        </Card>

        {step === "start" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paso 2: Conectar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canUseGoogleOAuth ? (
                <Button onClick={handleGoogleAuth} className="w-full">
                  <Link2 className="h-4 w-4 mr-2" />
                  Autorizar con Google
                </Button>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
                  <p className="font-medium text-yellow-800">
                    Configuracion pendiente
                  </p>
                  <p className="mt-1 text-yellow-700">
                    Añade NEXT_PUBLIC_GOOGLE_CLIENT_ID en tu archivo .env.local
                    para habilitar el acceso con Google.
                  </p>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    o
                  </span>
                </div>
              </div>

              <Button
                onClick={handleManualConnect}
                variant="outline"
                className="w-full"
              >
                Pegar URL manualmente
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "paste" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pegar URL de Google Sheet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sheet-url">URL o ID de la hoja</Label>
                <Input
                  id="sheet-url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={sheetUrl}
                  onChange={(e) => {
                    setSheetUrl(e.target.value);
                    setError(null);
                  }}
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={handlePasteNext} className="flex-1">
                  Continuar
                </Button>
                <Button onClick={() => setStep("start")} variant="outline">
                  Atras
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "connected" && sheetId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Conectado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tu Google Sheet esta conectada.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a
                  href={buildSpreadsheetUrl(sheetId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir hoja
                </a>
              </Button>
              <Button className="w-full">Ir al dashboard</Button>
            </CardContent>
          </Card>
        )}

        {!canUseGoogleOAuth && (
          <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Nota sobre seguridad</p>
            <p className="mt-1">
              Tu informacion nunca sale de tu cuenta de Google. La app solo
              tiene permisos de lectura y escritura en la hoja que conectes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
