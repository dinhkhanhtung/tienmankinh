"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { useUserStore } from "@/store/use-user-store";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Heart, ShieldAlert, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { profile, setProfile } = useUserStore();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [step, setStep] = useState(0); // 0: Disclaimer, 1: Thể chất, 2: Sinh sản, 3: Chu kỳ gần nhất
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  
  // Step 1: Thể chất
  const [birthYear, setBirthYear] = useState<string>("1975");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  
  // Step 2: Sinh sản
  const [periodAge, setPeriodAge] = useState<string>("13");
  const [childrenCount, setChildrenCount] = useState<string>("2");

  // Step 3: Chu kỳ gần nhất
  const [lastPeriodDate, setLastPeriodDate] = useState<string>("");
  const [cycleLength, setCycleLength] = useState<string>("28");

  useEffect(() => {
    // Nếu hết loading auth mà không có user, chuyển hướng về login
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Tự động tính BMI
  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const bmi = heightNum && weightNum ? parseFloat((weightNum / ((heightNum / 100) * (heightNum / 100))).toFixed(1)) : 0;

  const handleNextStep = () => {
    if (step === 0 && !acceptedDisclaimer) {
      toast.error("Vui lòng đọc và đồng ý với điều khoản pháp lý y khoa để tiếp tục.");
      return;
    }
    if (step === 1) {
      if (!birthYear || parseInt(birthYear) < 1930 || parseInt(birthYear) > new Date().getFullYear()) {
        toast.error("Vui lòng nhập năm sinh hợp lệ.");
        return;
      }
      if (!height || parseFloat(height) < 100 || parseFloat(height) > 250) {
        toast.error("Vui lòng nhập chiều cao hợp lệ (100cm - 250cm).");
        return;
      }
      if (!weight || parseFloat(weight) < 30 || parseFloat(weight) > 200) {
        toast.error("Vui lòng nhập cân nặng hợp lệ (30kg - 200kg).");
        return;
      }
    }
    if (step === 2) {
      if (!periodAge || parseInt(periodAge) < 8 || parseInt(periodAge) > 25) {
        toast.error("Vui lòng nhập độ tuổi bắt đầu có kinh hợp lệ (8 - 25 tuổi).");
        return;
      }
      if (!childrenCount || parseInt(childrenCount) < 0 || parseInt(childrenCount) > 20) {
        toast.error("Vui lòng nhập số con hợp lệ.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!lastPeriodDate) {
      toast.error("Vui lòng chọn ngày bắt đầu kỳ kinh gần nhất.");
      return;
    }
    if (!cycleLength || parseInt(cycleLength) < 15 || parseInt(cycleLength) > 60) {
      toast.error("Vui lòng nhập độ dài chu kỳ trung bình hợp lệ (15 - 60 ngày).");
      return;
    }

    if (!user) return;

    setSubmitting(true);
    try {
      const onboardedProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Thành viên",
        photoURL: user.photoURL,
        birthYear: parseInt(birthYear),
        height: parseFloat(height),
        weight: parseFloat(weight),
        bmi: bmi,
        periodAge: parseInt(periodAge),
        childrenCount: parseInt(childrenCount),
        isOnboarded: true,
        theme: "light" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Lưu Profile lên Firestore
      await setDoc(doc(db, "users", user.uid), onboardedProfile);

      // Tạo một chu kỳ đầu tiên tự động
      const initialCycle = {
        id: `initial_${Date.now()}`,
        userId: user.uid,
        startDate: lastPeriodDate,
        endDate: null, // Đang theo dõi
        duration: null,
        cycleLength: parseInt(cycleLength),
        notes: "Chu kỳ khởi tạo ban đầu",
      };
      await setDoc(doc(db, "cycles", initialCycle.id), initialCycle);

      // Lưu Profile vào Zustand
      setProfile(onboardedProfile);

      // Gửi thông báo ngầm đến Telegram & Notion
      fetch("/api/customer-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...onboardedProfile,
          lastPeriodDate,
          cycleLength: parseInt(cycleLength),
          action: "onboarding",
        }),
      }).catch((err) => {
        console.error("Lỗi gửi thông báo tích hợp ngầm:", err);
      });

      toast.success("Cấu hình tài khoản thành công! Chào mừng bạn.");
      router.push("/dashboard");
    } catch (error) {
      console.error("Lỗi khi onboarding: ", error);
      toast.error("Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground text-base">Đang tải thông tin xác thực...</p>
      </div>
    );
  }

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-secondary/20 via-background to-primary/5 min-h-screen max-w-md mx-auto w-full page-transition">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-primary mb-3 shadow-inner">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">Thiết lập sức khỏe</h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-semibold">
          Hãy giúp chúng tôi cá nhân hóa lộ trình chăm sóc sức khỏe của chị.
        </p>
      </div>

      {/* Progress Bar */}
      {step > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-bold">
            <span>Bước {step} trên 3</span>
            <span>{Math.round(progressPercentage)}% Hoàn thành</span>
          </div>
          <div className="w-full bg-secondary/60 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Steps Content */}
      <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-[28px] shadow-lg p-6 sm:p-8 flex flex-col gap-5">
        {/* STEP 0: Disclaimer */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/10 rounded-2xl text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div className="text-xs leading-relaxed font-semibold">
                <span className="font-bold text-[10px] uppercase tracking-wider block mb-1">Tuyên bố miễn trách nhiệm y khoa:</span>
                <p>
                  Mọi phân tích sức khỏe, chỉ số PeriScore và tư vấn lối sống của trợ lý AI Coach chỉ mang tính chất tham khảo và hỗ trợ cải thiện lối sống. Ứng dụng <span className="underline font-black">không thay thế</span> chẩn đoán chuyên khoa hoặc can thiệp lâm sàng từ bác sĩ.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted/40 border border-border/60 rounded-2xl">
              <Switch
                id="disclaimer-check"
                checked={acceptedDisclaimer}
                onCheckedChange={setAcceptedDisclaimer}
                className="data-[state=checked]:bg-primary cursor-pointer"
              />
              <Label
                htmlFor="disclaimer-check"
                className="text-xs sm:text-sm leading-relaxed text-foreground cursor-pointer font-bold select-none"
              >
                Tôi đã hiểu ứng dụng chỉ mang tính chất tham khảo dưỡng sinh, không thay thế bác sĩ.
              </Label>
            </div>

            <Button
              onClick={handleNextStep}
              className="w-full h-12 text-xs sm:text-sm font-black rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-95 shadow-md shadow-primary/20 transition-all mt-2 active:scale-98"
            >
              Tôi đồng ý và tiếp tục <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* STEP 1: Physical Data */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="birthYear" className="text-xs font-bold text-muted-foreground uppercase">
                Năm sinh của chị
              </Label>
              <Input
                id="birthYear"
                type="number"
                min="1930"
                max={new Date().getFullYear()}
                placeholder="Ví dụ: 1975"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="h-11 rounded-xl border-border bg-background focus:ring-primary font-semibold text-sm"
              />
              <p className="text-[10px] text-muted-foreground font-semibold">Ứng dụng được tối ưu hóa cho phụ nữ tuổi từ 40–55.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="height" className="text-xs font-bold text-muted-foreground uppercase">
                  Chiều cao (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Ví dụ: 158"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-11 rounded-xl border-border bg-background focus:ring-primary font-semibold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="weight" className="text-xs font-bold text-muted-foreground uppercase">
                  Cân nặng (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Ví dụ: 54"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-11 rounded-xl border-border bg-background focus:ring-primary font-semibold text-sm"
                />
              </div>
            </div>

            {bmi > 0 && (
              <div className="p-3.5 bg-muted border border-border/80 rounded-2xl flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-muted-foreground">BMI ước tính: </span>
                  <span className="text-foreground font-black">{bmi}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  bmi < 18.5 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                  bmi < 25 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                  bmi < 30 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                }`}>
                  {bmi < 18.5 ? "Gầy" :
                   bmi < 25 ? "Bình thường" :
                   bmi < 30 ? "Thừa cân" : "Béo phì"}
                </span>
              </div>
            )}

            <div className="flex gap-3 mt-3">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-11 text-xs rounded-xl font-bold border-border hover:bg-muted"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 h-11 text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 active:scale-98 shadow-sm"
              >
                Tiếp tục <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Reproduction Data */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="periodAge" className="text-xs font-bold text-muted-foreground uppercase">
                Tuổi bắt đầu có kinh nguyệt lần đầu
              </Label>
              <Input
                id="periodAge"
                type="number"
                min="8"
                max="25"
                placeholder="Ví dụ: 13"
                value={periodAge}
                onChange={(e) => setPeriodAge(e.target.value)}
                className="h-11 rounded-xl border-border bg-background focus:ring-primary font-semibold text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="childrenCount" className="text-xs font-bold text-muted-foreground uppercase">
                Số lượng con đã sinh
              </Label>
              <Input
                id="childrenCount"
                type="number"
                min="0"
                max="20"
                placeholder="Ví dụ: 2"
                value={childrenCount}
                onChange={(e) => setChildrenCount(e.target.value)}
                className="h-11 rounded-xl border-border bg-background focus:ring-primary font-semibold text-sm"
              />
            </div>

            <div className="flex gap-3 mt-3">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-11 text-xs rounded-xl font-bold border-border hover:bg-muted"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 h-11 text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 active:scale-98 shadow-sm"
              >
                Tiếp tục <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Period tracking info */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="lastPeriodDate" className="text-xs font-bold text-muted-foreground uppercase">
                Ngày bắt đầu kỳ kinh gần nhất
              </Label>
              <Input
                id="lastPeriodDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={lastPeriodDate}
                onChange={(e) => setLastPeriodDate(e.target.value)}
                className="h-11 rounded-xl border-border bg-background focus:ring-primary font-semibold text-sm"
              />
              <p className="text-[10px] text-muted-foreground font-semibold">
                Mốc quan trọng giúp AI dự báo chuẩn xác vòng kinh tiếp theo.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cycleLength" className="text-xs font-bold text-muted-foreground uppercase">
                Vòng chu kỳ kinh nguyệt trung bình (ngày)
              </Label>
              <Input
                id="cycleLength"
                type="number"
                min="15"
                max="60"
                placeholder="Thông thường là 28-30 ngày"
                value={cycleLength}
                onChange={(e) => setCycleLength(e.target.value)}
                className="h-11 rounded-xl border-border bg-background focus:ring-primary font-semibold text-sm"
              />
              <p className="text-[10px] text-muted-foreground font-semibold">
                Số ngày tính từ khi bắt đầu kỳ kinh này đến khi bắt đầu kỳ tiếp theo.
              </p>
            </div>

            <div className="flex gap-3 mt-3">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-11 text-xs rounded-xl font-bold border-border hover:bg-muted"
                disabled={submitting}
              >
                Quay lại
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 h-11 text-xs rounded-xl font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-95 flex items-center justify-center shadow-md active:scale-98"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Đang lưu...
                  </>
                ) : (
                  <>
                    Hoàn tất <Sparkles className="w-4 h-4 ml-1.5 fill-current text-white animate-pulse" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
