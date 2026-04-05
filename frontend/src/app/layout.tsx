import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DVT Talent AI — Autonomous Recruiting Platform",
  description: "AI-powered recruiting & sales automation platform",
};

import { ThemeProvider } from "@/providers/theme-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased transition-colors duration-300`}
      >
        <ThemeProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </ThemeProvider>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0f1117",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f4f4f5",
            },
          }}
        />
      </body>
    </html>
  );
}