import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaProvider } from "@/components/layout/pwa-provider";
import { AuthProvider } from "@/components/layout/auth-provider";
import { Navigation } from "@/components/layout/navigation";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Tiền Mãn Kinh - Theo Dõi Sức Khỏe Phụ Nữ Trung Niên",
  description: "Ứng dụng hỗ trợ phụ nữ từ 40–55 tuổi theo dõi chu kỳ kinh nguyệt, triệu chứng tiền mãn kinh, giấc ngủ, tâm trạng và nhận tư vấn sức khỏe từ AI Coach.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tiền Mãn Kinh",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#D96C9D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <PwaProvider>
          <AuthProvider>
            <Navigation>{children}</Navigation>
          </AuthProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
