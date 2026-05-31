const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GOOGLE_REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readwrite",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "token",
    scope: GOOGLE_SCOPES,
    include_granted_scopes: "true",
    state: "sheet_connection",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getAccessTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get("access_token");
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
