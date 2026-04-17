import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TableCRM Mobile Order",
  description: "Мобильная форма оформления заказа для TableCRM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
