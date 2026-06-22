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
  const { setProfile, setTheme } = useUserStore();
  const { setCycles, setDailyLogs, setLoadingLogs } = useLogStore();

  useEffect(() => {
    // Lắng nghe sự thay đổi trạng thái xác thực từ Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setLoadingLogs(true);
        try {
          // 1. Lấy thông tin User Profile từ Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as UserProfile;
            setProfile(profileData);
            
            // Cấu hình theme từ database hoặc localstorage
            const savedTheme = profileData.theme || (localStorage.getItem("theme") as "light" | "dark") || "light";
            setTheme(savedTheme);

            // 2. Tải cache dữ liệu chu kỳ kinh nguyệt (tối đa 12 chu kỳ gần nhất để tối ưu)
            const cyclesQuery = query(
              collection(db, "cycles"),
              where("userId", "==", firebaseUser.uid)
            );
            const cyclesSnap = await getDocs(cyclesQuery);
            const cyclesData: PeriodCycle[] = [];
            cyclesSnap.forEach((doc) => {
              cyclesData.push({ id: doc.id, ...doc.data() } as PeriodCycle);
            });
            // Sắp xếp in-memory giảm dần theo startDate và lấy tối đa 12 chu kỳ
            cyclesData.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setCycles(cyclesData.slice(0, 12));

            // 3. Tải cache logs hàng ngày (30 ngày gần nhất để vẽ biểu đồ và nạp context AI)
            const logsQuery = query(
              collection(db, "daily_logs"),
              where("userId", "==", firebaseUser.uid)
            );
            const logsSnap = await getDocs(logsQuery);
            const logsData: DailyLog[] = [];
            logsSnap.forEach((doc) => {
              logsData.push({ id: doc.id, ...doc.data() } as DailyLog);
            });
            // Sắp xếp in-memory giảm dần theo date và lấy tối đa 30 logs gần nhất
            logsData.sort((a, b) => b.date.localeCompare(a.date));
            setDailyLogs(logsData.slice(0, 30));

            // Chuyển hướng nếu đang ở màn hình login
            if (pathname === "/login") {
              if (profileData.isOnboarded) {
                router.push("/dashboard");
              } else {
                router.push("/onboarding");
              }
            }
          } else {
            // Document profile không tồn tại -> người dùng mới tinh chưa onboarding
            setProfile(null);
            if (pathname !== "/onboarding") {
              router.push("/onboarding");
            }
          }
        } catch (error) {
          console.error("Lỗi đồng bộ dữ liệu người dùng: ", error);
        } finally {
          setLoadingLogs(false);
        }
      } else {
        // Clear stores khi logout
        setProfile(null);
        setCycles([]);
        setDailyLogs([]);
        
        // Điều hướng về trang login nếu đang ở các trang yêu cầu đăng nhập (loại trừ trang chủ "/" chứa Landing Page)
        const protectedRoutes = ["/dashboard", "/tracker", "/log", "/chat", "/profile", "/onboarding"];
        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          router.push("/login");
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAuthLoading, setProfile, setTheme, setCycles, setDailyLogs, setLoadingLogs, pathname, router]);

  // Hiển thị màn hình loading lúc xác thực lần đầu
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Tiền Mãn Kinh</h2>
          <p className="text-sm text-muted-foreground">Đang kết nối dữ liệu an toàn...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
