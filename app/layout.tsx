import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Nexus — Your AI Financial Advisor",
  description: "Budget, invest, and plan your financial future with AI guidance.",
  openGraph: {
    title: "Nexus — Your AI Financial Advisor",
    description: "Budget, invest, and plan your financial future with AI guidance.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus — Your AI Financial Advisor",
    description: "Budget, invest, and plan your financial future with AI guidance.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
