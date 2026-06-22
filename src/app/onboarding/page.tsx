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
    <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-background max-w-md mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-primary mb-4 shadow-sm">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Thiết lập sức khỏe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hãy giúp chúng tôi cá nhân hóa trải nghiệm theo dõi sức khỏe của bạn.
        </p>
      </div>

      {/* Progress Bar */}
      {step > 0 && (
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2 font-medium">
            <span>Bước {step} trên 3</span>
            <span>{Math.round(progressPercentage)}% Hoàn thành</span>
          </div>
          <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Steps Content */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col gap-6">
        {/* STEP 0: Disclaimer */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed font-medium">
                <span className="font-bold">TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM Y TẾ:</span>
                <p className="mt-1">
                  Mọi phân tích, chỉ số PeriScore và lời khuyên từ AI Coach trong ứng dụng chỉ mang tính chất tham khảo, giáo dục và hỗ trợ cải thiện lối sống. Ứng dụng <span className="underline font-bold">không thay thế</span> các chẩn đoán, khám bệnh y khoa hoặc can thiệp lâm sàng từ bác sĩ chuyên khoa.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted border border-border rounded-xl">
              <Switch
                id="disclaimer-check"
                checked={acceptedDisclaimer}
                onCheckedChange={setAcceptedDisclaimer}
                className="data-[state=checked]:bg-primary"
              />
              <Label
                htmlFor="disclaimer-check"
                className="text-sm leading-relaxed text-foreground cursor-pointer font-medium select-none"
              >
                Tôi hiểu rằng ứng dụng chỉ mang tính chất tham khảo, không thay thế chẩn đoán y khoa.
              </Label>
            </div>

            <Button
              onClick={handleNextStep}
              className="w-full h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors mt-2"
            >
              Tôi đồng ý và tiếp tục <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 1: Physical Data */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="birthYear" className="text-sm font-semibold text-foreground">
                Năm sinh của bạn
              </Label>
              <Input
                id="birthYear"
                type="number"
                min="1930"
                max={new Date().getFullYear()}
                placeholder="Ví dụ: 1975"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="h-12 text-lg rounded-xl border-border bg-background focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">Ứng dụng hỗ trợ tốt nhất cho phụ nữ tuổi từ 40–55.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm font-semibold text-foreground">
                  Chiều cao (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Ví dụ: 158"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-12 text-lg rounded-xl border-border bg-background focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-semibold text-foreground">
                  Cân nặng (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Ví dụ: 54"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-12 text-lg rounded-xl border-border bg-background focus:ring-primary"
                />
              </div>
            </div>

            {bmi > 0 && (
              <div className="p-4 bg-muted/50 border border-border rounded-xl flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">Chỉ số BMI dự kiến: </span>
                  <span className="font-bold text-foreground">{bmi}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  bmi < 18.5 ? "bg-blue-100 text-blue-800" :
                  bmi < 25 ? "bg-green-100 text-green-800" :
                  bmi < 30 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                }`}>
                  {bmi < 18.5 ? "Gầy" :
                   bmi < 25 ? "Bình thường" :
                   bmi < 30 ? "Thừa cân" : "Béo phì"}
                </span>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-12 font-semibold rounded-xl border-border"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 h-12 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Tiếp tục <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Reproduction Data */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="periodAge" className="text-sm font-semibold text-foreground">
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
                className="h-12 text-lg rounded-xl border-border bg-background focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="childrenCount" className="text-sm font-semibold text-foreground">
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
                className="h-12 text-lg rounded-xl border-border bg-background focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-12 font-semibold rounded-xl border-border"
              >
                Quay lại
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 h-12 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Tiếp tục <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Period tracking info */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="lastPeriodDate" className="text-sm font-semibold text-foreground">
                Ngày bắt đầu kỳ kinh gần nhất
              </Label>
              <Input
                id="lastPeriodDate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={lastPeriodDate}
                onChange={(e) => setLastPeriodDate(e.target.value)}
                className="h-12 text-lg rounded-xl border-border bg-background focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Mốc quan trọng để chúng tôi dự báo kỳ kinh tiếp theo của bạn.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycleLength" className="text-sm font-semibold text-foreground">
                Độ dài chu kỳ kinh nguyệt trung bình (ngày)
              </Label>
              <Input
                id="cycleLength"
                type="number"
                min="15"
                max="60"
                placeholder="Thông thường là 28-30 ngày"
                value={cycleLength}
                onChange={(e) => setCycleLength(e.target.value)}
                className="h-12 text-lg rounded-xl border-border bg-background focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Số ngày từ khi bắt đầu kỳ kinh này đến khi bắt đầu kỳ kinh tiếp theo.
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                className="flex-1 h-12 font-semibold rounded-xl border-border"
                disabled={submitting}
              >
                Quay lại
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 h-12 font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang lưu...
                  </>
                ) : (
                  <>
                    Hoàn tất <Sparkles className="w-4 h-4 ml-1.5 fill-current" />
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
