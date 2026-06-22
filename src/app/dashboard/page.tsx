"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/use-user-store";
import { useLogStore } from "@/store/use-log-store";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useCycles } from "@/hooks/use-cycles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, Flame, Moon, Smile, Sparkles, AlertTriangle, 
  Calendar, ChevronRight, Activity, TrendingUp, Info, Copy, MessageCircle 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, ComposedChart 
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { dailyLogs } = useLogStore();
  const { getPeriScoreCategory, getLogForDate } = useDailyLog();
  const { nextPeriodDate, sortedCycles, averageCycleLength, averagePeriodDuration } = useCycles();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Đảm bảo Recharts và responsive state chỉ render phía client
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const latestCycle = sortedCycles[0];
  const isCurrentlyInPeriod = latestCycle && latestCycle.endDate === null;

  // 1. Tính toán PeriScore hôm nay
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayLog = getLogForDate(todayStr);
  const currentPeriScore = todayLog.periScore;
  const periScoreCat = getPeriScoreCategory(currentPeriScore);

  // 2. Phân tích dữ liệu 30 ngày gần đây
  const getChartData30Days = () => {
    const data = [];
    const moodScoreMap = {
      "very-good": 5,
      "good": 4,
      "neutral": 3,
      "bad": 2,
      "very-bad": 1,
    };

    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const log = dailyLogs[dateStr] || {
        symptoms: { hotFlashes: 0, insomnia: 0, nightSweats: 0 },
        sleep: { totalDuration: 0, quality: 0 },
        mood: { level: "neutral" }
      };

      data.push({
        dateLabel: format(date, "dd/MM"),
        "Bốc hỏa": log.symptoms.hotFlashes,
        "Mất ngủ": log.symptoms.insomnia,
        "Đổ mồ hôi đêm": log.symptoms.nightSweats,
        "Thời gian ngủ (giờ)": parseFloat((log.sleep.totalDuration / 60).toFixed(1)),
        "Chất lượng ngủ": log.sleep.quality,
        "Tâm trạng": moodScoreMap[log.mood.level as keyof typeof moodScoreMap] || 3,
      });
    }
    return data;
  };

  const chartData = getChartData30Days();

  // 3. Tính toán các thống kê trung bình 30 ngày
  const calculate30DayAverages = () => {
    let loggedDaysCount = 0;
    let totalHotFlashes = 0;
    let totalSleepDuration = 0;
    let totalSleepQuality = 0;
    let totalPeriScore = 0;

    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      const log = dailyLogs[dateStr];
      if (log) {
        loggedDaysCount++;
        totalHotFlashes += log.symptoms.hotFlashes;
        totalSleepDuration += log.sleep.totalDuration;
        totalSleepQuality += log.sleep.quality;
        totalPeriScore += log.periScore;
      }
    }

    return {
      loggedDaysCount,
      avgHotFlashes: loggedDaysCount > 0 ? (totalHotFlashes / loggedDaysCount).toFixed(1) : "0.0",
      avgSleep: loggedDaysCount > 0 ? (totalSleepDuration / loggedDaysCount / 60).toFixed(1) : "0.0",
      avgSleepQuality: loggedDaysCount > 0 ? (totalSleepQuality / loggedDaysCount).toFixed(1) : "0.0",
      avgPeriScore: loggedDaysCount > 0 ? Math.round(totalPeriScore / loggedDaysCount) : 0,
    };
  };

  const stats = calculate30DayAverages();
  const avgPeriScoreCat = getPeriScoreCategory(stats.avgPeriScore);

  // Đếm ngược đến chu kỳ tiếp theo
  const getDaysUntilNextPeriod = () => {
    if (isCurrentlyInPeriod) return "Đang hành kinh";
    if (!nextPeriodDate) return "--";
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(nextPeriodDate);
    target.setHours(0,0,0,0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? "Hôm nay" : diff > 0 ? `${diff} ngày` : `Trễ ${Math.abs(diff)} ngày`;
  };

  const daysUntilNextPeriod = getDaysUntilNextPeriod();

  // Phân nhóm thể trạng sức khỏe dựa trên nhật ký 30 ngày
  const getSymptomProfile = () => {
    let loggedDaysCount = 0;
    let severeInsomniaDays = 0;
    let severeHotFlashDays = 0;
    let severeAnxietyDays = 0;

    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      const log = dailyLogs[dateStr];
      if (log) {
        loggedDaysCount++;
        if (log.symptoms?.insomnia >= 2) severeInsomniaDays++;
        if ((log.symptoms?.hotFlashes >= 2) || (log.symptoms?.nightSweats >= 2)) severeHotFlashDays++;
        if ((log.symptoms?.anxiety >= 2) || (log.symptoms?.irritability >= 2)) severeAnxietyDays++;
      }
    }

    const hasAbnormalCycle = sortedCycles.some((c) => c.isAbnormal);

    const insomniaRatio = loggedDaysCount > 0 ? severeInsomniaDays / loggedDaysCount : 0;
    const hotFlashRatio = loggedDaysCount > 0 ? severeHotFlashDays / loggedDaysCount : 0;
    const anxietyRatio = loggedDaysCount > 0 ? severeAnxietyDays / loggedDaysCount : 0;

    if (loggedDaysCount < 3) {
      return { code: "DEFAULT", label: "Chăm sóc sức khỏe toàn diện" };
    }

    if (insomniaRatio >= 0.25) {
      return { code: "A", label: "Mất ngủ kéo dài" };
    }
    if (hotFlashRatio >= 0.25) {
      return { code: "B", label: "Bốc hỏa & Đổ mồ hôi đêm" };
    }
    if (anxietyRatio >= 0.25) {
      return { code: "C", label: "Lo âu & Căng thẳng" };
    }
    if (hasAbnormalCycle) {
      return { code: "D", label: "Rối loạn chu kỳ" };
    }

    return { code: "DEFAULT", label: "Chăm sóc sức khỏe toàn diện" };
  };

  const symptomProfile = getSymptomProfile();

  // Nội dung tư vấn Đông y tương ứng từng nhóm
  const getEasternMedicineAdvice = (code: string) => {
    switch (code) {
      case "A":
        return {
          title: "Chăm sóc giấc ngủ & An thần Đông y",
          description: "Thể trạng của chị ghi nhận tần suất mất ngủ khá cao. Trong Đông y, mất ngủ tuổi trung niên thường do âm hư hỏa vượng, tâm thận bất giao.",
          tips: [
            "Bài thuốc ngâm chân dưỡng tâm: Ngâm chân nước ấm pha gừng tươi và muối hạt 15 phút trước khi ngủ giúp dẫn hỏa quy nguyên, hỗ trợ ngủ sâu giấc.",
            "Bấm huyệt an thần trước khi ngủ: Xoa bóp nhẹ nhàng huyệt Dũng Tuyền (lòng bàn chân) và huyệt Nội Quan (cổ tay) từ 3-5 phút.",
            "Trà thảo dược hỗ trợ: Nên dùng trà Lạc Tiên, trà Tâm Sen, hoặc trà Táo Nhân ấm vào buổi tối để dưỡng tâm an thần."
          ]
        };
      case "B":
        return {
          title: "Thanh nhiệt, tư âm & Dịu bốc hỏa",
          description: "Cơn bốc hỏa đột ngột là triệu chứng điển hình của suy giảm Estrogen (tương đương thận thủy bất túc, hư hỏa bốc lên trong Đông y).",
          tips: [
            "Liệu pháp thanh nhiệt tư âm: Uống nước sắn dây khuấy chín hoặc trà hoa cúc trắng vào ban ngày để thanh can nhiệt, làm mát cơ thể.",
            "Chế độ dinh dưỡng mát: Tăng cường ăn đậu nành, mộc nhĩ trắng, râu ngô. Tuyệt đối hạn chế đồ cay nóng (ớt, tiêu, tỏi) sau 16h chiều.",
            "Mẹo hạ hỏa nhanh: Tập thở chậm bằng bụng (hít vào 4s, thở ra 6s) và dùng khăn mát chườm nhẹ sau gáy khi xuất hiện cơn bốc hỏa."
          ]
        };
      case "C":
        return {
          title: "Sơ can giải uất & Thư giãn thần trí",
          description: "Biến động cảm xúc lo âu, dễ cáu gắt là biểu hiện của tình trạng Can khí uất kết, ảnh hưởng đến tạng phủ trong Đông y.",
          tips: [
            "Trà thảo mộc thông khí giải uất: Trà hoa hồng hoặc trà hoa nhài ấm giúp hành khí, giải tỏa căng thẳng và điều hòa kinh mạch.",
            "Bài tập thở điều hòa khí huyết: Luyện tập thiền hoặc yoga nhẹ nhàng 15-20 phút hàng ngày, chú trọng hơi thở sâu bằng bụng.",
            "Bấm huyệt xoa dịu lo âu: Day nhẹ huyệt Thái Xung (ở mu bàn chân) và huyệt Hợp Cốc (kẽ ngón tay cái và trỏ) giúp sơ thông can khí."
          ]
        };
      case "D":
        return {
          title: "Bổ huyết, điều kinh & Cân bằng nội tiết",
          description: "Chu kỳ rối loạn, thất thường báo hiệu sự bất ổn của hai mạch Nhâm - Đốc và tạng Thận trong Đông y cận tuổi mãn kinh.",
          tips: [
            "Trà thảo dược hoạt huyết điều kinh: Sử dụng trà Ích Mẫu hoặc trà Đương Quy, kết hợp táo đỏ đun ấm uống hàng ngày.",
            "Vận động thông kinh lạc: Tập các tư thế yoga mở hông nhẹ nhàng (tư thế đứa trẻ, tư thế con bướm) để kích thích máu lưu thông vùng chậu.",
            "Giữ ấm cơ thể: Tránh nhiễm lạnh vùng bụng dưới và lòng bàn chân, đặc biệt là trong những ngày chuẩn bị hành kinh."
          ]
        };
      default:
        return {
          title: "Lối sống dưỡng sinh & Chăm sóc toàn diện 40+",
          description: "Chúc mừng thể trạng của chị khá ổn định! Hãy duy trì lối sống lành mạnh để bảo vệ sức khỏe và kéo dài tuổi thanh xuân.",
          tips: [
            "Dinh dưỡng bổ sung: Bổ sung nhiều rau xanh đậm, các loại hạt (hạnh nhân, óc chó) giàu phytoestrogen tự nhiên để bảo vệ xương khớp.",
            "Vận động nhẹ nhàng: Đi bộ nhanh, tập dưỡng sinh hoặc yoga từ 30 phút mỗi ngày giúp duy trì sự dẻo dai và khí huyết thông suốt.",
            "Giữ tinh thần an yên: Duy trì thói quen ghi nhật ký sức khỏe hàng ngày để luôn thấu hiểu và yêu thương bản thân."
          ]
        };
    }
  };

  const advice = getEasternMedicineAdvice(symptomProfile.code);

  // Logic sao chép dữ liệu sức khỏe và chuyển hướng Zalo tư vấn
  const handleZaloConsult = () => {
    const name = profile?.displayName || "Thành viên";
    const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : "--";
    const bmiVal = profile?.bmi || "--";
    const bmiCategory = bmiVal !== "--" 
      ? (bmiVal < 18.5 ? "Gầy" : bmiVal < 25 ? "Bình thường" : bmiVal < 30 ? "Thừa cân" : "Béo phì")
      : "Chưa cập nhật";
    
    let loggedDaysCount = 0;
    let severeInsomniaDays = 0;
    let severeHotFlashDays = 0;
    let severeAnxietyDays = 0;
    let lastLogNote = "";

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const todayLog = dailyLogs[todayStr];
    const yesterdayLog = dailyLogs[yesterdayStr];
    if (todayLog?.mood?.note) lastLogNote = todayLog.mood.note;
    else if (yesterdayLog?.mood?.note) lastLogNote = yesterdayLog.mood.note;

    for (let i = 0; i < 30; i++) {
      const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      const log = dailyLogs[dateStr];
      if (log) {
        loggedDaysCount++;
        if (log.symptoms?.insomnia >= 2) severeInsomniaDays++;
        if ((log.symptoms?.hotFlashes >= 2) || (log.symptoms?.nightSweats >= 2)) severeHotFlashDays++;
        if ((log.symptoms?.anxiety >= 2) || (log.symptoms?.irritability >= 2)) severeAnxietyDays++;
      }
    }

    const message = `KÍNH GỬI BÁC SĨ ĐÔNG Y - BÁO CÁO SỨC KHỎE TIỀN MÃN KINH
---------------------------------
- Họ và tên: ${name} (${age} tuổi)
- Chiều cao/Cân nặng: ${profile?.height || "--"} cm / ${profile?.weight || "--"} kg
- Chỉ số BMI: ${bmiVal} (${bmiCategory})
- Chỉ số PeriScore hôm nay: ${currentPeriScore}/100 (${periScoreCat.label})
- Dữ liệu nhật ký 30 ngày qua (Ghi chép ${loggedDaysCount} ngày):
  + Số ngày mất ngủ nặng: ${severeInsomniaDays} ngày
  + Số ngày bốc hỏa/đổ mồ hôi đêm nặng: ${severeHotFlashDays} ngày
  + Số ngày lo âu/căng thẳng nặng: ${severeAnxietyDays} ngày
- Chu kỳ kinh nguyệt trung bình: ${averageCycleLength} ngày (Thời gian hành kinh TB: ${averagePeriodDuration} ngày)
- Ghi chú sức khỏe gần nhất: "${lastLogNote || "Không có ghi chú"}"
---------------------------------
Tôi cần tư vấn giải pháp Đông y cải thiện thể trạng tuổi 40+.`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(message)
        .then(() => {
          toast.success("Đã tự động gom và sao chép tóm tắt sức khỏe của chị!");
          toast.info("Đang chuyển hướng Zalo... Chị chỉ cần Nhấp chuột phải -> Dán (Paste) để gửi báo cáo cho Bác sĩ Đông y.", { duration: 6000 });
          
          setTimeout(() => {
            window.open("https://zalo.me/0982581222", "_blank");
          }, 1500);
        })
        .catch((err) => {
          console.error("Lỗi sao chép: ", err);
          toast.error("Không thể tự động sao chép. Đang mở Zalo tư vấn bác sĩ: 0982581222.");
          setTimeout(() => {
            window.open("https://zalo.me/0982581222", "_blank");
          }, 1500);
        });
    } else {
      window.open("https://zalo.me/0982581222", "_blank");
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Banner Chào Mừng Cao Cấp */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/20 to-background border border-border/80 p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-extrabold text-sm shrink-0">
                {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : "C"}
              </span>
              Chào chị, <span className="text-primary">{profile?.displayName || "Thành viên"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-semibold leading-relaxed max-w-lg">
              Hôm nay là {format(new Date(), "EEEE, 'ngày' d 'tháng' M, yyyy", { locale: vi })}. Chúc chị một ngày tràn đầy năng lượng và an lành!
            </p>
          </div>
          <Link href="/log" className="shrink-0 self-start sm:self-auto">
            <Button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 transition-transform">
              Ghi nhật ký ngay <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        {/* Vector trang trí */}
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mb-10"></div>
        <div className="absolute left-1/3 top-0 w-24 h-24 bg-secondary/20 rounded-full blur-2xl -mt-10"></div>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: PeriScore */}
        <Card className="border-border shadow-sm overflow-hidden bg-card/75 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-1.5">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground truncate">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </span>
              PeriScore hôm nay
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-1 sm:p-4 sm:pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl md:text-3xl font-black text-primary">{currentPeriScore}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">/100</span>
            </div>
            <span className={`inline-block text-[9px] sm:text-[10px] md:text-[11px] font-extrabold px-2 py-0.5 rounded-full mt-1.5 border ${periScoreCat.color}`}>
              {periScoreCat.label}
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Next Period */}
        <Card className="border-border shadow-sm overflow-hidden bg-card/75 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-1.5">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground truncate">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </span>
              Kỳ kinh tiếp theo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-1 sm:p-4 sm:pt-1">
            <div className="text-base sm:text-lg md:text-xl font-black text-foreground truncate leading-tight">
              {daysUntilNextPeriod}
            </div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-2 font-semibold truncate">
              {isCurrentlyInPeriod ? "Hãy chăm sóc bản thân" : `Chu kỳ TB: ${averageCycleLength} ngày`}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Avg Sleep */}
        <Card className="border-border shadow-sm overflow-hidden bg-card/75 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-1.5">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground truncate">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Moon className="w-3.5 h-3.5" />
              </span>
              Giấc ngủ trung bình
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-1 sm:p-4 sm:pt-1">
            <div className="text-base sm:text-lg md:text-xl font-black text-foreground truncate leading-tight">
              {stats.avgSleep} giờ
            </div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-2 font-semibold truncate">
              Chất lượng: <span className="font-bold text-primary">{stats.avgSleepQuality}</span> / 10
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Avg Hot Flashes */}
        <Card className="border-border shadow-sm overflow-hidden bg-card/75 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-1.5">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-muted-foreground truncate">
              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </span>
              Bốc hỏa trung bình
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-1 sm:p-4 sm:pt-1">
            <div className="text-base sm:text-lg md:text-xl font-black text-foreground truncate leading-tight">
              {stats.avgHotFlashes} / 3.0
            </div>
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-2 font-semibold truncate">
              Trong 30 ngày qua
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: PeriScore detail & Medical Disclaimer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PeriScore Detail Card */}
        <Card className="border-border shadow-sm bg-gradient-to-br from-card via-card to-secondary/5">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Chỉ số PeriScore (30 ngày)
            </CardTitle>
            <CardDescription className="text-xs">
              Điểm số phản ánh mức độ ảnh hưởng của các triệu chứng tiền mãn kinh
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-0 space-y-4">
            <div className="text-center py-4 bg-muted/20 rounded-2xl border border-border/40">
              <div className="text-5xl font-black text-primary">{stats.avgPeriScore}</div>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">Chỉ số PeriScore trung bình</p>
              
              <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full mt-3 border ${avgPeriScoreCat.color}`}>
                {avgPeriScoreCat.label}
              </span>
            </div>

            <div className="space-y-2 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-primary" /> Giải thích chỉ số PeriScore
              </p>
              <ul className="list-disc pl-4 space-y-1 font-medium">
                <li><span className="font-bold text-foreground">0 - 30 (Thấp):</span> Các triệu chứng nhẹ, ít ảnh hưởng tiêu cực đến chất lượng sống.</li>
                <li><span className="font-bold text-foreground">31 - 60 (Trung bình):</span> Bắt đầu có bốc hỏa, mất ngủ rõ rệt. Cần điều chỉnh lối sống và dinh dưỡng.</li>
                <li><span className="font-bold text-foreground">61 - 100 (Cao):</span> Các triệu chứng nghiêm trọng. Chị nên tham khảo ý kiến của bác sĩ sản phụ khoa.</li>
              </ul>
            </div>

            {/* Medical disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60 rounded-xl text-[10px] sm:text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 font-semibold mt-2 shadow-inner">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-500" />
              <span>
                KHUYẾN CÁO: Điểm số này dựa trên tự đánh giá triệu chứng của chị, chỉ mang tính tham khảo cải thiện lối sống và tuyệt đối không thay thế chẩn đoán y khoa từ bác sĩ.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Coach Suggestion Quick Card */}
        <Card className="lg:col-span-2 border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary fill-current" /> AI Coach của chị nói gì?
            </CardTitle>
            <CardDescription className="text-xs">
              Lời khuyên cá nhân hóa dựa trên dữ liệu sức khỏe 7 ngày qua của chị
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-0 space-y-3 flex-1 flex flex-col justify-center">
            <div className="p-4 bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl relative">
              <p className="text-xs sm:text-sm leading-relaxed font-semibold italic text-foreground relative z-10">
                {stats.loggedDaysCount === 0 
                  ? "Chào chị! Hãy ghi nhận nhật ký triệu chứng tối thiểu 1 ngày để tôi có cơ sở phân tích thể trạng và đưa ra các lời khuyên dinh dưỡng, vận động cá nhân hóa dành riêng cho chị."
                  : stats.avgPeriScore > 50 
                    ? "Gần đây chỉ số bốc hỏa và mất ngủ của chị khá cao. Chị nên thử uống một ly trà hoa cúc ấm trước khi ngủ, ngâm chân nước ấm và duy trì phòng ngủ thoáng mát khoảng 22-24°C để giấc ngủ sâu hơn nhé."
                    : "Thể trạng của chị trong 30 ngày qua khá ổn định. Hãy duy trì đi bộ nhẹ nhàng 30 phút mỗi ngày và tăng cường các thực phẩm giàu phytoestrogen như đậu nành, hạt lanh chị nhé."}
              </p>
              {/* Bóng hội thoại trang trí */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-primary/5 rounded-full blur-sm"></div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 sm:p-6 flex justify-end">
            <Link href="/chat" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-10 rounded-xl border-border hover:bg-muted text-xs font-extrabold flex items-center justify-center gap-1.5 text-primary">
                Trò chuyện với AI Coach <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Grid: Gợi ý Đông y & Đăng ký Tư vấn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Gợi ý Đông y (takes 2 cols) */}
        <Card className="lg:col-span-2 border-border shadow-sm bg-gradient-to-br from-card via-card to-primary/5 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-current shrink-0" /> Gợi ý chăm sóc Đông y dành riêng cho chị
              </CardTitle>
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                Thể trạng: {symptomProfile.label}
              </span>
            </div>
            <CardDescription className="text-xs mt-1.5 leading-relaxed font-semibold">
              {advice.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-0 space-y-3.5 flex-1">
            <div className="space-y-2.5 border-t border-border/40 pt-4">
              <p className="font-bold text-foreground text-[11px] uppercase tracking-wider">
                Các phương pháp chăm sóc kiến nghị:
              </p>
              <ul className="space-y-2.5">
                {advice.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground font-semibold leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Zalo consultation CTA (takes 1 col) */}
        <Card className="border-primary/20 shadow-md bg-gradient-to-br from-primary/5 via-card to-secondary/15 relative overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 sm:p-6 relative z-10">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Bác sĩ Đông y tư vấn
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed mt-1 font-semibold">
              Chị đã ghi chép sức khỏe đều đặn. Hãy nhận tư vấn trực tiếp từ bác sĩ chuyên khoa Đông y để được thiết lập phác đồ điều trị phù hợp nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-0 space-y-4 relative z-10 flex-1">
            <div className="p-3 bg-card/90 rounded-2xl border border-border/50 text-[10px] text-muted-foreground space-y-1 font-semibold leading-relaxed">
              <p className="font-bold text-foreground flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary" /> Báo cáo sẽ gửi đi gồm:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Họ tên, tuổi, chỉ số BMI</li>
                <li>Chỉ số PeriScore 30 ngày</li>
                <li>Thống kê số ngày mất ngủ/bốc hỏa</li>
                <li>Ghi chú gần nhất của chị</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 sm:p-6 relative z-10">
            <Button 
              onClick={handleZaloConsult}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:bg-primary/95 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-98 transition-transform"
            >
              <Copy className="w-4 h-4" /> Sao chép & Gửi Zalo tư vấn
            </Button>
          </CardFooter>
          {/* Vector hình tròn trang trí nền */}
          <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-primary/5 rounded-full blur-xl"></div>
        </Card>
      </div>

      {/* Section: Analytics Charts (30 days) */}

      {/* Section: Analytics Charts (30 days) */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base font-extrabold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Xu hướng & Phân tích sức khỏe (30 ngày gần nhất)
          </CardTitle>
          <CardDescription className="text-xs">
            Trực quan hóa sự thay đổi triệu chứng và tương quan giấc ngủ - tâm trạng
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6 pt-0 border-t border-border/40">
          {stats.loggedDaysCount === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm font-semibold">
              Chưa có đủ dữ liệu ghi chép nhật ký 30 ngày qua để vẽ biểu đồ xu hướng.
            </div>
          ) : (
            isMounted && (
              <div className="space-y-8 pt-4">
                {/* Chart 1: Triệu chứng Hot Flashes vs Insomnia */}
                <div className="space-y-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">Xu hướng Bốc hỏa & Mất ngủ</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Theo dõi cường độ từ 0 (Không bị) đến 3 (Nặng)</p>
                  <div className="h-60 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: isMobile ? -30 : -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1DDE7" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: isMobile ? 8 : 10 }} stroke="#7A4E6D" interval={isMobile ? 5 : 2} />
                        <YAxis domain={[0, 3]} tickCount={4} tick={{ fontSize: isMobile ? 8 : 10 }} stroke="#7A4E6D" />
                        <Tooltip contentStyle={{ borderRadius: "10px", borderColor: "#F1DDE7", fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? 9 : 11 }} />
                        <Line type="monotone" dataKey="Bốc hỏa" stroke="#D96C9D" strokeWidth={isMobile ? 2 : 3} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="Mất ngủ" stroke="#7A4E6D" strokeWidth={isMobile ? 2 : 3} />
                        <Line type="monotone" dataKey="Đổ mồ hôi đêm" stroke="#ED8EB9" strokeWidth={isMobile ? 1.5 : 2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Sleep vs Mood Correlation */}
                <div className="space-y-2 border-t border-border/30 pt-6">
                  <h4 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">Mối tương quan giữa Giấc ngủ & Cảm xúc</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-normal">So sánh số giờ ngủ thực tế, chất lượng ngủ (1-10) và mức cảm xúc (1: Rất buồn đến 5: Rất tốt)</p>
                  <div className="h-60 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: isMobile ? -30 : -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1DDE7" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: isMobile ? 8 : 10 }} stroke="#7A4E6D" interval={isMobile ? 5 : 2} />
                        <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: isMobile ? 8 : 10 }} stroke="#7A4E6D" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: isMobile ? 8 : 10 }} stroke="#7A4E6D" />
                        <Tooltip contentStyle={{ borderRadius: "10px", borderColor: "#F1DDE7", fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? 9 : 11 }} />
                        <Bar yAxisId="left" dataKey="Thời gian ngủ (giờ)" fill="#F8D7E6" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="left" type="monotone" dataKey="Chất lượng ngủ" stroke="#B05581" strokeWidth={2} dot={{ r: 2 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Tâm trạng" stroke="#D96C9D" strokeWidth={2} dot={{ r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
