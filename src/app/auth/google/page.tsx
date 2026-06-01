"use client";

import { useEffect, useState } from "react";
import { getGoogleAuthUrl } from "@/lib/google/auth";

export default function GoogleAuthPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const url = getGoogleAuthUrl();
      window.location.replace(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "OAuth no configurado",
      );
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Error de configuracion OAuth
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">
            Asegurate de que NEXT_PUBLIC_GOOGLE_CLIENT_ID esta configurado en
            Vercel.
          </p>
          <a
            href="/onboarding"
            className="text-primary hover:underline"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">
          Redirigiendo a Google...
        </p>
      </div>
    </div>
  );
}