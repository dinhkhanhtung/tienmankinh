"use client";

import React, { useState, useEffect } from "react";
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
import { User, Scale, Activity, Baby, Sparkles, Loader2, Bell, FileText, ChevronRight, Heart } from "lucide-react";
import { toast } from "sonner";
import { DonateDialog } from "@/components/layout/donate-dialog";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, updateProfile } = useUserStore();
  
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
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
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground sm:text-3xl">Hồ sơ sức khỏe</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-semibold leading-relaxed">
          Quản lý thông tin thể chất, sinh học và cài đặt thông báo nhắc nhở sức khỏe hàng ngày.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side Card: Summary & BMI */}
        <Card className="border-border shadow-sm h-fit bg-card/75 backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center pb-4 bg-muted/10 border-b border-border/40">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary text-primary flex items-center justify-center font-black text-2xl sm:text-3xl shadow-inner">
              {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <CardTitle className="text-base sm:text-lg font-extrabold mt-2">{profile.displayName}</CardTitle>
            <CardDescription className="text-xs font-semibold text-muted-foreground">{profile.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-5">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thông số thể hình</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 text-center">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Chiều cao</div>
                  <div className="text-base sm:text-lg font-black text-foreground mt-0.5">
                    {profile.height ? `${profile.height} cm` : "Chưa cập nhật"}
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-2xl border border-border/50 text-center">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Cân nặng</div>
                  <div className="text-base sm:text-lg font-black text-foreground mt-0.5">
                    {profile.weight ? `${profile.weight} kg` : "Chưa cập nhật"}
                  </div>
                </div>
              </div>
            </div>

            {profile.bmi && profile.bmi > 0 ? (
              <div className="space-y-2.5 pt-4 border-t border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Chỉ số BMI hiện tại</span>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-black text-primary">{profile.bmi}</div>
                  {bmiCat && (
                    <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${bmiCat.color}`}>
                      {bmiCat.label}
                    </span>
                  )}
                </div>
                <div className="w-full bg-secondary/40 h-2.5 rounded-full overflow-hidden relative">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((profile.bmi / 40) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-semibold">
                  * Chỉ số khối cơ thể (BMI) bình thường dao động từ 18.5 - 24.9.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Card 2: Reports & Settings */}
        <Card className="border-border shadow-sm h-fit bg-card/75 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 bg-muted/10 border-b border-border/40 p-4">
            <CardTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Báo cáo & Thiết lập
            </CardTitle>
            <CardDescription className="text-xs">
              Xuất dữ liệu sức khỏe định kỳ và quản lý thông báo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-5">
            {/* Nhắc nhở ghi log */}
            <div className="flex items-center justify-between py-1 cursor-pointer">
              <div className="space-y-0.5 max-w-[70%]">
                <Label htmlFor="notify-switch" className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer">
                  <Bell className="w-4 h-4 text-primary" /> Nhắc nhở mỗi ngày
                </Label>
                <p className="text-[10px] text-muted-foreground leading-normal font-semibold">
                  Nhận thông báo nhắc nhở ghi nhật ký lúc 21:00 tối
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
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Xuất báo cáo sức khỏe</span>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push("/report?range=3")}
                  variant="outline"
                  className="w-full h-10 rounded-xl justify-between border-border text-xs font-bold text-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Báo cáo 3 tháng qua
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                
                <Button
                  onClick={() => router.push("/report?range=6")}
                  variant="outline"
                  className="w-full h-10 rounded-xl justify-between border-border text-xs font-bold text-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Báo cáo 6 tháng qua
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>

                <Button
                  onClick={() => router.push("/report?range=12")}
                  variant="outline"
                  className="w-full h-10 rounded-xl justify-between border-border text-xs font-bold text-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Báo cáo 12 tháng qua
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* Đồng hành cùng dự án */}
            <div className="space-y-2.5 pt-4 border-t border-border/40">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Đồng hành cùng dự án</span>
              <DonateDialog trigger={
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl justify-between border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary transition-all duration-300"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-current text-primary animate-pulse" />
                    Ủng hộ duy trì ứng dụng
                  </span>
                  <span className="text-[9px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Tự nguyện</span>
                </Button>
              } />
            </div>
          </CardContent>
        </Card>

        {/* Right side Form: Edit Profile */}
        <Card className="lg:col-span-2 border-border shadow-sm bg-card/75 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/40 p-4 sm:p-5">
            <CardTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Thông tin cá nhân
            </CardTitle>
            <CardDescription className="text-xs">
              Cập nhật thông tin sinh học chính xác giúp AI Coach phân tích chính xác nhất.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tên */}
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

                {/* Tuổi có kinh */}
                <div className="space-y-1.5">
                  <Label htmlFor="periodAge" className="text-xs font-bold text-muted-foreground uppercase">Tuổi có kinh lần đầu</Label>
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

                {/* Số con */}
                <div className="space-y-1.5">
                  <Label htmlFor="childrenCount" className="text-xs font-bold text-muted-foreground uppercase">Số con đã sinh</Label>
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
                <div className="p-3.5 bg-muted border border-border rounded-xl flex items-center justify-between text-xs font-bold shadow-inner">
                  <div>
                    <span className="text-muted-foreground">BMI ước tính: </span>
                    <span className="text-foreground text-sm font-black">{bmi}</span>
                  </div>
                  {bmiCat && (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${bmiCat.color}`}>
                      {bmiCat.label}
                    </span>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full sm:w-auto h-11 px-8 text-xs sm:text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center transition-colors active:scale-98"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang cập nhật...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
