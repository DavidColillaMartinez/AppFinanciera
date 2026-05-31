"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/app-store";
import { getToken } from "@/lib/sheets/client";
import { validateSheetCompatibility } from "@/lib/sheets/reader";
import { SHEET_NAMES } from "@/constants/sheet-structure";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Wrench,
} from "lucide-react";

type DiagnosticResult = {
  token: boolean;
  sheetId: string | null;
  essentialSheets: { name: string; status: "ok" | "missing" | "error"; error?: string }[];
  advancedSheets: { name: string; status: "ok" | "missing" | "error"; error?: string }[];
};

const ESSENTIAL_SHEETS = [
  SHEET_NAMES.CONFIG,
  SHEET_NAMES.MOVIMIENTOS,
  SHEET_NAMES.CATEGORIAS,
  SHEET_NAMES.CUENTAS,
];

const ADVANCED_SHEETS = [
  SHEET_NAMES.GASTOS_FIJOS,
  SHEET_NAMES.PAGOS_FUTUROS,
  SHEET_NAMES.PAGOS_APLAZADOS,
  SHEET_NAMES.RESERVAS,
  SHEET_NAMES.OBJETIVOS,
  SHEET_NAMES.MOV_RESERVAS,
];

export default function DiagnosticoPage() {
  const { sheetId, isConnected } = useAppStore();
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  async function runDiagnostic() {
    setIsLoading(true);
    const token = getToken();

    const result: DiagnosticResult = {
      token: !!token,
      sheetId,
      essentialSheets: [],
      advancedSheets: [],
    };

    if (!token || !sheetId) {
      setDiagnostic(result);
      setIsLoading(false);
      return;
    }

    const validation = await validateSheetCompatibility(sheetId, [
      ...ESSENTIAL_SHEETS,
      ...ADVANCED_SHEETS,
    ]);

    for (const name of ESSENTIAL_SHEETS) {
      const errors = validation.errors.filter((e) => e.includes(`"${name}"`));
      if (errors.length === 0) {
        result.essentialSheets.push({ name, status: "ok" });
      } else if (errors.some((e) => e.includes("no encontrada"))) {
        result.essentialSheets.push({ name, status: "missing", error: errors[0] });
      } else {
        result.essentialSheets.push({ name, status: "error", error: errors[0] });
      }
    }

    for (const name of ADVANCED_SHEETS) {
      const errors = validation.errors.filter((e) => e.includes(`"${name}"`));
      if (errors.length === 0) {
        result.advancedSheets.push({ name, status: "ok" });
      } else if (errors.some((e) => e.includes("no encontrada"))) {
        result.advancedSheets.push({ name, status: "missing", error: errors[0] });
      } else {
        result.advancedSheets.push({ name, status: "error", error: errors[0] });
      }
    }

    setDiagnostic(result);
    setIsLoading(false);
  }

  useEffect(() => {
    runDiagnostic();
  }, [sheetId]);

  const allEssentialOk = diagnostic?.essentialSheets.every((s) => s.status === "ok");
  const hasMissingAdvanced = diagnostic?.advancedSheets.some((s) => s.status === "missing");

  return (
    <div className="px-4 py-6 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Diagnostico</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={runDiagnostic}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de conexion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Token de Google</span>
            <Badge variant={diagnostic?.token ? "success" : "destructive"}>
              {diagnostic?.token ? "Activo" : "No activo"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Sheet ID</span>
            <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
              {diagnostic?.sheetId ?? "No conectado"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Conexion</span>
            <Badge variant={isConnected ? "success" : "outline"}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Hojas esenciales
            {allEssentialOk && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {diagnostic?.essentialSheets.map((sheet) => (
            <div
              key={sheet.name}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                {sheet.status === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : sheet.status === "missing" ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">{sheet.name}</span>
              </div>
              <Badge
                variant={
                  sheet.status === "ok"
                    ? "success"
                    : sheet.status === "missing"
                      ? "destructive"
                      : "outline"
                }
              >
                {sheet.status === "ok" ? "OK" : sheet.status === "missing" ? "Falta" : "Error"}
              </Badge>
            </div>
          ))}
          {isLoading && <p className="text-sm text-muted-foreground">Verificando...</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hojas avanzadas (opcionales)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {diagnostic?.advancedSheets.map((sheet) => (
            <div
              key={sheet.name}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                {sheet.status === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : sheet.status === "missing" ? (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm">{sheet.name}</span>
              </div>
              <Badge
                variant={
                  sheet.status === "ok"
                    ? "success"
                    : sheet.status === "missing"
                      ? "outline"
                      : "outline"
                }
              >
                {sheet.status === "ok" ? "OK" : sheet.status === "missing" ? "No usada" : "Error"}
              </Badge>
            </div>
          ))}
          {isLoading && <p className="text-sm text-muted-foreground">Verificando...</p>}
        </CardContent>
      </Card>

      {hasMissingAdvanced && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Funciones opcionales no disponibles
                </p>
                <p className="text-xs text-blue-700">
                  Algunas hojas avanzadas no existen en tu Sheet. Las funciones de gastos fijos,
                  pagos futuros, aplazados, reservas y objetivos no estaran disponibles hasta
                  que añadas esas hojas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!allEssentialOk && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-900">
                  Faltan hojas esenciales
                </p>
                <p className="text-xs text-red-700">
                  Tu Sheet no tiene todas las hojas necesarias. Asegurate de usar la plantilla
                  correcta o crea las hojas faltantes manualmente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
