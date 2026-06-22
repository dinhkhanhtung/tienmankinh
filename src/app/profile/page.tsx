"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useUserStore } from "@/store/use-user-store";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Scale, Activity, Baby, Sparkles, Loader2, Bell, FileText, ChevronRight, Heart, Camera, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { DonateDialog } from "@/components/layout/donate-dialog";
import { FeedbackDialog } from "@/components/layout/feedback-dialog";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, updateProfile } = useUserStore();
  
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Local Form states
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [periodAge, setPeriodAge] = useState("");
  const [childrenCount, setChildrenCount] = useState("");

  // Sync cài đặt thông báo từ localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const enabled = localStorage.getItem("notificationsEnabled") === "true";
      setNotificationsEnabled(enabled);
    }
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (!("Notification" in window)) {
        toast.error("Trình duyệt không hỗ trợ thông báo đẩy.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("notificationsEnabled", "true");
        toast.success("Đã bật nhắc nhở ghi nhật ký sức khỏe lúc 21:00 hàng tối.");
      } else {
        toast.error("Vui lòng cấp quyền thông báo trong cài đặt trình duyệt để bật nhắc nhở.");
        setNotificationsEnabled(false);
        localStorage.setItem("notificationsEnabled", "false");
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem("notificationsEnabled", "false");
      toast.info("Đã tắt thông báo nhắc nhở.");
    }
  };

  // Sync state từ store
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBirthYear(profile.birthYear?.toString() || "");
      setHeight(profile.height?.toString() || "");
      setWeight(profile.weight?.toString() || "");
      setPeriodAge(profile.periodAge?.toString() || "");
      setChildrenCount(profile.childrenCount?.toString() || "");
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh phải nhỏ hơn 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh hợp lệ.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh đại diện lên...");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
      if (!apiKey) {
        throw new Error("Không tìm thấy cấu hình IMGBB API Key.");
      }

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Tải ảnh lên ImgBB thất bại.");
      }

      const data = await res.json();
      if (!data.success || !data.data?.url) {
        throw new Error(data.error?.message || "Tải ảnh lên ImgBB thất bại.");
      }

      const imageUrl = data.data.url;

      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          photoURL: imageUrl,
          updatedAt: new Date().toISOString(),
        });

        updateProfile({ photoURL: imageUrl });

        fetch("/api/customer-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            photoURL: imageUrl,
            displayName: profile?.displayName,
            action: "update_avatar",
          }),
        }).catch((err) => {
          console.error("Lỗi gửi thông báo tích hợp ngầm khi cập nhật avatar:", err);
        });

        toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
      }
    } catch (err: any) {
      console.error("Lỗi upload avatar:", err);
      toast.error(err.message || "Có lỗi xảy ra khi tải ảnh lên. Vui lòng thử lại.", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Tính toán BMI thời gian thực
  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const bmi = heightNum && weightNum ? parseFloat((weightNum / ((heightNum / 100) * (heightNum / 100))).toFixed(1)) : 0;

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: "Gầy", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
    if (val < 25) return { label: "Bình thường", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
    if (val < 30) return { label: "Thừa cân", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
    return { label: "Béo phì", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!displayName.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }

    const birthYearNum = parseInt(birthYear);
    if (!birthYear || birthYearNum < 1930 || birthYearNum > new Date().getFullYear()) {
      toast.error("Vui lòng nhập năm sinh hợp lệ.");
      return;
    }

    const heightVal = parseFloat(height);
    if (!height || heightVal < 100 || heightVal > 250) {
      toast.error("Vui lòng nhập chiều cao hợp lệ (100 - 250 cm).");
      return;
    }

    const weightVal = parseFloat(weight);
    if (!weight || weightVal < 30 || weightVal > 200) {
      toast.error("Vui lòng nhập cân nặng hợp lệ (30 - 200 kg).");
      return;
    }

    const periodAgeNum = parseInt(periodAge);
    if (!periodAge || periodAgeNum < 8 || periodAgeNum > 25) {
      toast.error("Vui lòng nhập tuổi bắt đầu có kinh hợp lệ (8 - 25).");
      return;
    }

    const childrenNum = parseInt(childrenCount);
    if (!childrenCount || childrenNum < 0 || childrenNum > 20) {
      toast.error("Vui lòng nhập số lượng con hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      const updates = {
        displayName: displayName.trim(),
        birthYear: birthYearNum,
        height: heightVal,
        weight: weightVal,
        bmi: bmi,
        periodAge: periodAgeNum,
        childrenCount: childrenNum,
        updatedAt: new Date().toISOString(),
      };

      // Cập nhật Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);

      // Cập nhật Zustand Store
      updateProfile(updates);

      // Gửi thông báo ngầm đến Telegram & Notion
      fetch("/api/customer-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          ...updates,
          action: "update",
        }),
      }).catch((err) => {
        console.error("Lỗi gửi thông báo tích hợp ngầm khi cập nhật profile:", err);
      });

      toast.success("Cập nhật thông tin hồ sơ sức khỏe thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật profile: ", error);
      toast.error("Có lỗi xảy ra khi lưu thay đổi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const bmiCat = bmi > 0 ? getBmiCategory(bmi) : null;

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 page-transition">
      {/* 1. HEADER & GREETING CARD */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[28px] bg-gradient-to-r from-secondary/40 via-secondary/25 to-background border border-border/60 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 transition-all duration-300">
        <div className="space-y-1.5 relative z-10 text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <User className="w-3.5 h-3.5" />
            <span>Thông tin cá nhân</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-foreground">
            Hồ sơ sức khỏe
          </h1>
          <p className="text-[11px] sm:text-sm text-muted-foreground font-semibold leading-relaxed max-w-lg mt-1">
            Quản lý thông tin thể chất, sinh học của riêng chị. 
            Cập nhật dữ liệu chính xác giúp trợ lý AI Coach đưa ra các gợi ý y khoa tự nhiên tối ưu nhất.
          </p>
        </div>

        {/* Minh họa SVG hoa cúc họa mi / hoa cỏ nhẹ nhàng */}
        <div className="hidden md:flex shrink-0 relative w-32 h-32 md:w-36 md:h-36 items-center justify-center pointer-events-none select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary/80 fill-current animate-in fade-in zoom-in-50 duration-500">
            {/* Vẽ hoa cúc pastel cách điệu */}
            <circle cx="50" cy="50" r="10" className="text-amber-300" />
            {/* Các cánh hoa xung quanh */}
            <path d="M50 22 C48 35 52 35 50 22 Z" className="text-secondary/70" />
            <path d="M50 78 C48 65 52 65 50 78 Z" className="text-secondary/70" />
            <path d="M22 50 C35 48 35 52 22 50 Z" className="text-secondary/70" />
            <path d="M78 50 C65 48 65 52 78 50 Z" className="text-secondary/70" />
            
            <path d="M30 30 C40 38 38 40 30 30 Z" className="text-secondary/50" />
            <path d="M70 70 C60 62 62 60 70 70 Z" className="text-secondary/50" />
            <path d="M30 70 C40 62 38 60 30 70 Z" className="text-secondary/50" />
            <path d="M70 30 C60 38 62 40 70 30 Z" className="text-secondary/50" />

            <circle cx="50" cy="50" r="6" className="text-amber-400" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Tóm tắt thể chất, Donate & Cài đặt thông báo */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card Summary & BMI */}
          <Card className="border-border shadow-sm bg-card/75 backdrop-blur-sm overflow-hidden rounded-[28px] p-5 relative">
            <div className="text-center pb-4 border-b border-border/40 relative flex flex-col items-center">
              {/* Avatar đơn giản tinh tế */}
              <div 
                onClick={handleAvatarClick}
                className="w-20 h-20 rounded-full bg-secondary text-primary flex items-center justify-center font-black text-3xl shadow-sm border border-border cursor-pointer overflow-hidden relative group active:scale-95 transition-all duration-300"
                title="Nhấn vào đây để đổi ảnh đại diện"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoURL} alt={profile.displayName || "Avatar"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
                disabled={uploading}
              />

              <h2 className="text-base sm:text-lg font-black text-foreground mt-3 leading-none">{profile.displayName}</h2>
              <span className="text-[11px] font-semibold text-muted-foreground mt-1.5">{profile.email}</span>
            </div>

            <div className="space-y-4 pt-5">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thông số thể hình</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 text-center">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">Chiều cao</span>
                    <div className="text-sm sm:text-base font-black text-foreground mt-0.5">
                      {profile.height ? `${profile.height} cm` : "Chưa cập nhật"}
                    </div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 text-center">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">Cân nặng</span>
                    <div className="text-sm sm:text-base font-black text-foreground mt-0.5">
                      {profile.weight ? `${profile.weight} kg` : "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
              </div>

              {profile.bmi && profile.bmi > 0 ? (
                <div className="space-y-2.5 pt-4 border-t border-border/40">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Chỉ số khối cơ thể (BMI)</span>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-primary">{profile.bmi}</div>
                    {bmiCat && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${bmiCat.color}`}>
                        {bmiCat.label}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-secondary/40 h-2 rounded-full overflow-hidden relative">
                    <div 
                      className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((profile.bmi / 40) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                    * Chỉ số BMI lý tưởng của phụ nữ trung niên là từ 18.5 đến 24.9.
                  </p>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Card Quyên Góp đồng hành */}
          <Card className="border-border shadow-sm bg-gradient-to-br from-primary/5 via-card to-secondary/15 overflow-hidden p-5 rounded-[24px] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-pink-50 dark:bg-pink-950/20 text-primary flex items-center justify-center shadow-inner shrink-0">
                <Heart className="w-4.5 h-4.5 fill-current text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-foreground">Đồng hành cùng dự án</h4>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Hỗ trợ duy trì máy chủ & AI</p>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Tiền Mãn Kinh là ứng dụng phi lợi nhuận. Sự đồng hành đóng góp tự nguyện từ các chị giúp chúng tôi duy trì máy chủ và tiền khóa API AI Coach ân cần mỗi ngày.
            </p>

            <DonateDialog trigger={
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl justify-between border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary active:scale-98 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-current text-primary" />
                  Ủng hộ duy trì ứng dụng
                </span>
                <span className="text-[9px] bg-primary/15 text-primary px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">Gửi tặng</span>
              </Button>
            } />
          </Card>

          {/* Card Thêm vào màn hình chính */}
          <Card className="border-border shadow-sm bg-card/75 backdrop-blur-sm overflow-hidden rounded-[28px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner shrink-0">
                <Smartphone className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-foreground">Tải App Tiền Mãn Kinh</h4>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Thêm vào màn hình chính</p>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Chị có thể cài đặt hoặc thêm ứng dụng này lên màn hình chính điện thoại để truy cập nhanh như một App thông thường:
            </p>

            <div className="space-y-3.5 text-xs font-semibold text-foreground bg-muted/30 p-3.5 rounded-2xl border border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary block uppercase">📱 Hướng dẫn trên iPhone (Safari):</span>
                <span className="block text-[11px] leading-relaxed text-muted-foreground">
                  1. Nhấn nút <strong>Chia sẻ (Share)</strong> <span className="inline-block px-1 border border-border rounded bg-card">⬆️</span> ở thanh công cụ phía dưới trình duyệt.<br />
                  2. Cuộn xuống dưới và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong> <span className="inline-block px-1 border border-border rounded bg-card">➕</span>.
                </span>
              </div>
              <div className="space-y-1 pt-2 border-t border-border/40">
                <span className="text-[10px] font-bold text-primary block uppercase">🤖 Hướng dẫn trên Android (Chrome):</span>
                <span className="block text-[11px] leading-relaxed text-muted-foreground">
                  1. Nhấn nút <strong>Menu 3 chấm (...)</strong> ở góc trên bên phải trình duyệt Chrome.<br />
                  2. Chọn <strong>"Thêm vào màn hình chính"</strong> (hoặc <strong>"Cài đặt ứng dụng"</strong>).
                </span>
              </div>
            </div>
          </Card>

          {/* Cài đặt Nhắc nhở & Báo cáo */}
          <Card className="border-border shadow-sm bg-card/75 backdrop-blur-sm overflow-hidden rounded-[28px] p-5 space-y-5">
            <div className="border-b border-border/40 pb-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2 text-foreground">
                <Bell className="w-4.5 h-4.5 text-primary" /> Thiết lập nhắc nhở
              </h3>
            </div>

            {/* Nhắc nhở ghi log */}
            <div className="flex items-center justify-between py-1 cursor-pointer">
              <div className="space-y-0.5 max-w-[70%]">
                <Label htmlFor="notify-switch" className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer">
                  Nhắc ghi nhật ký sức khỏe
                </Label>
                <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
                  Gửi thông báo nhắc nhở lúc 21:00 hàng tối
                </p>
              </div>
              <Switch
                id="notify-switch"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
                className="data-[state=checked]:bg-primary cursor-pointer"
              />
            </div>

            {/* Xuất báo cáo */}
            <div className="space-y-2.5 pt-4 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Báo cáo sức khỏe định kỳ</span>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push("/report?range=3")}
                  variant="outline"
                  className="w-full h-10 rounded-xl justify-between border-border text-xs font-bold text-foreground hover:bg-muted active:scale-98 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Báo cáo 3 tháng gần nhất
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                
                <Button
                  onClick={() => router.push("/report?range=6")}
                  variant="outline"
                  className="w-full h-10 rounded-xl justify-between border-border text-xs font-bold text-foreground hover:bg-muted active:scale-98 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Báo cáo 6 tháng gần nhất
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>

                <Button
                  onClick={() => router.push("/report?range=12")}
                  variant="outline"
                  className="w-full h-10 rounded-xl justify-between border-border text-xs font-bold text-foreground hover:bg-muted active:scale-98 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Báo cáo 12 tháng gần nhất
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Phản hồi góp ý */}
            <div className="space-y-2.5 pt-4 border-t border-border/40 md:hidden">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Góp ý cải tiến</span>
              <FeedbackDialog trigger={
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-xl justify-between border-border text-xs font-bold text-foreground hover:bg-muted cursor-pointer active:scale-98 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Gửi góp ý & Phản hồi
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              } />
            </div>
          </Card>
        </div>

        {/* Cột phải: Form cập nhật thông tin chi tiết */}
        <div className="lg:col-span-2">
          <Card className="border-border shadow-sm bg-card/75 backdrop-blur-sm overflow-hidden rounded-[28px]">
            <div className="bg-muted/10 border-b border-border/40 p-4 sm:p-5">
              <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2 text-foreground">
                <User className="w-4.5 h-4.5 text-primary" /> Thông tin sinh học & Thể chất
              </h2>
              <p className="text-[11px] text-muted-foreground font-semibold mt-1">
                Vui lòng điền đầy đủ và cập nhật khi có thay đổi để AI Coach học hỏi thể trạng của chị tốt nhất.
              </p>
            </div>

            <CardContent className="p-5 sm:p-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                  {/* Họ và Tên */}
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="text-xs font-bold text-muted-foreground uppercase">Họ và Tên</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                      required
                    />
                  </div>

                  {/* Năm sinh */}
                  <div className="space-y-1.5">
                    <Label htmlFor="birthYear" className="text-xs font-bold text-muted-foreground uppercase">Năm sinh</Label>
                    <Input
                      id="birthYear"
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                      required
                    />
                  </div>

                  {/* Chiều cao */}
                  <div className="space-y-1.5">
                    <Label htmlFor="height" className="text-xs font-bold text-muted-foreground uppercase">Chiều cao (cm)</Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="pl-11 h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Cân nặng */}
                  <div className="space-y-1.5">
                    <Label htmlFor="weight" className="text-xs font-bold text-muted-foreground uppercase">Cân nặng (kg)</Label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="pl-11 h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Tuổi bắt đầu có kinh */}
                  <div className="space-y-1.5">
                    <Label htmlFor="periodAge" className="text-xs font-bold text-muted-foreground uppercase">Tuổi có kinh nguyệt đầu tiên</Label>
                    <div className="relative">
                      <Sparkles className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="periodAge"
                        type="number"
                        value={periodAge}
                        onChange={(e) => setPeriodAge(e.target.value)}
                        className="pl-11 h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Số lượng con đã sinh */}
                  <div className="space-y-1.5">
                    <Label htmlFor="childrenCount" className="text-xs font-bold text-muted-foreground uppercase">Số lượng con đã sinh</Label>
                    <div className="relative">
                      <Baby className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="childrenCount"
                        type="number"
                        value={childrenCount}
                        onChange={(e) => setChildrenCount(e.target.value)}
                        className="pl-11 h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {bmi > 0 && (
                  <div className="p-4 bg-muted border border-border rounded-2xl flex items-center justify-between text-xs font-bold shadow-inner">
                    <div>
                      <span className="text-muted-foreground">BMI ước tính: </span>
                      <span className="text-foreground text-sm font-black">{bmi}</span>
                    </div>
                    {bmiCat && (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${bmiCat.color}`}>
                        {bmiCat.label}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-3">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto h-11 px-8 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-95 shadow-md shadow-primary/25 active:scale-98 transition-transform cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang lưu...
                      </>
                    ) : (
                      "Lưu thay đổi"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
