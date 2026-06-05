"use client";

import { useState } from "react";
import { Download, Check, Share2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall, getPwaSupportSnapshot } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";

interface InstallAppButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

const initialSnapshot = getPwaSupportSnapshot();

export function InstallAppButton({
  className,
  variant = "default",
  size = "sm",
  showLabel = true,
}: InstallAppButtonProps) {
  const state = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (state.installed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        disabled
        className={cn("gap-2", className)}
        aria-label="App instalada"
      >
        <Check className="h-4 w-4" />
        {showLabel && <span>App instalada</span>}
      </Button>
    );
  }

  const label = state.support === "ios" ? "Instalar AppFinanciera" : "Instalar AppFinanciera";

  if (state.support === "unsupported" && state.isReady) {
    return null;
  }

  if (state.support === "ios") {
    return (
      <>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
          onClick={() => setShowIosHelp(true)}
        >
          <Download className="h-4 w-4" />
          {showLabel && <span>{label}</span>}
        </Button>
        <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Instalar en iPhone
              </DialogTitle>
              <DialogDescription>
                Sigue estos pasos para añadir AppFinanciera a tu pantalla de inicio.
              </DialogDescription>
            </DialogHeader>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  1
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  Pulsa el botón
                  <Share2 className="inline h-4 w-4 text-primary" />
                  Compartir en la barra inferior.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  2
                </span>
                <span>Selecciona &ldquo;Añadir a pantalla de inicio&rdquo;.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  3
                </span>
                <span>Pulsa &ldquo;Añadir&rdquo;. La app aparecerá en tu pantalla de inicio.</span>
              </li>
            </ol>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <InstallNativeElement onReady={state.isReady} />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={() => {
          void state.promptInstall();
        }}
      >
        <Download className="h-4 w-4" />
        {showLabel && <span>{label}</span>}
      </Button>
    </>
  );
}

function InstallNativeElement({ onReady }: { onReady: boolean }) {
  if (typeof window === "undefined") return null;
  if (!("HTMLInstallElement" in window)) return null;
  if (initialSnapshot.installed) return null;
  return (
    // @ts-expect-error - custom element unknown to React types
    <install key={onReady ? "ready" : "init"} className="hidden" />
  );
}
