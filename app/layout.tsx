import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Squad PT",
  description: "Premium squad PT tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}