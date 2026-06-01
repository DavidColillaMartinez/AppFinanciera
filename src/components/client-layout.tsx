"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { BottomNav } from "@/components/bottom-nav";
import { ToastProvider } from "@/components/ui/toast";
import { getToken } from "@/lib/sheets/client";

const PUBLIC_ROUTES = ["/onboarding", "/auth/google", "/auth/callback", "/_not-found", "/settings", "/settings/preferencias"];

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

  const { isConnected, hasSeenOnboarding, disconnect } = useAppStore();
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
      return;
    }

    const token = getToken();
    if (!token) {
      disconnect();
      router.replace("/onboarding?error=auth_required");
    }
  }, [mounted, hasSeenOnboarding, isConnected, pathname, router, disconnect]);

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
            {isConnected && <BottomNav />}
          </>
        </ThemeProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}