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
import { validateSheetCompatibility, readConfig } from "@/lib/sheets/reader";
import { getToken, hasToken } from "@/lib/sheets/client";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import {
  copyTemplateToUserDrive,
  getTemplateSheetIdOrThrow,
} from "@/lib/google/drive";

type Step = "google" | "sheet" | "validating" | "creating" | "done";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const stepParam = searchParams.get("step");

  const {
    sheetId,
    sheetUrl: storedSheetUrl,
    isConnected,
    setSheetConnection,
    setTemplateVersion,
    setAuthStatus,
  } = useAppStore();
  const [step, setStep] = useState<Step>("google");
  const [sheetUrl, setSheetUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("last_sheet_url") ??
        (useAppStore.getState().sheetUrl ?? "")
      );
    }
    return "";
  });
  const [error, setError] = useState<string | null>(
    errorParam === "auth_failed"
      ? "Tu sesión de Google ha caducado. Vuelve a iniciarla para continuar."
      : errorParam === "auth_required"
        ? "Necesitas iniciar sesión con Google para usar la app."
        : null,
  );
  const [showManualInput, setShowManualInput] = useState(false);
  const canUseGoogleOAuth = isGoogleAuthConfigured();

  useEffect(() => {
    const token = getToken();
    if (errorParam === "auth_failed" || errorParam === "auth_required") {
      setStep("google");
      return;
    }
    if (stepParam === "sheet" && token) {
      setStep("sheet");
      return;
    }
    if (stepParam === "sheet" && !token) {
      setStep("google");
      return;
    }
    if (!token) {
      setStep("google");
      return;
    }
    if (isConnected && sheetId) {
      setStep("done");
    }
  }, [isConnected, sheetId, stepParam, errorParam]);

  function handleGoogleAuth() {
    window.location.href = "/auth/google";
  }

  async function handleAutoCreate() {
    setError(null);
    setStep("creating");

    try {
      const templateId = getTemplateSheetIdOrThrow();
      const result = await copyTemplateToUserDrive(templateId);
      const newSheetId = result.fileId;
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`;

      setStep("validating");

      const ESSENTIAL_SHEETS = [
        SHEET_NAMES.CONFIG,
        SHEET_NAMES.MOVIMIENTOS,
        SHEET_NAMES.CATEGORIAS,
        SHEET_NAMES.CUENTAS,
      ];

      const { valid, errors, warnings } = await validateSheetCompatibility(
        newSheetId,
        ESSENTIAL_SHEETS,
      );

      if (!valid) {
        setError(
          `La copia se creó pero la validación falló: ${errors.join("; ")}. ` +
            "Puedes intentar conectar la hoja manualmente desde la opción inferior.",
        );
        setStep("sheet");
        return;
      }

      if (warnings.length > 0) {
        console.warn("Sheet compatibility warnings:", warnings);
      }

      try {
        const config = await readConfig(newSheetId);
        setTemplateVersion(
          config["templateVersion"] ?? null,
          config["appMinVersion"] ?? null,
        );
      } catch (e) {
        console.warn("Could not read Config sheet:", (e as Error).message);
      }

      setSheetConnection(newSheetId, sheetUrl);
      localStorage.setItem("last_sheet_url", sheetUrl);
      setAuthStatus("authenticated");
      setStep("done");
      router.replace("/");
    } catch (e) {
      setError((e as Error).message);
      setStep("sheet");
    }
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
        "URL o ID no válido. Asegúrate de copiar la URL completa o el ID.",
      );
      return;
    }

    setShowManualInput(false);
    setError(null);
    setStep("validating");

    try {
      const token = getToken();
      if (!token) {
        setError("Sesión de Google caducada. Vuelve a iniciar sesión.");
        setStep("google");
        return;
      }

      const ESSENTIAL_SHEETS = [
        SHEET_NAMES.CONFIG,
        SHEET_NAMES.MOVIMIENTOS,
        SHEET_NAMES.CATEGORIAS,
        SHEET_NAMES.CUENTAS,
      ];

      const { valid, errors, warnings } = await validateSheetCompatibility(
        parsed,
        ESSENTIAL_SHEETS,
      );

      if (!valid) {
        const missingSheets = errors
          .filter((e) => e.includes("no encontrada"))
          .map((e) =>
            e
              .replace("no encontrada", "no encontrada")
              .replace('Hoja "', "")
              .replace('"', ""),
          )
          .join(", ");
        const missingCols = errors.filter((e) =>
          e.includes("faltan columnas"),
        );
        const permissionErrors = errors.filter((e) =>
          e.includes("Sin permisos"),
        );

        if (permissionErrors.length > 0) {
          setError(
            "Sin permisos de lectura. Asegúrate de haber iniciado sesión con la cuenta que tiene acceso a la hoja.",
          );
        } else if (missingSheets) {
          setError(
            `Faltan hojas en tu Sheet: ${missingSheets}. Asegúrate de usar la plantilla correcta.`,
          );
        } else if (missingCols.length > 0) {
          setError(
            `Faltan columnas en tu Sheet:\n${missingCols.map((e) => `• ${e}`).join("\n")}\n\nDescarga la plantilla actualizada desde el enlace de ayuda.`,
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

      try {
        const config = await readConfig(parsed);
        setTemplateVersion(
          config["templateVersion"] ?? null,
          config["appMinVersion"] ?? null,
        );
      } catch (e) {
        console.warn("Could not read Config sheet:", (e as Error).message);
      }

      const ADVANCED_SHEETS = [
        SHEET_NAMES.GASTOS_FIJOS,
        SHEET_NAMES.PAGOS_FUTUROS,
        SHEET_NAMES.PAGOS_APLAZADOS,
        SHEET_NAMES.RESERVAS,
        SHEET_NAMES.OBJETIVOS,
        SHEET_NAMES.MOV_RESERVAS,
      ];

      const advancedValidation = await validateSheetCompatibility(
        parsed,
        ADVANCED_SHEETS,
      );

      if (
        advancedValidation.warnings.length > 0 ||
        !advancedValidation.valid
      ) {
        console.warn(
          "Advanced features not fully available:",
          advancedValidation,
        );
      }

      setSheetConnection(
        parsed,
        `https://docs.google.com/spreadsheets/d/${parsed}`,
      );
      localStorage.setItem(
        "last_sheet_url",
        `https://docs.google.com/spreadsheets/d/${parsed}`,
      );
      setAuthStatus("authenticated");
      setStep("done");
      router.replace("/");
    } catch (e) {
      setError(`Error al conectar con la Sheet: ${(e as Error).message}`);
      setStep("sheet");
    }
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
              Tu Google Sheet está conectada correctamente. Ya puedes usar la
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
            AppFinanciera
          </h1>
          <p className="text-sm text-muted-foreground">
            Controla tus finanzas personales desde tu Google Drive.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {step === "google" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Iniciar sesión
              </CardTitle>
              <CardDescription>
                Accede con tu cuenta de Google para empezar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canUseGoogleOAuth ? (
                <Button
                  onClick={handleGoogleAuth}
                  className="w-full"
                  size="lg"
                >
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
                  {hasToken()
                    ? "Re-conectar sesión"
                    : "Iniciar sesión con Google"}
                </Button>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm">
                  <p className="font-medium text-yellow-800">
                    Configuración pendiente
                  </p>
                  <p className="mt-1 text-yellow-700">
                    La app no tiene NEXT_PUBLIC_GOOGLE_CLIENT_ID configurada.
                    Añádela en Vercel para habilitar el acceso con Google.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "sheet" && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer border-primary/30 hover:border-primary/60 transition-colors"
              onClick={handleAutoCreate}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Crear mi hoja automáticamente
                </CardTitle>
                <CardDescription>
                  Crearemos una copia privada de la plantilla oficial en tu
                  Google Drive. La hoja será tuya y solo tú tendrás acceso.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="text-center">
              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                {showManualInput
                  ? "Ocultar"
                  : "Conectar una hoja existente"}
              </button>
            </div>

            {showManualInput && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Conectar hoja existente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {storedSheetUrl && (
                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      <p>Última hoja conectada:</p>
                      <p className="font-mono truncate mt-1">
                        {storedSheetUrl}
                      </p>
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto p-0 mt-2"
                        onClick={() => setSheetUrl(storedSheetUrl)}
                      >
                        Reutilizar
                      </Button>
                    </div>
                  )}

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

                  <Button
                    onClick={handleSheetConnect}
                    className="w-full"
                    variant="outline"
                  >
                    Conectar
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="rounded-lg border p-3 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-xs">
                Privacidad
              </p>
              <p className="text-xs">
                No necesitas hacer pública tu hoja. La app accede mediante tu
                cuenta de Google y los permisos que aceptes. La copia se crea
                en tu Drive y será tuya.
              </p>
            </div>

            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground text-center list-none">
                <span className="group-open:hidden">
                  ¿Problemas? Más opciones
                </span>
                <span className="hidden group-open:inline">
                  Ocultar ayuda
                </span>
              </summary>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <p>
                  Si usas el Excel manualmente, súbelo a Drive y conviértelo a
                  Google Sheets antes de conectarlo.
                </p>
                <a
                  href="https://github.com/DavidColillaMartinez/AppFinanciera/raw/master/plantilla_base_finanzas_app.xlsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Descargar plantilla Excel
                </a>
              </div>
            </details>

            <div className="text-center">
              <button
                onClick={() => setStep("google")}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                Volver a inicio de sesión
              </button>
            </div>
          </div>
        )}

        {step === "creating" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Creando copia de la plantilla en tu Drive...
              </p>
            </CardContent>
          </Card>
        )}

        {step === "validating" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Validando tu hoja...</p>
            </CardContent>
          </Card>
        )}
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
