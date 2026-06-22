"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink, AlertTriangle, ArrowUpRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ZaloBrowserDetector() {
  const [isZalo, setIsZalo] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.userAgent) {
      const ua = navigator.userAgent;
      const isZaloBrowser = /Zalo/i.test(ua);
      setIsZalo(isZaloBrowser);
      
      const isDismissed = sessionStorage.getItem("zalo_browser_dismissed") === "true";
      setDismissed(isDismissed);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("zalo_browser_dismissed", "true");
    setDismissed(true);
  };

  if (!isZalo || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/85 dark:bg-background/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Mũi tên chỉ dẫn hướng lên góc trên cùng bên phải */}
      <div className="absolute top-4 right-4 sm:right-8 flex flex-col items-end gap-1 animate-pulse z-20">
        <ArrowUpRight className="w-10 h-10 text-primary animate-bounce" />
        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          Bấm vào đây trước
        </span>
      </div>

      {/* Container chính của Card hướng dẫn */}
      <div className="relative max-w-md w-full bg-card border border-border/80 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 text-center text-foreground backdrop-blur-xl animate-in zoom-in-95 duration-300">
        {/* Biểu tượng la bàn nổi bật */}
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          <Compass className="w-8 h-8 animate-pulse text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-primary tracking-tight">
            MỞ BẰNG TRÌNH DUYỆT NGOÀI
          </h2>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Để ứng dụng tự động **lưu đăng nhập** (không bị thoát ra mỗi lần mở lại) và hoạt động ổn định nhất, chị nên mở bằng Safari hoặc Chrome.
          </p>
        </div>

        {/* Các bước hướng dẫn chi tiết */}
        <div className="bg-muted/40 border border-border/40 rounded-2xl p-4 text-left space-y-3 font-semibold text-xs leading-relaxed text-foreground">
          <p className="font-bold text-primary flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
            <AlertTriangle className="w-4 h-4" /> Hướng dẫn nhanh cho chị:
          </p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>Nhấn vào biểu tượng <strong>dấu 3 chấm (...)</strong> ở góc trên bên phải màn hình Zalo.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>Chọn <strong>"Mở bằng trình duyệt"</strong> (Chrome trên Android hoặc Safari trên iPhone).</span>
            </div>
            
            <div className="flex items-start gap-2 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium leading-normal italic">
              <span className="shrink-0">💡</span>
              <span><strong>Mẹo:</strong> Sau khi mở bằng trình duyệt ngoài, chị hãy bấm nút Chia sẻ/Menu và chọn <strong>"Thêm vào màn hình chính"</strong> để cài đặt App truy cập nhanh chóng hơn lần sau.</span>
            </div>
          </div>
        </div>

        {/* Nút bấm */}
        <div className="space-y-3 pt-1">
          <Button 
            onClick={handleDismiss}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-98 transition-transform cursor-pointer"
          >
            Tôi đã hiểu, tiếp tục xem tạm
          </Button>
          <p className="text-[10px] text-muted-foreground font-semibold">
            * Khuyên dùng Safari hoặc Chrome để không bao giờ bị mất dữ liệu theo dõi.
          </p>
        </div>
      </div>
    </div>
  );
}
