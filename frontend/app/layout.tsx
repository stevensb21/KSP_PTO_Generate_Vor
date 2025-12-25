import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ВОР - Ведомость Объёмов Работ",
  description: "Система управления ведомостями объёмов работ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
