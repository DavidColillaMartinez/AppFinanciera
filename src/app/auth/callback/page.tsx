"use client";

import { useEffect, useState } from "react";
import { getAccessTokenFromUrl, clearHash } from "@/lib/google/auth";
import { useAppStore } from "@/stores/app-store";
import { hasToken } from "@/lib/sheets/client";

export default function AuthCallbackPage() {
  const { setOnboardingSeen, isConnected } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;

    if (!hash || hash === "#") {
      setError("No se recibio token de Google. Intentalo de nuevo.");
      return;
    }

    const token = getAccessTokenFromUrl();
    if (token) {
      sessionStorage.setItem("google_access_token", token);
      clearHash();
      setOnboardingSeen();

      if (isConnected) {
        window.location.replace("/");
      } else {
        window.location.replace("/onboarding?step=sheet");
      }
    } else {
      clearHash();
      setError("Token de acceso invalido o expirado.");
    }
  }, [setOnboardingSeen, isConnected]);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">
            Error de autenticacion
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <a
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Conectando con Google...</p>
      </div>
    </div>
  );
}