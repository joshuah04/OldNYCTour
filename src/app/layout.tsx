import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SettingsProvider } from "@/components/SettingsProvider";

export const metadata: Metadata = {
  title: "뉴욕 나들이 — 어르신 뉴욕 여행 도우미",
  description:
    "어르신을 위한 뉴욕 개인 여행 안내. 지금 계신 곳을 음성으로 안내하고, 근처 명소와 맛집을 알려드립니다.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "뉴욕 나들이",
  },
};

export const viewport: Viewport = {
  themeColor: "#b3261e",
  width: "device-width",
  initialScale: 1,
  // Let seniors pinch-zoom if they want; never lock it out.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
