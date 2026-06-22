"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserStore } from "@/store/use-user-store";
import { 
  Heart, 
  Home, 
  CalendarDays, 
  PlusCircle, 
  MessageCircleCode, 
  User,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { toast } from "sonner";

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, theme, setTheme } = useUserStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Đăng xuất thành công.");
      router.push("/login");
    } catch (error) {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  const menuItems = [
    { name: "Tổng quan", href: "/dashboard", icon: Home },
    { name: "Lịch chu kỳ", href: "/tracker", icon: CalendarDays },
    { name: "Ghi nhật ký", href: "/log", icon: PlusCircle, highlight: true },
    { name: "AI Coach", href: "/chat", icon: MessageCircleCode },
    { name: "Hồ sơ", href: "/profile", icon: User },
  ];

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Nếu đang ở màn hình login hoặc onboarding, không hiển thị thanh điều hướng
  const hideNav = pathname === "/login" || pathname === "/onboarding" || pathname === "/";
  if (hideNav) {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-background overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full p-6 text-foreground">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-lg text-primary">Tiền Mãn Kinh</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-base transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${item.highlight && !isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-border/60 pt-4 flex flex-col gap-2">
          {/* User info info */}
          {profile && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-sm">
                {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-foreground truncate">{profile.displayName}</span>
                <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
              </div>
            </div>
          )}

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-4 h-4" /> Giao diện tối
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" /> Giao diện sáng
              </>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-muted-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-card border-b border-border h-14 px-4 flex items-center justify-between shrink-0 text-foreground">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-current" />
          <span className="font-bold text-base text-primary">Tiền Mãn Kinh</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 relative bg-background">
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border/80 h-16 flex items-center justify-around z-50 text-foreground shadow-lg shadow-black/5 pb-safe" style={{ touchAction: "manipulation" }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          // Định nghĩa nhãn ngắn cho di động
          let mobileLabel = "";
          if (item.name === "Tổng quan") mobileLabel = "Trang chủ";
          else if (item.name === "Lịch chu kỳ") mobileLabel = "Lịch";
          else if (item.name === "AI Coach") mobileLabel = "AI Coach";
          else if (item.name === "Hồ sơ") mobileLabel = "Hồ sơ";

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 select-none relative -top-3 h-full"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-primary/30"
                    : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-primary/20 hover:opacity-95"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-primary mt-1 select-none">Ghi chép</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold select-none transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="mt-0.5 tracking-tight">{mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
