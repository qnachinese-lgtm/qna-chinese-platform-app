import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QNA Chinese — Tiếng Trung Quyên Huỳnh",
  description:
    "Nền tảng học tiếng Trung dành riêng cho người Việt: âm Hán-Việt làm cầu nối, phồn–giản song song, từ vỡ lòng đến văn ngôn.",
  manifest: "/manifest.webmanifest",
  // Cho phép chạy toàn màn hình khi thêm vào màn hình chính trên iPhone.
  // iOS 加到主畫面後全螢幕執行。
  appleWebApp: {
    capable: true,
    title: "QNA Chinese",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EDEDE6" },
    { media: "(prefers-color-scheme: dark)", color: "#131517" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;900&family=Noto+Sans+TC:wght@300;400;500;700&family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
