"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { BottomNav } from "@/components/bottom-nav";
import { ToastProvider } from "@/components/ui/toast";
import { hasToken } from "@/lib/sheets/client";
import { queryClientDefaultOptions } from "@/lib/query-client";

const PUBLIC_ROUTES = [
  "/onboarding",
  "/auth/google",
  "/auth/callback",
  "/_not-found",
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: queryClientDefaultOptions })
  );

  const { isConnected, hasSeenOnboarding, sheetId, setAuthStatus } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isPublicRoute = PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    if (!hasToken() && sheetId) {
      setAuthStatus("expired");
    } else if (hasToken() && isConnected) {
      setAuthStatus("authenticated");
    } else if (!hasToken()) {
      setAuthStatus("missing");
    }

    if (isPublicRoute) return;

    if (!hasSeenOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (isConnected && !hasToken()) {
      router.replace("/onboarding?error=auth_failed&step=google");
      return;
    }

    if (!isConnected && hasToken()) {
      router.replace("/onboarding?step=sheet");
      return;
    }

    if (!isConnected && !hasToken()) {
      router.replace("/onboarding?error=auth_required");
      return;
    }
  }, [mounted, hasSeenOnboarding, isConnected, sheetId, pathname, router, setAuthStatus]);

  useEffect(() => {
    function handleAuthExpired() {
      setAuthStatus("expired");
      const isPublicRoute = PUBLIC_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );
      if (!isPublicRoute) {
        router.replace("/onboarding?error=auth_failed&step=google");
      }
    }
    window.addEventListener("appfinanzas:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("appfinanzas:auth-expired", handleAuthExpired);
  }, [pathname, router, setAuthStatus]);

  if (!mounted) {
    return null;
  }

  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <>
            <div className={cn("min-h-dvh bg-background text-foreground")}>
              {children}
            </div>
            {isConnected && hasToken() && <BottomNav />}
          </>
        </ThemeProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}