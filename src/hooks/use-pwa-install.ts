"use client";

import { useEffect, useState } from "react";

export type InstallSupport = "native" | "prompt" | "ios" | "unsupported";

export interface PwaInstallState {
  support: InstallSupport;
  canInstall: boolean;
  installed: boolean;
  promptInstall: () => Promise<boolean>;
  isReady: boolean;
  iosInstructions: boolean;
  registerNativeEl: (el: HTMLElement | null) => void;
}

declare global {
  interface Window {
    HTMLInstallElement?: unknown;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const NATIVE_EVENTS = ["promptaction", "promptdismiss", "validationstatuschanged"];

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return false;
}

function detectIos(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Mac/.test(ua) && typeof (document as Document).ontouchstart !== "undefined";
}

function hasNativeInstallElement(): boolean {
  if (typeof window === "undefined") return false;
  return "HTMLInstallElement" in window;
}

export function usePwaInstall(): PwaInstallState {
  const [support] = useState<InstallSupport>(() => {
    if (typeof window === "undefined") return "unsupported";
    if (hasNativeInstallElement()) return "native";
    if (detectIos() && !isStandalone()) return "ios";
    return "prompt";
  });
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [nativeEl, setNativeEl] = useState<HTMLElement | null>(null);
  const [isReady] = useState<boolean>(() => typeof window !== "undefined");

  useEffect(() => {
    if (support === "native") return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setDeferred(evt);
      setCanInstall(true);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [support]);

  useEffect(() => {
    if (support !== "native" || !nativeEl) return;
    const onPrompt = () => {
      setCanInstall(true);
    };
    const onDismiss = () => {
      setCanInstall(false);
    };
    nativeEl.addEventListener("promptaction", onPrompt);
    nativeEl.addEventListener("promptdismiss", onDismiss);
    for (const ev of NATIVE_EVENTS) {
      void ev;
    }
    return () => {
      nativeEl.removeEventListener("promptaction", onPrompt);
      nativeEl.removeEventListener("promptdismiss", onDismiss);
    };
  }, [support, nativeEl]);

  const registerNativeEl = (el: HTMLElement | null) => {
    setNativeEl(el);
  };

  async function promptInstall(): Promise<boolean> {
    if (support === "native" && nativeEl) {
      try {
        const anyEl = nativeEl as HTMLElement & { prompt?: () => Promise<unknown> };
        if (typeof anyEl.prompt === "function") {
          await anyEl.prompt();
          return true;
        }
        nativeEl.click();
        return true;
      } catch (e) {
        console.warn("[pwa] native install failed", e);
        return false;
      }
    }
    if (!deferred) return false;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("[pwa] prompt install failed", e);
      return false;
    }
  }

  return {
    support,
    canInstall: canInstall || support === "native",
    installed,
    promptInstall,
    isReady,
    iosInstructions: support === "ios",
    registerNativeEl,
  };
}

export function getPwaSupportSnapshot(): {
  support: InstallSupport;
  installed: boolean;
} {
  if (typeof window === "undefined") return { support: "unsupported", installed: false };
  const installed = isStandalone();
  if (hasNativeInstallElement()) return { support: "native", installed };
  if (detectIos()) return { support: "ios", installed };
  return { support: "prompt", installed };
}
