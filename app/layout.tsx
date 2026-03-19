import "./globals.css";
import type { Metadata, Viewport } from "next";
import SplashScreen from "../components/SplashScreen";
import AutoRefresh from "../components/AutoRefresh";
import PullToRefresh from "../components/PullToRefresh";

export const metadata: Metadata = {
  title: "Squad PT",
  description: "Premium squad PT tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Squad PT",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AutoRefresh />
        <PullToRefresh />
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}