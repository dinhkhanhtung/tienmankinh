"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useUserStore } from "@/store/use-user-store";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const { profile } = useUserStore();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (profile?.isOnboarded) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, profile, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background p-6 min-h-screen text-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <h2 className="text-lg font-bold">Tiền Mãn Kinh</h2>
        <p className="text-sm text-muted-foreground">Đang định tuyến an toàn...</p>
      </div>
    </div>
  );
}
