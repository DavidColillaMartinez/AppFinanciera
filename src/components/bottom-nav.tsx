"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowLeftRight, Wallet, Target, Settings, PiggyBank } from "lucide-react";

const navItems: { href: `/${string}`; label: string; icon: typeof Home }[] = [
  { href: "/", label: "Mes", icon: Home },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/savings", label: "Ahorros", icon: PiggyBank },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/more", label: "Más", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
      aria-label="Navegacion principal"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 text-xs transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute inset-x-2 -top-3 h-6 rounded-full bg-primary/10" />
              )}
              <span
                className={cn(
                  "relative z-10 transition-transform duration-200",
                  isActive && "scale-110",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </span>
              <span
                className={cn(
                  "relative z-10 font-medium transition-colors duration-200",
                  isActive && "text-primary",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
