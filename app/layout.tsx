import type { Metadata } from "next";
import { Inter, Outfit, Caveat } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

import { Providers } from "./providers";
import { IdleTimeout } from "@/components/layout/IdleTimeout";

import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Memory Map",
  description: "Map your precious life memories",
};

// Inline script to set data-theme before first paint — prevents flash of wrong theme
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('mm-theme');
    if (t && ['classic','candy','ocean','matcha','sunset'].includes(t)) {
      document.documentElement.dataset.theme = t;
    } else {
      document.documentElement.dataset.theme = 'classic';
    }
  } catch(e) {
    document.documentElement.dataset.theme = 'classic';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${caveat.variable} font-sans bg-neutral-950 text-neutral-100 antialiased`}>
        <Providers>
          {children}
          <IdleTimeout />
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--mm-surface, #fff)",
                color: "var(--mm-ink, #000)",
                border: "3px solid var(--mm-border, #000)",
                borderRadius: "16px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "900",
                fontFamily: "var(--font-outfit)",
                boxShadow: "6px 6px 0 var(--mm-shadow, #000)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.02em",
              },
              success: {
                iconTheme: {
                  primary: "var(--mm-ink, #000)",
                  secondary: "var(--mm-success, #86efac)",
                },
                style: {
                  background: "var(--mm-success, #86efac)",
                  color: "var(--mm-ink, #000)",
                  border: "3px solid var(--mm-border, #000)",
                }
              },
              error: {
                iconTheme: {
                  primary: "#fff",
                  secondary: "var(--mm-danger, #FF3300)",
                },
                style: {
                  background: "var(--mm-danger, #FF3300)",
                  color: "#fff",
                  border: "3px solid var(--mm-border, #000)",
                }
              }
            }}
          />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
