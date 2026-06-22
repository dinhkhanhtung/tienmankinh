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
  Sun,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

import { DonateDialog } from "@/components/layout/donate-dialog";
import { FeedbackDialog } from "@/components/layout/feedback-dialog";

export function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, theme, setTheme } = useUserStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      <aside className="hidden md:flex flex-col w-66 bg-card/85 backdrop-blur-md border-r border-border h-full p-6 text-foreground shadow-lg shadow-black/[0.01]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary/20 text-primary flex items-center justify-center shadow-inner group cursor-pointer">
            <Heart className="w-5 h-5 fill-current group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="font-black text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">Tiền Mãn Kinh</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 flex flex-col gap-2.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all duration-300 active:scale-98 ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/25"
                    : "hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-105" : "group-hover:scale-105"} ${item.highlight && !isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div ref={menuRef} className="border-t border-border/60 pt-4 relative">
          {/* Popover user menu */}
          {showUserMenu && (
            <div className="absolute bottom-20 left-0 right-0 bg-card border border-border rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  handleLogout();
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
              </button>
            </div>
          )}

          {/* Quyên góp tự nguyện */}
          <div className="px-1 mb-2.5">
            <DonateDialog trigger={
              <button
                type="button"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-bold text-xs text-primary bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/20 hover:border-primary/50 transition-all active:scale-98 text-left cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-current shrink-0 text-primary animate-pulse" />
                <span className="truncate">Ủng hộ duy trì app</span>
              </button>
            } />
          </div>

          {/* Góp ý ứng dụng */}
          <div className="px-1 mb-2.5">
            <FeedbackDialog trigger={
              <button
                type="button"
                className="flex items-center gap-3 w-full px-3.5 py-2 rounded-xl font-bold text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent transition-all active:scale-98 text-left cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-primary" />
                <span className="truncate">Góp ý ứng dụng</span>
              </button>
            } />
          </div>

          {/* User info info - Click to toggle menu */}
          {profile && (
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-between w-full p-2 px-3 rounded-xl hover:bg-muted transition-colors text-left group"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-sm shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
                  {profile.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.photoURL} alt={profile.displayName || "Avatar"} className="w-full h-full object-cover" />
                  ) : (
                    profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-foreground truncate">{profile.displayName}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{profile.email}</span>
                </div>
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-card border-b border-border/80 h-14 px-4 flex items-center justify-between shrink-0 text-foreground sticky top-0 z-40 backdrop-blur-md bg-card/95">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center shadow-inner">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-primary">Tiền Mãn Kinh</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
          
          {/* Mobile Profile Dropdown */}
          {profile && (
            <div ref={mobileMenuRef} className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="w-9 h-9 rounded-full bg-secondary text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary/20 shadow-inner active:scale-95 transition-all overflow-hidden"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoURL} alt={profile.displayName || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"
                )}
              </button>
              
              {showMobileMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-card border border-border rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="flex flex-col px-3 py-2 border-b border-border/50 pb-2">
                    <span className="text-xs font-black text-foreground truncate">{profile.displayName}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{profile.email}</span>
                  </div>
                  
                  <FeedbackDialog trigger={
                    <button
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs text-foreground hover:bg-muted transition-colors w-full text-left cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary" /> Gửi góp ý ứng dụng
                    </button>
                  } />
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Đăng xuất tài khoản
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 relative bg-background">
        <div className="flex-1 p-2.5 sm:p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/60 h-16.5 flex items-center justify-around z-50 text-foreground shadow-xl shadow-black/10 pb-safe" style={{ touchAction: "manipulation" }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          // Định nghĩa nhãn ngắn cho di động
          let mobileLabel = "";
          if (item.name === "Tổng quan") mobileLabel = "Trang chủ";
          else if (item.name === "Lịch chu kỳ") mobileLabel = "Lịch";
          else if (item.name === "AI Coach") mobileLabel = "Trợ lý";
          else if (item.name === "Hồ sơ") mobileLabel = "Hồ sơ";

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 select-none relative -top-4 h-full"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ring-4 ring-background/95 active:scale-90 ${
                  isActive
                    ? "bg-gradient-to-tr from-primary via-primary to-accent text-primary-foreground shadow-primary/40 scale-105"
                    : "bg-gradient-to-tr from-primary via-primary to-[#B05581] text-primary-foreground shadow-primary/30 hover:shadow-primary/45"
                }`}>
                  <Icon className="w-6.5 h-6.5 stroke-[2.25]" />
                </div>
                <span className="text-[10px] font-black text-primary mt-1.5 select-none tracking-tight">Ghi chép</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold select-none transition-all active:scale-95 ${
                isActive ? "text-primary scale-102" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div className={`p-1.5 px-3 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-primary/12 text-primary"
                  : "hover:bg-muted/40"
              }`}>
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
              </div>
              <span className="mt-0.5 tracking-tight font-black">{mobileLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* FLOATING THEME SWITCHER FOR PC */}
      <button
        onClick={toggleTheme}
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full bg-card/90 backdrop-blur-md border border-border/80 shadow-2xl hover:border-primary/35 items-center justify-center text-primary transition-all active:scale-95 hover:-translate-y-1 group"
        title={theme === "light" ? "Giao diện tối" : "Giao diện sáng"}
        style={{ boxShadow: "0 10px 25px -5px rgba(217,108,157,0.1), 0 8px 16px -6px rgba(217,108,157,0.05)" }}
      >
        {theme === "light" ? (
          <Moon className="w-5.5 h-5.5 transition-all group-hover:rotate-12 group-hover:scale-110 duration-300" />
        ) : (
          <Sun className="w-5.5 h-5.5 transition-all group-hover:rotate-90 group-hover:scale-110 duration-300" />
        )}
      </button>
    </div>
  );
}
