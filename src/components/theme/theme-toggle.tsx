"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type ThemeOption = "light" | "dark" | "system";

const OPTIONS: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

interface ThemeToggleProps {
  className?: string;
  variant?: "segmented" | "buttons";
}

export function ThemeToggle({ className, variant = "segmented" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const current: ThemeOption =
    theme === "dark" || theme === "light" || theme === "system"
      ? (theme as ThemeOption)
      : "system";

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex rounded-lg border border-border bg-muted/40 p-1",
          className,
        )}
        aria-hidden
      >
        {OPTIONS.map((o) => (
          <div
            key={o.value}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs"
          >
            <o.icon className="h-3.5 w-3.5" />
            <span>{o.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={cn("space-y-2", className)}>
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = current === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setTheme(o.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-3 text-sm transition-all",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{o.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {o.value === "system"
                  ? resolvedTheme === "dark"
                    ? "Oscuro (sistema)"
                    : "Claro (sistema)"
                  : active
                    ? "Activo"
                    : "Cambiar"}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-border bg-muted/40 p-1",
        className,
      )}
      role="radiogroup"
      aria-label="Tema"
    >
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
