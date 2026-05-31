"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessTokenFromUrl, clearHash } from "@/lib/google/auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessTokenFromUrl();
    if (token) {
      sessionStorage.setItem("google_access_token", token);
      clearHash();
      router.replace("/onboarding?connected=true");
    } else {
      clearHash();
      router.replace("/onboarding?error=auth_failed");
    }
  }, [router]);

  return null;
}