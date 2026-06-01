"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";

function GoogleReconnectPrompt() {
  function handleReconnect() {
    window.location.href = "/auth/google";
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <div className="text-6xl">🔐</div>
          <h1 className="text-2xl font-bold tracking-tight">
            Sesion Caducada
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu sesion de Google ha expirado. Pulsa el boton para conectar de
            nuevo y continuar usando la app.
          </p>
        </div>
        <Button
          onClick={handleReconnect}
          className="w-full gap-2"
          size="lg"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Conectar con Google
        </Button>
      </div>
    </div>
  );
}

const PUBLIC_ROUTES = ["/onboarding", "/auth/google", "/auth/callback", "/_not-found"];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  const { isConnected, hasSeenOnboarding } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      pathname === route || pathname.startsWith(route + "/")
    );
    if (isPublicRoute) return;

    if (!hasSeenOnboarding || !isConnected) {
      router.replace("/onboarding");
    }
  }, [mounted, hasSeenOnboarding, isConnected, pathname, router]);

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {!hasSeenOnboarding || !isConnected ? (
          <>
            <div className={cn("min-h-dvh bg-background text-foreground")}>
              {children}
            </div>
            {isConnected && <BottomNav />}
          </>
        ) : (
          <>
            <div className={cn("min-h-dvh bg-background text-foreground")}>
              {children}
            </div>
            <BottomNav />
          </>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}