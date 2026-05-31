"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { isGoogleAuthConfigured } from "@/lib/google/auth";
import { useAppStore } from "@/stores/app-store";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import { validateSheetCompatibility } from "@/lib/sheets/reader";
import { getToken } from "@/lib/sheets/client";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Step = "google" | "sheet" | "validating" | "done" | "error";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const stepParam = searchParams.get("step");

  const { sheetId, isConnected, setSheetConnection, hasSeenOnboarding } =
    useAppStore();
  const [step, setStep] = useState<Step>("google");
  const [sheetUrl, setSheetUrl] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "auth_failed"
      ? "Error al iniciar sesion con Google. Intentalo de nuevo."
      : null,
  );
  const [validating, setValidating] = useState(false);
  const canUseGoogleOAuth = isGoogleAuthConfigured();

  useEffect(() => {
    if (isConnected && sheetId) {
      setStep("done");
    } else if (stepParam === "sheet") {
      setStep("sheet");
    }
  }, [isConnected, sheetId, stepParam]);

  function handleGoogleAuth() {
    router.push("/auth/google");
  }

  async function handleSheetConnect() {
    if (!sheetUrl.trim()) {
      setError("Introduce una URL o ID de Google Sheet.");
      return;
    }

    let parsed = "";
    try {
      const url = new URL(sheetUrl);
      const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        parsed = match[1];
      } else if (
        url.hostname === "docs.google.com" ||
        url.hostname === "drive.google.com"
      ) {
        parsed = sheetUrl.trim();
      }
    } catch {
      parsed = sheetUrl.trim();
    }

    if (!parsed) {
      setError(
        "URL o ID no valido. Asegurate de copiar la URL completa o el ID.",
      );
      return;
    }

    setValidating(true);
    setStep("validating");
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError("Sesion de Google caducada. Conecta de nuevo.");
        setStep("google");
        return;
      }

      const { valid, errors, warnings } = await validateSheetCompatibility(
        parsed,
        Object.values(SHEET_NAMES),
      );

      if (!valid) {
        const missingSheets = errors
          .filter((e) => e.includes("no encontrada"))
          .map((e) => e.replace('no encontrada', 'no encontrada').replace('Hoja "', '').replace('"', ''))
          .join(", ");
        const missingCols = errors.filter((e) => e.includes("faltan columnas"));
        const permissionErrors = errors.filter((e) => e.includes("Sin permisos"));

        if (permissionErrors.length > 0) {
          setError(
            `Sin permisos de lectura. Comparte la hoja con tu cuenta de Google.`,
          );
        } else if (missingSheets) {
          setError(
            `Faltan hojas en tu Sheet: ${missingSheets}. Asegurate de usar la plantilla correcta.`,
          );
        } else if (missingCols.length > 0) {
          setError(
            `Faltan columnas en tu Sheet:\n${missingCols.map((e) => `• ${e}`).join("\n")}\n\nDescarga la plantilla actualizada.`,
          );
        } else {
          setError(`Problemas con la Sheet: ${errors.join("; ")}`);
        }
        setStep("sheet");
        return;
      }

      if (warnings.length > 0) {
        console.warn("Sheet compatibility warnings:", warnings);
      }

      setSheetConnection(
        parsed,
        `https://docs.google.com/spreadsheets/d/${parsed}`,
      );
      setStep("done");
      router.replace("/");
    } catch (e) {
      setError(`Error al conectar con la Sheet: ${(e as Error).message}`);
      setStep("sheet");
    } finally {
      setValidating(false);
    }
  }

  function handleManualPaste() {
    setStep("sheet");
  }

  if (step === "done") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Conectado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tu Google Sheet esta conectada correctamente. Ya puedes usar la
              app.
            </p>
            <Button className="w-full" onClick={() => router.push("/")}>
              Ir al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === "google" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Paso 1: Iniciar sesion
              </CardTitle>
              <CardDescription>
                Accede con tu cuenta de Google para dar permisos a la app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canUseGoogleOAuth ? (
                <Button onClick={handleGoogleAuth} className="w-full" size="lg">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#fff"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#fff"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#fff"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#fff"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Iniciar sesion con Google
                </Button>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
                  <p className="font-medium text-yellow-800">
                    Configuracion pendiente
                  </p>
                  <p className="mt-1 text-yellow-700">
                    La app no tiene NEXT_PUBLIC_GOOGLE_CLIENT_ID configurada.
                    Añadela en Vercel para habilitar el acceso con Google.
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
                onClick={handleManualPaste}
                variant="outline"
                className="w-full"
              >
                Ya tengo sesion - conectar Sheet
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "sheet" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Paso 2: Conectar tu Sheet
              </CardTitle>
              <CardDescription>
                Copia la URL completa de tu Google Sheet y pegala aqui.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium mb-2">Como conseguir la URL:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Abre tu copia de la plantilla en Google Sheets.</li>
                  <li>Copia la URL desde la barra del navegador.</li>
                  <li>Pegala abajo.</li>
                </ol>
              </div>

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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSheetConnect();
                  }}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSheetConnect} className="flex-1">
                  Conectar
                </Button>
                <Button onClick={() => setStep("google")} variant="outline">
                  Atras
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "validating" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="text-4xl">🔍</div>
              <p className="text-muted-foreground">Validando tu Sheet...</p>
            </CardContent>
          </Card>
        )}

        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Seguridad</p>
          <p className="mt-1">
            Tu informacion nunca sale de tu cuenta de Google. La app solo tiene
            permisos de lectura y escritura en la hoja que conectes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
