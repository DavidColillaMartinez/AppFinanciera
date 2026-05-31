"use client";

import { useEffect, useState } from "react";

let GOOGLE_CLIENT_ID: string;
let GOOGLE_REDIRECT_URI: string;

if (typeof window !== "undefined") {
  GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/callback`;
} else {
  GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  GOOGLE_REDIRECT_URI = "";
}

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readwrite",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export function getGoogleAuthUrl(): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth Client ID not configured");
  }

  const state = generateState();

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "token",
    scope: GOOGLE_SCOPES,
    include_granted_scopes: "true",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getAccessTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  return params.get("access_token");
}

export function getStateFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  return params.get("state");
}

export function clearHash(): void {
  if (typeof window !== "undefined" && window.location.hash) {
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }
}

export function isGoogleAuthConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

export { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI };
