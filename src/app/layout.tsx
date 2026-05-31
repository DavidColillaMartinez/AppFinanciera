import type { Metadata, Viewport } from "next";
import { ClientLayout } from "@/components/client-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finanzas Personales",
  description: "PWA privada de finanzas personales conectada a Google Sheets.",
  applicationName: "Finanzas Personales",
  robots: "noindex, nofollow",
  appleWebApp: {
    capable: true,
    title: "Finanzas",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
