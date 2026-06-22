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
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkMobile);
    };
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

  // Nội dung tư vấn dưỡng sinh tự nhiên tương ứng từng nhóm
  const getNaturalAdvice = (code: string) => {
    switch (code) {
      case "A":
        return {
          title: "Liệu pháp cải thiện giấc ngủ tự nhiên",
          description: "Thể trạng của chị ghi nhận tần suất mất ngủ khá cao. Tình trạng mất ngủ tuổi trung niên thường do mất cân bằng thể trạng và căng thẳng kéo dài gây ra.",
          tips: [
            "Ngâm chân thảo mộc dưỡng tâm: Ngâm chân nước ấm pha gừng tươi và muối hạt 15 phút trước khi ngủ giúp máu huyết lưu thông, hỗ trợ ngủ sâu giấc.",
            "Bấm huyệt thư giãn trước khi ngủ: Xoa bóp nhẹ nhàng huyệt Dũng Tuyền (lòng bàn chân) và huyệt Nội Quan (cổ tay) từ 3-5 phút.",
            "Trà thảo mộc hỗ trợ: Nên dùng trà Lạc Tiên, trà Tâm Sen, hoặc trà Táo Nhân ấm vào buổi tối để điều hòa giấc ngủ."
          ]
        };
      case "B":
        return {
          title: "Thanh nhiệt & Dịu cơn bốc hỏa",
          description: "Cơn bốc hỏa đột ngột là triệu chứng điển hình của sự suy giảm nội tiết tố Estrogen tự nhiên tuổi trung niên.",
          tips: [
            "Liệu pháp thanh nhiệt tự nhiên: Uống nước sắn dây khuấy chín hoặc trà hoa cúc trắng vào ban ngày để thanh nhiệt, làm mát cơ thể.",
            "Chế độ dinh dưỡng mát: Tăng cường ăn đậu nành, mộc nhĩ trắng, râu ngô. Tuyệt đối hạn chế đồ cay nóng (ớt, tiêu, tỏi) sau 16h chiều.",
            "Mẹo hạ hỏa nhanh: Tập thở chậm bằng bụng (hít vào 4s, thở ra 6s) và dùng khăn mát chườm nhẹ sau gáy khi xuất hiện cơn bốc hỏa."
          ]
        };
      case "C":
        return {
          title: "Thư giãn tinh thần & Giảm căng thẳng",
          description: "Biến động cảm xúc lo âu, dễ cáu gắt là biểu hiện của sự thay đổi nội tiết tố đột ngột, ảnh hưởng trực tiếp đến hệ thần kinh.",
          tips: [
            "Trà thảo mộc thông khí giải tỏa: Trà hoa hồng hoặc trà hoa nhài ấm giúp hành khí, giải tỏa căng thẳng và điều hòa kinh mạch.",
            "Bài tập thở điều hòa khí huyết: Luyện tập thiền hoặc yoga nhẹ nhàng 15-20 phút hàng ngày, chú trọng hơi thở sâu bằng bụng.",
            "Xoa bóp xoa dịu lo âu: Day nhẹ điểm giữa khe ngón chân cái và ngón thứ hai (huyệt Thái Xung) giúp xoa dịu thần kinh."
          ]
        };
      case "D":
        return {
          title: "Cân bằng thể trạng & Điều hòa kinh nguyệt",
          description: "Chu kỳ rối loạn, thất thường báo hiệu sự thay đổi sinh lý tự nhiên của cơ thể khi bước vào giai đoạn cận mãn kinh.",
          tips: [
            "Trà thảo mộc điều hòa kinh nguyệt: Sử dụng trà Ích Mẫu hoặc trà Đương Quy, kết hợp táo đỏ đun ấm uống hàng ngày.",
            "Vận động thông kinh lạc: Tập các tư thế yoga mở hông nhẹ nhàng (tư thế đứa trẻ, tư thế con bướm) để kích thích khí huyết lưu thông vùng chậu.",
            "Giữ ấm cơ thể: Tránh nhiễm lạnh vùng bụng dưới và lòng bàn chân, đặc biệt là trong những ngày chuẩn bị hành kinh."
          ]
        };
      default:
        return {
          title: "Dưỡng sinh & Chăm sóc toàn diện 40+",
          description: stats.loggedDaysCount > 0
            ? "Chúc mừng thể trạng của chị khá ổn định! Hãy duy trì lối sống lành mạnh để bảo vệ sức khỏe và kéo dài tuổi thanh xuân."
            : "Chị chưa ghi chép nhật ký sức khỏe thời gian gần đây. Hãy bắt đầu ghi nhật ký hàng ngày để AI Coach có thể phân tích chính xác và đưa ra lời khuyên phù hợp nhất.",
          tips: [
            "Dinh dưỡng bổ sung: Bổ sung nhiều rau xanh đậm, các loại hạt (hạnh nhân, óc chó) giàu phytoestrogen tự nhiên để bảo vệ xương khớp.",
            "Vận động nhẹ nhàng: Đi bộ nhanh, tập dưỡng sinh hoặc yoga từ 30 phút mỗi ngày giúp duy trì sự dẻo dai và khí huyết thông suốt.",
            "Giữ tinh thần an yên: Duy trì thói quen ghi nhật ký sức khỏe hàng ngày để luôn thấu hiểu và yêu thương bản thân."
          ]
        };
    }
  };

  const advice = getNaturalAdvice(symptomProfile.code);

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

    const message = `BÁO CÁO SỨC KHỎE CÁ NHÂN - TIỀN MÃN KINH
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
Tôi cần tham vấn giải pháp cải thiện thể trạng tuổi 40+.`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(message)
        .then(() => {
          toast.success("Đã tự động gom và sao chép tóm tắt sức khỏe của chị!");
          toast.info("Đang chuyển hướng Zalo... Chị chỉ cần Nhấp chuột phải -> Dán (Paste) để gửi báo cáo cho Chuyên gia.", { duration: 6000 });
          
          setTimeout(() => {
            window.open("https://zalo.me/0982581222", "_blank");
          }, 1500);
        })
        .catch((err) => {
          console.error("Lỗi sao chép: ", err);
          toast.error("Không thể tự động sao chép. Đang mở Zalo tham vấn chuyên gia: 0982581222.");
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
              <span className="flex-1 min-w-0">
                Chào chị, <span className="text-primary">{profile?.displayName || "Thành viên"}</span>
              </span>
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
        <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
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
            <span className={`inline-block text-[9px] sm:text-[10px] md:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mt-1.5 border ${periScoreCat.color}`}>
              {periScoreCat.label}
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Next Period */}
        <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
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
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-2.5 font-semibold truncate">
              {isCurrentlyInPeriod ? "Hãy chăm sóc bản thân" : `Chu kỳ TB: ${averageCycleLength} ngày`}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Avg Sleep */}
        <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
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
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-2.5 font-semibold truncate">
              Chất lượng: <span className="font-bold text-primary">{stats.avgSleepQuality}</span> / 10
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Avg Hot Flashes */}
        <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
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
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-2.5 font-semibold truncate">
              Trong 30 ngày qua
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: PeriScore detail & Medical Disclaimer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PeriScore Detail Card */}
        <Card className="border-border shadow-sm glass-card">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary animate-pulse" /> Chỉ số PeriScore (30 ngày)
            </CardTitle>
            <CardDescription className="text-xs">
              Điểm số phản ánh mức độ ảnh hưởng của các triệu chứng tiền mãn kinh
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-0 space-y-4">
            {/* SVG Circular Progress Ring */}
            <div className="relative flex flex-col items-center justify-center py-4 bg-muted/10 rounded-2xl border border-border/30">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    className="stroke-muted/40"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress Circle with Gradient */}
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    className="stroke-primary"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 - (stats.avgPeriScore / 100) * (2 * Math.PI * 48)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stats.avgPeriScore}</span>
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Trung bình</span>
                </div>
              </div>
              
              <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full mt-3 border ${avgPeriScoreCat.color}`}>
                {avgPeriScoreCat.label}
              </span>
            </div>

            <div className="space-y-2 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-primary" /> Giải thích chỉ số PeriScore
              </p>
              <ul className="list-disc pl-4 space-y-1 font-semibold">
                <li><span className="font-bold text-foreground">0 - 30 (Thấp):</span> Triệu chứng nhẹ, ít ảnh hưởng chất lượng sống.</li>
                <li><span className="font-bold text-foreground">31 - 60 (Trung bình):</span> Bốc hỏa, mất ngủ rõ rệt. Cần điều chỉnh lối sống.</li>
                <li><span className="font-bold text-foreground">61 - 100 (Cao):</span> Các triệu chứng nghiêm trọng. Nên gặp bác sĩ.</li>
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
        <Card className="lg:col-span-2 border-border shadow-sm flex flex-col justify-between glass-card">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary fill-current" /> AI Coach khuyên chị
            </CardTitle>
            <CardDescription className="text-xs">
              Lời khuyên cá nhân hóa dựa trên dữ liệu sức khỏe 7 ngày qua của chị
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-0 space-y-3 flex-1 flex items-center">
            {/* Native-like Coach Suggestion Bubble */}
            <div className="flex items-start gap-4 w-full">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-primary/30 text-primary flex items-center justify-center font-bold shadow-md shrink-0 border border-primary/10">
                <Sparkles className="w-6 h-6 fill-current animate-pulse" />
              </div>
              <div className="flex-1 p-4 bg-muted/30 border border-border/55 rounded-2xl rounded-tl-sm relative shadow-inner">
                <p className="text-xs sm:text-sm leading-relaxed font-bold italic text-foreground">
                  {stats.loggedDaysCount === 0 
                    ? "Chào chị! Hãy ghi nhận nhật ký triệu chứng tối thiểu 1 ngày để tôi có cơ sở phân tích thể trạng và đưa ra các lời khuyên dinh dưỡng, vận động cá nhân hóa dành riêng cho chị."
                    : stats.avgPeriScore > 50 
                      ? "Gần đây chỉ số bốc hỏa và mất ngủ của chị khá cao. Chị nên thử uống một ly trà hoa cúc ấm trước khi ngủ, ngâm chân nước ấm và duy trì phòng ngủ thoáng mát khoảng 22-24°C để giấc ngủ sâu hơn nhé."
                      : "Thể trạng của chị trong 30 ngày qua khá ổn định. Hãy duy trì đi bộ nhẹ nhàng 30 phút mỗi ngày và tăng cường các thực phẩm giàu phytoestrogen như đậu nành, hạt lanh chị nhé."}
                </p>
                {/* Speech Bubble Arrow */}
                <div className="absolute top-4 -left-2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-border/50 border-b-[8px] border-b-transparent"></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 sm:p-6 flex justify-end border-t border-border/20 mt-4">
            <Link href="/chat" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-10 rounded-xl border-border hover:bg-muted text-xs font-black flex items-center justify-center gap-1.5 text-primary active:scale-95 transition-all">
                Trò chuyện với AI Coach <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Grid: Gợi ý cải thiện & Đăng ký Tư vấn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Gợi ý cải thiện tự nhiên (takes 2 cols) */}
        <Card className="lg:col-span-2 border-border shadow-sm glass-card flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-current shrink-0" /> Liệu pháp cải thiện tự nhiên khuyên dùng
              </CardTitle>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto shrink-0 truncate max-w-full">
                {symptomProfile.label}
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
        <Card className="border-primary/20 shadow-md bg-gradient-to-br from-primary/5 via-card to-secondary/15 relative overflow-hidden flex flex-col justify-between glass-card">
          <CardHeader className="p-4 pb-2 sm:p-6 relative z-10">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Tham vấn Chuyên gia Sức khỏe
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed mt-1 font-semibold">
              {stats.loggedDaysCount > 0 
                ? "Chị đã ghi chép sức khỏe đều đặn. Hãy tham vấn chuyên gia sức khỏe để được hỗ trợ thiết lập lộ trình cải thiện thể trạng phù hợp nhất."
                : "Hãy bắt đầu cập nhật nhật ký sức khỏe hàng ngày và tham vấn chuyên gia để thiết lập lộ trình cải thiện thể trạng phù hợp nhất."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 sm:p-6 sm:pt-0 space-y-4 relative z-10 flex-1">
            <div className="p-3 bg-card/90 rounded-2xl border border-border/55 text-[10px] text-muted-foreground space-y-1 font-semibold leading-relaxed">
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
              <Copy className="w-4 h-4" /> Gửi báo cáo & Tham vấn chuyên gia
            </Button>
          </CardFooter>
          {/* Vector hình tròn trang trí nền */}
          <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-primary/5 rounded-full blur-xl"></div>
        </Card>
      </div>

      {/* Section: Analytics Charts (30 days) */}
      <Card className="border-border shadow-sm overflow-hidden glass-card">
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
                  <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                    <div className="h-60 sm:h-64 min-w-[550px] w-full" style={{ minWidth: "550px", minHeight: "240px" }}>
                      <ResponsiveContainer width="99%" height={isMobile ? 240 : 256} minWidth={550}>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorHotFlashes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D96C9D" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#D96C9D" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorInsomnia" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7A4E6D" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#7A4E6D" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1DDE7" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fontWeight: "bold" }} stroke="#7A4E6D" interval={2} />
                          <YAxis domain={[0, 3]} tickCount={4} tick={{ fontSize: 10, fontWeight: "bold" }} stroke="#7A4E6D" />
                          <Tooltip contentStyle={{ borderRadius: "16px", borderColor: "#F1DDE7", fontSize: 11, fontWeight: "bold", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }} />
                          <Legend wrapperStyle={{ fontSize: 11, fontWeight: "bold" }} />
                          <Line type="monotone" dataKey="Bốc hỏa" stroke="#D96C9D" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Mất ngủ" stroke="#7A4E6D" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Đổ mồ hôi đêm" stroke="#ED8EB9" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Sleep vs Mood Correlation */}
                <div className="space-y-2 border-t border-border/30 pt-6">
                  <h4 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">Mối tương quan giữa Giấc ngủ & Cảm xúc</h4>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-normal">So sánh số giờ ngủ thực tế, chất lượng ngủ (1-10) và mức cảm xúc (1: Rất buồn đến 5: Rất tốt)</p>
                  <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                    <div className="h-60 sm:h-64 min-w-[550px] w-full" style={{ minWidth: "550px", minHeight: "240px" }}>
                      <ResponsiveContainer width="99%" height={isMobile ? 240 : 256} minWidth={550}>
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1DDE7" />
                          <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fontWeight: "bold" }} stroke="#7A4E6D" interval={2} />
                          <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 10, fontWeight: "bold" }} stroke="#7A4E6D" />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 10, fontWeight: "bold" }} stroke="#7A4E6D" />
                          <Tooltip contentStyle={{ borderRadius: "16px", borderColor: "#F1DDE7", fontSize: 11, fontWeight: "bold", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }} />
                          <Legend wrapperStyle={{ fontSize: 11, fontWeight: "bold" }} />
                          <Bar yAxisId="left" dataKey="Thời gian ngủ (giờ)" fill="#F8D7E6" radius={[6, 6, 0, 0]} barSize={16} />
                          <Line yAxisId="left" type="monotone" dataKey="Chất lượng ngủ" stroke="#B05581" strokeWidth={2.5} dot={{ r: 2 }} />
                          <Line yAxisId="right" type="monotone" dataKey="Tâm trạng" stroke="#D96C9D" strokeWidth={2.5} dot={{ r: 3 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
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
