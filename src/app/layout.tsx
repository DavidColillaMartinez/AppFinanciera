import type { Metadata, Viewport } from "next";
import { Sora, Figtree } from "next/font/google";
import { ClientLayout } from "@/components/client-layout";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Finanzas Personales",
  description:
    "PWA privada de finanzas personales conectada a Google Sheets.",
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
      <body className={`${sora.variable} ${figtree.variable} font-body`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
