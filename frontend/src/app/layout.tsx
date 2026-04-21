import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "DVT Talent AI — Autonomous Recruiting & Intelligence Swarm",
  description: "Enterprise-grade autonomous recruitment ecosystem using multi-agent intelligence swarms for high-fidelity sourcing and discovery.",
  openGraph: {
    title: "DVT Talent AI — The Recruiting Swarm",
    description: "Omnichannel autonomous recruiter that discovers, screens, and engages global talent 24/7.",
    type: "website",
    url: "https://dvt-talent.ai",
    siteName: "DVT Talent AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "DVT Talent AI — Autonomous Recruiter",
    description: "Multi-agent swarm intelligence for high-precision hiring.",
  }
};

import { Providers } from "@/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} antialiased transition-colors duration-300`}
      >
        <Providers>
          {children}
        </Providers>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--primary) / 0.2)",
              color: "hsl(var(--foreground))",
              fontFamily: "var(--font-jetbrains-mono)",
            },
          }}
        />
      </body>
    </html>
  );
}