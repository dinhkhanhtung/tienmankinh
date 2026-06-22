import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PwaProvider } from "@/components/layout/pwa-provider";
import { AuthProvider } from "@/components/layout/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import { ZaloBrowserDetector } from "@/components/layout/zalo-browser-detector";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tienmankinh.vercel.app"),
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
  openGraph: {
    title: "Tiền Mãn Kinh - Đồng Hành Cùng Sức Khỏe Phụ Nữ Tuổi 40+",
    description: "Theo dõi chu kỳ - Hiểu cơ thể - Sống an yên. Ứng dụng hỗ trợ theo dõi sức khỏe và tư vấn y khoa tự nhiên.",
    url: "https://tienmankinh.vercel.app/",
    siteName: "Tiền Mãn Kinh",
    images: [
      {
        url: "/og-image.jpg",
        width: 1000,
        height: 620,
        alt: "Tiền Mãn Kinh - Đồng hành cùng sức khỏe phụ nữ tuổi 40+",
      }
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiền Mãn Kinh - Đồng Hành Cùng Sức Khỏe Phụ Nữ Tuổi 40+",
    description: "Theo dõi chu kỳ - Hiểu cơ thể - Sống an yên. Ứng dụng hỗ trợ theo dõi sức khỏe và tư vấn y khoa tự nhiên.",
    images: ["/og-image.jpg"],
  }
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
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <PwaProvider>
          <AuthProvider>
            <ZaloBrowserDetector />
            <Navigation>{children}</Navigation>
          </AuthProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
