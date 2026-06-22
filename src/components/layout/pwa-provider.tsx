"use client";

import { useEffect } from "react";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (window as any).workbox === undefined
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope: ", reg.scope);
            // Chủ động kiểm tra cập nhật khi đăng ký
            reg.update();
          })
          .catch((err) => {
            console.error("Service Worker registration failed: ", err);
          });
      });

      // Lắng nghe sự kiện đổi controller (Service Worker mới kích hoạt và tiếp quản)
      // để tự động reload tải lại toàn bộ mã nguồn mới nhất không qua cache cũ
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  return <>{children}</>;
}
