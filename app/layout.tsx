import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import "leaflet/dist/leaflet.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

import { Providers } from "./providers";
import { IdleTimeout } from "@/components/layout/IdleTimeout";

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
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
