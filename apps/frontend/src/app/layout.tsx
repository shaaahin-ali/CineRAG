import type { Metadata } from "next";
import { Inter, Meera_Inimai, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/AuthProvider";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";
import { AppTopDock } from "@/components/AppTopDock";
import { TopNavBar } from "@/components/TopNavBar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const meera = Meera_Inimai({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-meera",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CineACUMEN — AI Screenplay Assistant for Mollywood",
  description:
    "Upload a Malayalam screenplay and query it in Malayalam or English. Get streaming answers with exact scene citations for your entire film crew.",
  keywords:
    "Malayalam cinema, Mollywood, screenplay AI, film crew, script analysis",
  openGraph: {
    title: "CineACUMEN — AI for Mollywood",
    description: "AI-powered screenplay analysis for Malayalam film crews",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${meera.variable} ${jetbrainsMono.variable} antialiased`}>
        <AuthProvider>
          <ReactQueryProvider>
            <TopNavBar />
            {children}
            <AppTopDock />
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#F9FAFB",
                },
              }}
            />
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
