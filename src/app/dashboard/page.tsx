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
  const [greeting, setGreeting] = useState({
    label: "Ngày mới an yên",
    title: "Chào buổi sáng",
    desc: "Hôm nay là ngày tuyệt vời để yêu thương và chăm sóc bản thân. Chúc chị một ngày bình yên và tràn đầy năng lượng!"
  });

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

  // Tính toán lời chào động theo thời gian thực tế
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) {
      setGreeting({
        label: "Ngày mới an yên",
        title: "Chào buổi sáng",
        desc: "Hôm nay là ngày tuyệt vời để yêu thương và chăm sóc bản thân. Chúc chị một ngày bình yên và tràn đầy năng lượng!"
      });
    } else if (hours >= 12 && hours < 18) {
      setGreeting({
        label: "Chiều an yên",
        title: "Chào buổi chiều",
        desc: "Hãy dành vài phút nghỉ ngơi và uống một ly nước ấm chị nhé. Chúc chị một buổi chiều bình yên và tràn đầy năng lượng!"
      });
    } else if (hours >= 18 && hours < 22) {
      setGreeting({
        label: "Tối bình yên",
        title: "Chào buổi tối",
        desc: "Sau một ngày dài bận rộn, giờ là lúc chị dành thời gian thư giãn và yêu thương bản thân. Chúc chị một buổi tối an lành!"
      });
    } else {
      setGreeting({
        label: "Chúc ngủ ngon",
        title: "Chúc chị ngủ ngon",
        desc: "Hãy khép lại ngày hôm nay và thả lỏng tâm trí. Chúc chị có một giấc ngủ thật ngon và sâu giấc!"
      });
    }
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

    const message = `📋 BÁO CÁO SỨC KHỎE CÁ NHÂN (TIỀN MÃN KINH)
═════════════════════════════════
👤 THÔNG TIN CỦA TÔI:
- Họ và tên: ${name} (${age} tuổi)
- Chiều cao / Cân nặng: ${profile?.height || "--"} cm / ${profile?.weight || "--"} kg
- Chỉ số BMI: ${bmiVal} (${bmiCategory})

🩺 CHỈ SỐ SỨC KHỎE GẦN NHẤT:
- Chỉ số PeriScore hôm nay: ${currentPeriScore}/100 (${periScoreCat.label})
- Chu kỳ kinh nguyệt trung bình: ${averageCycleLength} ngày (Hành kinh TB: ${averagePeriodDuration} ngày)
- Ghi chú sức khỏe gần nhất: "${lastLogNote || "Không có ghi chú"}"

📊 TÓM TẮT TRIỆU CHỨNG 30 NGÀY QUA (Ghi chép ${loggedDaysCount} ngày):
- Số ngày mất ngủ nặng: ${severeInsomniaDays} ngày
- Số ngày bốc hỏa/đổ mồ hôi đêm nặng: ${severeHotFlashDays} ngày
- Số ngày lo âu/căng thẳng nặng: ${severeAnxietyDays} ngày
═════════════════════════════════
💬 Tôi cần tham vấn giải pháp cải thiện thể trạng tuổi 40+.`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(message)
        .then(() => {
          toast.success("Đã tự động sao chép báo cáo sức khỏe!", {
            description: "Chị hãy chạm giữ vào ô nhập tin nhắn trong Zalo và chọn \"Dán\" (hoặc nhấn Ctrl+V / chuột phải chọn Dán) để gửi báo cáo.",
            duration: 8000,
          });
          
          setTimeout(() => {
            window.open("https://zalo.me/0982581222", "_blank");
          }, 2000);
        })
        .catch((err) => {
          console.error("Lỗi sao chép: ", err);
          toast.error("Không thể tự động sao chép.", {
            description: "Đang chuyển hướng Zalo tham vấn chuyên gia: 0982581222.",
          });
          setTimeout(() => {
            window.open("https://zalo.me/0982581222", "_blank");
          }, 1500);
        });
    } else {
      window.open("https://zalo.me/0982581222", "_blank");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      
      {/* 1. GREETING CARD (Chào buổi sáng) */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-[28px] bg-gradient-to-r from-secondary/40 via-secondary/25 to-background border border-border/60 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 transition-all duration-300">
        <div className="space-y-1.5 relative z-10 text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 fill-current" />
            <span>{greeting.label}</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-foreground">
            {greeting.title}, <span className="text-primary">{profile?.displayName || "Lan"}</span>!
          </h1>
          <p className="text-[11px] sm:text-sm text-muted-foreground font-semibold leading-relaxed max-w-md mt-1">
            {greeting.desc}
          </p>
        </div>

        {/* Hình minh họa SVG người phụ nữ ôm lấy mình đầy ấm áp */}
        <div className="hidden md:flex shrink-0 relative w-32 h-32 md:w-36 md:h-36 items-center justify-center pointer-events-none select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary/80 fill-current animate-in fade-in zoom-in-50 duration-500">
            {/* Vòng nền phát sáng mờ */}
            <circle cx="50" cy="55" r="30" className="text-secondary/50 fill-current" />
            <path d="M50 35c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zm0 4c-9.39 0-28 4.79-28 14v12h56V53c0-9.21-18.61-14-28-14z" opacity="0.15" />
            {/* Vẽ đường nét cô gái tối giản */}
            <path d="M50,22 C53.5,22 56.5,25 56.5,28.5 C56.5,32 53.5,35 50,35 C46.5,35 43.5,32 43.5,28.5 C43.5,25 46.5,22 50,22 Z" className="text-primary fill-current" />
            {/* Body & Tay ôm vai */}
            <path d="M50,38 C42,38 30,42.5 30,51 L30,75 L70,75 L70,51 C70,42.5 58,38 50,38 Z M62,49 C60,49 53,53 50,56 C47,53 40,49 38,49 C35,49 33,51 35,54 C38,58 45,64 50,66 C55,64 62,58 65,54 C67,51 65,49 62,49 Z" className="text-primary/70 fill-current" />
            {/* Trái tim đỏ nhỏ bay lên */}
            <path d="M18,35 C18,33.5 19.5,32 21,32 C22.5,32 24,33.5 24,35 C24,37.5 21,40 21,40 C21,40 18,37.5 18,35 Z M82,45 C82,43.5 83.5,42 85,42 C86.5,42 88,43.5 88,45 C88,47.5 85,50 85,50 C85,50 82,47.5 82,45 Z" className="text-rose-400 fill-current" />
          </svg>
        </div>
      </div>

      {/* 2. PERISCORE SECTION (Khối lớn PeriScore ở giữa) */}
      <Card className="border-border shadow-sm overflow-hidden glass-card p-4 sm:p-6 rounded-2xl sm:rounded-[28px] relative transition-all duration-300">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">PeriScore của bạn</h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">Chỉ số sức khỏe tiền mãn kinh hôm nay</p>
        </div>

        <div className="flex flex-row flex-wrap md:flex-nowrap items-center justify-center md:justify-around gap-3 md:gap-8 w-full">
          {/* Cột trái: So sánh cải thiện (Hiển thị bên trái trên PC, bên trái dưới vòng tròn trên Mobile) */}
          <div className="order-2 md:order-1 flex items-center gap-2.5 bg-muted/30 border border-border/40 p-2.5 sm:p-4 px-3 sm:px-5 rounded-2xl w-[calc(50%-6px)] md:w-auto md:max-w-xs transition-colors hover:bg-muted/50">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs sm:text-sm font-black text-primary truncate">Cải thiện +12đ</span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold truncate">so với tuần trước</span>
            </div>
          </div>

          {/* Cột giữa: Vòng tròn điểm số chính (Trên cùng trên Mobile, giữa trên PC) */}
          <div className="order-1 md:order-2 w-full md:w-auto flex justify-center mb-3 md:mb-0">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center animate-in zoom-in-75 duration-500 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className="stroke-muted/40 dark:stroke-muted/10"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className="stroke-primary"
                  strokeWidth="8.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 64}
                  strokeDashoffset={2 * Math.PI * 64 - (currentPeriScore / 100) * (2 * Math.PI * 64)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-none">{currentPeriScore}</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 sm:mt-1">/100</span>
                <span className={`text-[8px] sm:text-[10px] font-extrabold mt-1 sm:mt-1.5 px-2 py-0.5 rounded-full border leading-none ${periScoreCat.color}`}>
                  {periScoreCat.label}
                </span>
              </div>
            </div>
          </div>

          {/* Cột phải: So sánh cộng đồng (Bên phải trên PC, bên phải dưới vòng tròn trên Mobile) */}
          <div className="order-3 flex items-center gap-2.5 bg-muted/30 border border-border/40 p-2.5 sm:p-4 px-3 sm:px-5 rounded-2xl w-[calc(50%-6px)] md:w-auto md:max-w-xs transition-colors hover:bg-muted/50">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-xs sm:text-sm font-black text-foreground leading-tight truncate">Tốt hơn 72%</span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold truncate">người cùng độ tuổi</span>
            </div>
          </div>
        </div>

        {/* Khung nhận xét & Điều hướng */}
        <Link href="/report" className="block mt-4 md:mt-6 group">
          <div className="flex items-center justify-between p-2.5 md:p-3.5 px-4 md:px-5 rounded-2xl bg-primary/5 hover:bg-primary/10 border border-dashed border-primary/20 hover:border-primary/40 transition-all duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current animate-pulse" />
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-foreground truncate max-w-lg">
                Sức khỏe của bạn đang ở mức tốt! Hãy duy trì lối sống lành mạnh để cải thiện hơn nữa.
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </Card>

      {/* 3. CÁC CHỈ SỐ NỔI BẬT */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5 text-primary" /> Các chỉ số nổi bật
          </h2>
          <Link href="/tracker" className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
            Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Bốc hỏa */}
          <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Bốc hỏa</span>
                <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-foreground">
                    {stats.loggedDaysCount > 0 ? (parseFloat(stats.avgHotFlashes) * 7).toFixed(0) : "0"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">lần/tuần</span>
                </div>
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-2 border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-600">
                  Giảm 20%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Giấc ngủ */}
          <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Giấc ngủ</span>
                <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-foreground">{stats.avgSleep}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">giờ/đêm</span>
                </div>
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-2 border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
                  Tốt
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Tâm trạng */}
          <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Tâm trạng</span>
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Smile className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-foreground">
                    {stats.avgSleepQuality !== "0.0" ? Math.round(parseFloat(stats.avgSleepQuality) / 2) : "4"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">/5</span>
                </div>
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-2 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-600">
                  Ổn định
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Chu kỳ */}
          <Card className="border-border shadow-sm overflow-hidden glass-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Chu kỳ</span>
                <span className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-foreground">
                    {averageCycleLength !== 0 ? averageCycleLength : "28"}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">ngày</span>
                </div>
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-2 border border-pink-200 bg-pink-50 dark:bg-pink-950/20 text-pink-600">
                  Đều đặn
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. NHẬT KÝ HÔM NAY (Daily Log Quick Buttons) */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-extrabold text-foreground px-1 flex items-center gap-1.5">
          <Heart className="w-4.5 h-4.5 text-primary fill-current" /> Nhật ký hôm nay
        </h2>
        
        <div className="grid grid-cols-4 gap-2.5">
          {/* Triệu chứng */}
          <Link href="/log?tab=symptoms" className="flex flex-col items-center justify-center bg-card hover:bg-muted/40 border border-border/70 p-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group">
            <div className="w-11 h-11 rounded-full bg-secondary/80 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 100 100" className="w-6.5 h-6.5 fill-current">
                {/* Hình hoa sen tím */}
                <path d="M50 80c-5.52 0-10-4.48-10-10 0-8.8 10-25 10-25s10 16.2 10 25c0 5.52-4.48 10-10 10zm-15-5c0-15 15-35 15-35s15 20 15 35c0 8.28-6.72 15-15 15s-15-6.72-15-15z" opacity="0.3" />
                <path d="M50 15 C50 15 30 45 30 65 C30 76 39 85 50 85 C61 85 70 76 70 65 C70 45 50 15 50 15 Z M50 78 C42.8 78 37 72.2 37 65 C37 53.7 47.3 32.3 50 26.6 C52.7 32.3 63 53.7 63 65 C63 72.2 57.2 78 50 78 Z" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground group-hover:text-foreground mt-2 text-center transition-colors">Triệu chứng</span>
          </Link>

          {/* Giấc ngủ */}
          <Link href="/log?tab=sleep" className="flex flex-col items-center justify-center bg-card hover:bg-muted/40 border border-border/70 p-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group">
            <div className="w-11 h-11 rounded-full bg-secondary/80 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 100 100" className="w-6.5 h-6.5 fill-current">
                {/* Trăng khuyết và sao */}
                <path d="M60 20 A35 35 0 1 0 85 65 A30 30 0 1 1 60 20 Z" />
                <path d="M25 25 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l 3.5 -1.5 Z" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground group-hover:text-foreground mt-2 text-center transition-colors">Giấc ngủ</span>
          </Link>

          {/* Tâm trạng */}
          <Link href="/log?tab=mood" className="flex flex-col items-center justify-center bg-card hover:bg-muted/40 border border-border/70 p-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group">
            <div className="w-11 h-11 rounded-full bg-secondary/80 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 100 100" className="w-6.5 h-6.5 fill-current">
                {/* Mặt cười hạnh phúc */}
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none" />
                <circle cx="35" cy="40" r="5" />
                <circle cx="65" cy="40" r="5" />
                <path d="M30 60 Q50 80 70 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground group-hover:text-foreground mt-2 text-center transition-colors">Tâm trạng</span>
          </Link>

          {/* Ghi chú */}
          <Link href="/log?tab=mood" className="flex flex-col items-center justify-center bg-card hover:bg-muted/40 border border-border/70 p-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 group">
            <div className="w-11 h-11 rounded-full bg-secondary/80 text-primary flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 100 100" className="w-6.5 h-6.5 fill-current">
                {/* Tờ giấy ghi chú */}
                <rect x="25" y="15" width="50" height="70" rx="8" stroke="currentColor" strokeWidth="6" fill="none" />
                <line x1="38" y1="35" x2="62" y2="35" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <line x1="38" y1="50" x2="62" y2="50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                <line x1="38" y1="65" x2="52" y2="65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground group-hover:text-foreground mt-2 text-center transition-colors">Ghi chú</span>
          </Link>
        </div>
      </div>

      {/* 5. AI COACH ADVICE */}
      <Card className="border-border shadow-sm glass-card p-5 rounded-[28px] space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary fill-current shrink-0" />
          <h2 className="text-sm sm:text-base font-extrabold text-foreground">AI Coach khuyên chị</h2>
        </div>
        
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-secondary to-primary/30 text-primary flex items-center justify-center font-bold shadow-md shrink-0 border border-primary/10">
            <Sparkles className="w-5.5 h-5.5 fill-current animate-pulse" />
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

        <div className="flex justify-end border-t border-border/20 pt-3">
          <Link href="/chat">
            <Button variant="outline" className="h-9 px-4.5 rounded-xl border-border hover:bg-muted text-xs font-black flex items-center justify-center gap-1 text-primary active:scale-95 transition-all">
              Trò chuyện với AI Coach <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* 6. DƯỠNG SINH KHUYÊN DÙNG */}
      <Card className="border-border shadow-sm glass-card p-5 rounded-[28px] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-current shrink-0" /> Liệu pháp cải thiện tự nhiên khuyên dùng
          </h2>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto shrink-0 truncate max-w-full">
            {symptomProfile.label}
          </span>
        </div>
        
        <p className="text-xs sm:text-sm leading-relaxed font-semibold text-muted-foreground">
          {advice.description}
        </p>

        <div className="space-y-3 border-t border-border/40 pt-4">
          <p className="font-bold text-foreground text-[10px] sm:text-[11px] uppercase tracking-wider">
            Các phương pháp chăm sóc kiến nghị:
          </p>
          <ul className="space-y-3">
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
      </Card>

      {/* 7. ZALO CONSULTATION & ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Zalo consultation Card */}
        <Card className="border-primary/20 shadow-md bg-gradient-to-br from-primary/5 via-card to-secondary/15 relative overflow-hidden flex flex-col justify-between glass-card p-5 rounded-[28px] lg:col-span-1 min-h-[220px]">
          <div className="space-y-2 relative z-10">
            <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
              <MessageCircle className="w-5 h-5 text-primary" /> Tham vấn Chuyên gia
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground font-semibold">
              {stats.loggedDaysCount > 0 
                ? "Chị đã ghi chép sức khỏe đều đặn. Hãy gửi báo cáo y khoa trực tiếp qua Zalo để chuyên gia tư vấn lộ trình phù hợp."
                : "Hãy bắt đầu cập nhật nhật ký sức khỏe hàng ngày và tham vấn chuyên gia để thiết lập lộ trình cải thiện thể trạng phù hợp nhất."}
            </p>
          </div>
          <div className="mt-4 relative z-10">
            <Button 
              onClick={handleZaloConsult}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:bg-primary/95 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-98 transition-transform"
            >
              <Copy className="w-4 h-4" /> Gửi báo cáo & Tư vấn Zalo
            </Button>
          </div>
          {/* Vector hình tròn trang trí nền */}
          <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-primary/5 rounded-full blur-xl"></div>
        </Card>

        {/* Analytics Charts Summary */}
        <Card className="border-border shadow-sm overflow-hidden glass-card p-5 rounded-[28px] lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-primary" /> Phân tích sức khỏe (30 ngày)
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">Tự động vẽ biểu đồ trực quan hóa xu hướng các triệu chứng bốc hỏa, ngủ nghỉ và cảm xúc.</p>
          </div>
          <div className="mt-4 border-t border-border/40 pt-3 flex justify-end">
            <a href="#charts-detail" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-10 rounded-xl border-border hover:bg-muted text-xs font-black flex items-center justify-center gap-1 text-primary active:scale-95 transition-all">
                Cuộn xuống xem biểu đồ xu hướng <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </Card>
      </div>

      {/* 8. BIỂU ĐỒ CHI TIẾT */}
      <Card id="charts-detail" className="border-border shadow-sm overflow-hidden glass-card p-5 rounded-[28px]">
        <div className="space-y-1 mb-4">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
            <TrendingUp className="w-5 h-5 text-primary" /> Xu hướng & Phân tích sức khỏe
          </h3>
          <p className="text-[11px] text-muted-foreground font-semibold">Theo dõi chi tiết sự biến thiên của triệu chứng theo thời gian.</p>
        </div>
        
        <div className="border-t border-border/40 pt-4">
          {stats.loggedDaysCount === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm font-semibold">
              Chưa có đủ dữ liệu ghi chép nhật ký 30 ngày qua để vẽ biểu đồ xu hướng.
            </div>
          ) : (
            isMounted && (
              <div className="space-y-8">
                {/* Chart 1: Triệu chứng Hot Flashes vs Insomnia */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Xu hướng Bốc hỏa & Mất ngủ</h4>
                  <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                    <div className="h-60 sm:h-64 min-w-[550px] w-full" style={{ minWidth: "550px", minHeight: "240px" }}>
                      <ResponsiveContainer width="99%" height={isMobile ? 240 : 256} minWidth={550}>
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">Mối tương quan giữa Giấc ngủ & Cảm xúc</h4>
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
        </div>
      </Card>

      {/* 9. DAILY TIP (Mẹo nhỏ cho bạn) */}
      <div className="relative overflow-hidden rounded-[24px] bg-secondary/20 border border-secondary/50 p-4.5 flex items-center justify-between gap-4 transition-all duration-300 hover:bg-secondary/35">
        <div className="space-y-1 relative z-10 flex-1">
          <h4 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
            💡 Mẹo nhỏ cho bạn
          </h4>
          <p className="text-xs sm:text-sm text-foreground font-bold leading-normal">
            Uống một cốc trà thảo mộc ấm (như trà hoa cúc, táo đỏ) trước khi đi ngủ 30 phút giúp cải thiện giấc ngủ và làm dịu cơn bốc hỏa ban đêm.
          </p>
        </div>

        {/* Tách trà bốc khói vẽ bằng SVG */}
        <div className="shrink-0 relative w-12 h-12 flex items-center justify-center pointer-events-none select-none text-primary">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="6" strokeLinecap="round">
            {/* Khói bốc lên */}
            <path d="M40 30 Q45 20 40 10" strokeDasharray="3 3" />
            <path d="M50 30 Q55 15 50 10" strokeDasharray="3 3" />
            <path d="M60 30 Q65 20 60 10" strokeDasharray="3 3" />
            {/* Tách trà */}
            <path d="M25 40 L75 40 A25 25 0 0 1 50 85 A25 25 0 0 1 25 40 Z" fill="currentColor" opacity="0.15" />
            <path d="M25 40 L75 40 A25 25 0 0 1 50 85 A25 25 0 0 1 25 40 Z" />
            {/* Quai cầm */}
            <path d="M75 50 Q85 50 85 60 Q85 70 75 70" />
            {/* Đĩa lót */}
            <path d="M15 85 L85 85" strokeWidth="8" />
          </svg>
        </div>
      </div>

    </div>
  );
}
