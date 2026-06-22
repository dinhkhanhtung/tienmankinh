"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/store/use-auth-store";
import { useUserStore } from "@/store/use-user-store";
import { useLogStore } from "@/store/use-log-store";
import { UserProfile, PeriodCycle, DailyLog } from "@/types";
import { Loader2 } from "lucide-react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setLoading: setAuthLoading, loading: authLoading } = useAuthStore();
  const { profile, setProfile, setTheme } = useUserStore();
  const { setCycles, setDailyLogs, setLoadingLogs } = useLogStore();

  useEffect(() => {
    // 1. Lắng nghe trạng thái xác thực duy nhất 1 lần khi mount ứng dụng
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setLoadingLogs(true);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as UserProfile;
            setProfile(profileData);
            
            const savedTheme = profileData.theme || (localStorage.getItem("theme") as "light" | "dark") || "light";
            setTheme(savedTheme);

            // Tải cache dữ liệu chu kỳ kinh nguyệt
            const cyclesQuery = query(
              collection(db, "cycles"),
              where("userId", "==", firebaseUser.uid)
            );
            const cyclesSnap = await getDocs(cyclesQuery);
            const cyclesData: PeriodCycle[] = [];
            cyclesSnap.forEach((doc) => {
              cyclesData.push({ id: doc.id, ...doc.data() } as PeriodCycle);
            });
            cyclesData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setCycles(cyclesData.slice(0, 12));

            // Tải cache logs hàng ngày
            const logsQuery = query(
              collection(db, "daily_logs"),
              where("userId", "==", firebaseUser.uid)
            );
            const logsSnap = await getDocs(logsQuery);
            const logsData: DailyLog[] = [];
            logsSnap.forEach((doc) => {
              logsData.push({ id: doc.id, ...doc.data() } as DailyLog);
            });
            logsData.sort((a, b) => b.date.localeCompare(a.date));
            setDailyLogs(logsData.slice(0, 30));
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Lỗi đồng bộ dữ liệu người dùng: ", error);
        } finally {
          setLoadingLogs(false);
        }
      } else {
        setProfile(null);
        setCycles([]);
        setDailyLogs([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAuthLoading, setProfile, setTheme, setCycles, setDailyLogs, setLoadingLogs]);

  // 2. Auth Guards điều phối chuyển hướng dựa trên pathname, state auth và profile
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // Đã đăng nhập
      if (pathname === "/login") {
        if (profile?.isOnboarded) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } else if (profile && !profile.isOnboarded && pathname !== "/onboarding") {
        // Có user nhưng chưa onboard và đang ở trang khác onboarding
        router.push("/onboarding");
      }
    } else {
      // Chưa đăng nhập
      const protectedRoutes = ["/dashboard", "/tracker", "/log", "/chat", "/profile", "/onboarding"];
      if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        router.push("/login");
      }
    }
  }, [user, profile, authLoading, pathname, router]);

  // Kiểm tra xem trang hiện tại có phải tuyến đường được bảo vệ không
  const isProtectedRoute = ["/dashboard", "/tracker", "/log", "/chat", "/profile", "/onboarding"].some(
    (route) => pathname.startsWith(route)
  );

  // Hiển thị màn hình loading lúc xác thực lần đầu hoặc khi đã đăng xuất và đang chờ chuyển hướng từ tuyến đường được bảo vệ
  if (authLoading || (!user && isProtectedRoute)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Tiền Mãn Kinh</h2>
          <p className="text-sm text-muted-foreground">
            {!user && isProtectedRoute ? "Đang chuyển hướng an toàn..." : "Đang kết nối dữ liệu an toàn..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
