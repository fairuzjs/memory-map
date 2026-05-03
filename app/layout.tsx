import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

import { Providers } from "./providers";
import { IdleTimeout } from "@/components/layout/IdleTimeout";

import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "Memory Map",
  description: "Map your precious life memories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-neutral-950 text-neutral-100 antialiased`}>
        <Providers>
          {children}
          <IdleTimeout />
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#000",
                border: "3px solid #000",
                borderRadius: "0px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "900",
                fontFamily: "var(--font-outfit)",
                boxShadow: "4px 4px 0 #000",
                textTransform: "uppercase" as const,
                letterSpacing: "0.02em",
              },
              success: {
                iconTheme: {
                  primary: "#000",
                  secondary: "#00FF00",
                },
                style: {
                  background: "#00FF00",
                  color: "#000",
                  border: "3px solid #000",
                }
              },
              error: {
                iconTheme: {
                  primary: "#fff",
                  secondary: "#FF0000",
                },
                style: {
                  background: "#FF3300",
                  color: "#fff",
                  border: "3px solid #000",
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
