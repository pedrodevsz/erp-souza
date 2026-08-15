import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sis-SZ",
  description: "Sistema de gestão Sis-SZ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
