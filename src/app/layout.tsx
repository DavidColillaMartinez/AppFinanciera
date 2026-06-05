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

const originTrialToken = process.env.NEXT_PUBLIC_CHROME_INSTALL_ELEMENT_ORIGIN_TRIAL;

export const metadata: Metadata = {
  title: "Finanzas Personales",
  description:
    "PWA privada de finanzas personales conectada a Google Sheets.",
  applicationName: "Finanzas Personales",
  robots: "noindex, nofollow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Finanzas",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/app-icon.svg", type: "image/svg+xml" },
      { url: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
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
      <head>
        {originTrialToken ? (
          <meta httpEquiv="origin-trial" content={originTrialToken} />
        ) : null}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Finanzas" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icons/app-icon-192.png" />
      </head>
      <body className={`${sora.variable} ${figtree.variable} font-body`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
