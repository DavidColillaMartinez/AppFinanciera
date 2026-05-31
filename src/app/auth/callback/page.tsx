"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAccessTokenFromUrl, clearHash } from "@/lib/google/auth";
import { useAppStore } from "@/stores/app-store";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOnboardingSeen, isConnected } = useAppStore();

  useEffect(() => {
    const token = getAccessTokenFromUrl();
    if (token) {
      sessionStorage.setItem("google_access_token", token);
      clearHash();
      setOnboardingSeen();

      if (isConnected) {
        router.replace("/");
      } else {
        router.replace("/onboarding?step=sheet");
      }
    } else {
      clearHash();
      router.replace("/onboarding?error=auth_failed");
    }
  }, [router, setOnboardingSeen, isConnected]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl">🔐</div>
        <p className="text-muted-foreground">Conectando con Google...</p>
      </div>
    </div>
  );
}
