"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <div className={cn("min-h-dvh bg-background text-foreground")}>
        {children}
      </div>
    </ThemeProvider>
  );
}
