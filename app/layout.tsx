import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Squad PT",
  description: "Squad PT tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white">{children}</body>
    </html>
  );
}