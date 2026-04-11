import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "SisOS - Gestão de Auditorias",
  description: "Sistema de gerenciamento de auditorias e fiscalizações",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className={`${dmSans.variable} font-[family-name:var(--font-dm-sans)] min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
