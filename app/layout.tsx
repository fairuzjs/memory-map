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
                background: "rgba(17, 17, 26, 0.8)",
                color: "#fff",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "1.25rem",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "var(--font-outfit)",
                boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
              },
              success: {
                iconTheme: {
                  primary: "#34d399",
                  secondary: "#fff",
                },
                style: {
                  border: "1px solid rgba(52, 211, 153, 0.2)",
                  background: "linear-gradient(135deg, rgba(17, 17, 26, 0.95), rgba(20, 30, 25, 0.95))",
                }
              },
              error: {
                iconTheme: {
                  primary: "#f87171",
                  secondary: "#fff",
                },
                style: {
                  border: "1px solid rgba(248, 113, 113, 0.2)",
                  background: "linear-gradient(135deg, rgba(17, 17, 26, 0.95), rgba(30, 20, 20, 0.95))",
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
