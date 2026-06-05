import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/components/ReactQueryProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CinePhile — AI Screenplay Assistant for Mollywood",
  description:
    "Upload a Malayalam screenplay and query it in Malayalam or English. Get streaming answers with exact scene citations for your entire film crew.",
  keywords:
    "Malayalam cinema, Mollywood, screenplay AI, RAG, film crew, script analysis",
  openGraph: {
    title: "CinePhile — AI for Mollywood",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Meera+Inimai&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ReactQueryProvider>
          {children}
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
      </body>
    </html>
  );
}
