"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/use-user-store";
import { useLogStore } from "@/store/use-log-store";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useCycles } from "@/hooks/use-cycles";
import { Button } from "@/components/ui/button";
import { 
  Printer, ArrowLeft, Heart, Sparkles, 
  ShieldAlert, Activity, Calendar, Loader2,
  Copy, MessageCircle
} from "lucide-react";
import { format, subMonths, parseISO, isAfter } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rangeMonths = parseInt(searchParams.get("range") || "3");

  const { profile } = useUserStore();
  const { dailyLogs } = useLogStore();
  const { getPeriScoreCategory } = useDailyLog();
  const { averageCycleLength, averagePeriodDuration, sortedCycles } = useCycles();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!profile) return null;

  // Lọc logs theo khoảng thời gian được chọn
  const startDateLimit = subMonths(new Date(), rangeMonths);

  const filteredLogs = Object.values(dailyLogs).filter((log) => {
    const logDate = parseISO(log.date);
    return isAfter(logDate, startDateLimit);
  });

  // Tính toán các chỉ số trung bình trong khoảng thời gian lọc
  const totalDays = filteredLogs.length;
  let totalPeriScore = 0;
  let totalSleepDuration = 0;
  let totalSleepQuality = 0;
  let totalHotFlashes = 0;
  let totalInsomnia = 0;
  let totalAnxiety = 0;

  // Đếm số ngày bị triệu chứng nặng (mức 2, 3)
  let severeHotFlashesCount = 0;
  let severeInsomniaCount = 0;

  filteredLogs.forEach((log) => {
    totalPeriScore += log.periScore;
    totalSleepDuration += log.sleep?.totalDuration || 0;
    totalSleepQuality += log.sleep?.quality || 0;
    totalHotFlashes += log.symptoms?.hotFlashes || 0;
    totalInsomnia += log.symptoms?.insomnia || 0;
    totalAnxiety += log.symptoms?.anxiety || 0;

    if ((log.symptoms?.hotFlashes || 0) >= 2) severeHotFlashesCount++;
    if ((log.symptoms?.insomnia || 0) >= 2) severeInsomniaCount++;
  });

  const avgPeriScore = totalDays > 0 ? Math.round(totalPeriScore / totalDays) : 0;
  const avgSleep = totalDays > 0 ? (totalSleepDuration / totalDays / 60).toFixed(1) : "0.0";
  const avgSleepQuality = totalDays > 0 ? (totalSleepQuality / totalDays).toFixed(1) : "0.0";
  const avgHotFlashes = totalDays > 0 ? (totalHotFlashes / totalDays).toFixed(1) : "0.0";
  const avgInsomnia = totalDays > 0 ? (totalInsomnia / totalDays).toFixed(1) : "0.0";
  const avgAnxiety = totalDays > 0 ? (totalAnxiety / totalDays).toFixed(1) : "0.0";

  const periScoreCat = getPeriScoreCategory(avgPeriScore);

  // Lấy danh sách chu kỳ trong khoảng thời gian lọc
  const filteredCycles = sortedCycles.filter((c) => {
    const cycleDate = parseISO(c.startDate);
    return isAfter(cycleDate, startDateLimit);
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleZaloConsult = () => {
    const name = profile?.displayName || "Thành viên";
    const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : "--";
    const bmiVal = profile?.bmi || "--";
    const bmiCategory = bmiVal !== "--" 
      ? (bmiVal < 18.5 ? "Gầy" : bmiVal < 25 ? "Bình thường" : bmiVal < 30 ? "Thừa cân" : "Béo phì")
      : "Chưa cập nhật";
    
    // Tìm ghi chú gần nhất trong filteredLogs
    let lastLogNote = "";
    const sortedFilteredLogs = [...filteredLogs].sort((a, b) => b.date.localeCompare(a.date));
    for (const log of sortedFilteredLogs) {
      if (log.mood?.note) {
        lastLogNote = log.mood.note;
        break;
      }
    }

    const message = `📋 BÁO CÁO SỨC KHỎE CHI TIẾT (${rangeMonths} THÁNG QUA)
═════════════════════════════════
👤 THÔNG TIN CỦA TÔI:
- Họ và tên: ${name} (${age} tuổi)
- Chiều cao / Cân nặng: ${profile?.height || "--"} cm / ${profile?.weight || "--"} kg
- Chỉ số BMI: ${bmiVal} (${bmiCategory})

🩺 CHỈ SỐ SỨC KHỎE TRUNG BÌNH:
- Điểm PeriScore trung bình: ${avgPeriScore}/100 (${periScoreCat.label})
- Chu kỳ kinh nguyệt trung bình: ${averageCycleLength} ngày (Hành kinh TB: ${averagePeriodDuration} ngày)
- Số chu kỳ đã ghi nhận: ${filteredCycles.length} (Chu kỳ bất thường: ${filteredCycles.filter((c) => c.isAbnormal).length})
- Ghi chú sức khỏe gần nhất: "${lastLogNote || "Không có ghi chú"}"

📊 TÓM TẮT TRIỆU CHỨNG ${rangeMonths} THÁNG QUA (Ghi chép ${totalDays} ngày):
- Số ngày mất ngủ nặng (mức 2, 3): ${severeInsomniaCount} ngày
- Số ngày bốc hỏa nặng (mức 2, 3): ${severeHotFlashesCount} ngày
- Cường độ bốc hỏa trung bình: ${avgHotFlashes} / 3.0
- Cường độ mất ngủ trung bình: ${avgInsomnia} / 3.0
- Mức độ lo âu trung bình: ${avgAnxiety} / 3.0
- Thời gian ngủ trung bình: ${avgSleep} giờ / đêm
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

  // Trích xuất dữ liệu vẽ biểu đồ Sparklines động dựa trên logs thực tế
  const getSparklineData = (key: "hotFlashes" | "insomnia" | "sleepQuality" | "mood" | "cycle") => {
    const last7Logs = [...filteredLogs].slice(0, 7).reverse();
    if (last7Logs.length < 2) {
      // Dữ liệu mặc định nếu người dùng chưa ghi chép nhiều
      return "M 10 25 Q 30 15 50 25 T 90 25";
    }
    
    let points = "";
    last7Logs.forEach((log, idx) => {
      const x = 10 + (idx * 80) / (last7Logs.length - 1);
      let val = 0;
      let maxVal = 3;
      
      if (key === "hotFlashes") {
        val = log.symptoms?.hotFlashes || 0;
        maxVal = 3;
      } else if (key === "insomnia") {
        val = log.symptoms?.insomnia || 0;
        maxVal = 3;
      } else if (key === "sleepQuality") {
        val = log.sleep?.quality || 5;
        maxVal = 10;
      } else if (key === "mood") {
        const moodMap = { "very-good": 5, "good": 4, "neutral": 3, "bad": 2, "very-bad": 1 };
        val = moodMap[log.mood?.level as keyof typeof moodMap] || 3;
        maxVal = 5;
      } else {
        val = log.periScore || 0;
        maxVal = 100;
      }
      
      const y = 32 - (val / maxVal) * 24; // Chiều cao hộp là 35px, biên từ Y=8 đến Y=32
      points += `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    });
    return points;
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground p-0 sm:p-4 w-full max-w-4xl mx-auto print:bg-white print:text-black print:p-0 print:max-w-full page-transition">
      {/* Top action bar - Hidden when print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4 mb-6 print:hidden">
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          className="h-10 px-4 rounded-xl border-border text-muted-foreground hover:text-foreground w-full sm:w-auto active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            onClick={handleZaloConsult}
            variant="outline"
            className="h-10 px-4 rounded-xl border-primary text-primary hover:bg-primary/5 font-semibold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm flex-1 sm:flex-none justify-center active:scale-95 transition-transform"
          >
            <MessageCircle className="w-4 h-4" /> Gửi Zalo tham vấn
          </Button>
          <Button 
            onClick={handlePrint}
            className="h-10 px-4 sm:px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-semibold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm flex-1 sm:flex-none justify-center active:scale-95 transition-transform"
          >
            <Printer className="w-4 h-4" /> Tải PDF / In báo cáo
          </Button>
        </div>
      </div>

      {/* REPORT PAGE CONTAINER - Glassmorphism on web, plain A4 white on print */}
      <div className="glass-card border border-border/80 p-5 sm:p-8 rounded-[32px] shadow-md print:bg-white print:text-black print:border-0 print:p-0 print:shadow-none w-full">
        
        {/* Header Báo cáo */}
        <div className="flex flex-row justify-between items-start border-b-2 border-primary/45 print:border-black pb-5 mb-5">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-primary font-bold text-base select-none">
              <Heart className="w-5 h-5 fill-current text-primary" />
              <span className="font-extrabold text-sm tracking-tight text-foreground print:text-black">Tiền Mãn Kinh</span>
            </div>
            <p className="text-[9px] text-muted-foreground print:text-gray-500 font-semibold leading-none">
              Đồng hành cùng sức khỏe và sự an tâm của phụ nữ trung niên
            </p>
          </div>
          <div className="text-right text-[10px] text-muted-foreground print:text-gray-500 font-semibold space-y-0.5 shrink-0">
            <p className="bg-primary/10 text-primary print:bg-transparent print:text-black px-2 py-0.5 rounded-md font-bold text-[9px] inline-block mb-1.5">Ngày xuất: {format(new Date(), "dd/MM/yyyy")}</p>
            <p>Mã hồ sơ: #{profile.uid.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Tiêu đề chính */}
        <div className="text-center mb-6">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground print:text-black">
            BÁO CÁO SỨC KHỎE CÁ NHÂN
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground print:text-gray-500 font-semibold mt-1">
            Chu kỳ báo cáo: {rangeMonths} tháng gần nhất (Từ {format(startDateLimit, "dd/MM/yyyy")} đến nay)
          </p>
        </div>

        {/* 1. THÔNG TIN CÁ NHÂN (Mockup 5 layout) */}
        <div className="bg-muted/40 border border-border/60 rounded-2xl p-4.5 mb-6 flex flex-col sm:flex-row items-center gap-5 text-xs print:bg-gray-50 print:border-gray-300 print:text-black">
          {/* Avatar vẽ cô Lan bằng SVG */}
          <div className="w-16 h-16 rounded-full bg-secondary/80 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-inner overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-primary">
              <circle cx="50" cy="50" r="50" className="text-secondary/70 fill-current" />
              <circle cx="50" cy="35" r="16" />
              <path d="M50,55 C35,55 25,65 25,75 L75,75 C75,65 65,55 50,55 Z" />
              {/* Tóc ngắn cô Lan */}
              <path d="M34,35 Q34,16 50,16 Q66,16 66,35 Q66,42 62,42 Q58,30 50,30 Q42,30 38,42 Q34,42 34,35 Z" className="text-primary/95" />
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3.5 flex-1 w-full text-left font-bold">
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Họ và tên</span>
              <span className="text-foreground print:text-black">{profile.displayName}</span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Năm sinh / Tuổi</span>
              <span className="text-foreground print:text-black">
                {profile.birthYear || "1976"} ({new Date().getFullYear() - (profile.birthYear || 1975)} tuổi)
              </span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Chiều cao / Cân nặng</span>
              <span className="text-foreground print:text-black">{profile.height || "158"} cm / {profile.weight || "55"} kg</span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Chỉ số BMI</span>
              <span className="text-foreground print:text-black">
                {profile.bmi || "22.0"} ({profile.bmi && profile.bmi < 18.5 ? "Gầy" : profile.bmi && profile.bmi < 25 ? "Bình thường" : "Thừa cân"})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Tuổi bắt đầu có kinh</span>
              <span className="text-foreground print:text-black">{profile.birthYear ? "13 tuổi" : "--"}</span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Số con</span>
              <span className="text-foreground print:text-black">2 con</span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Nhóm máu</span>
              <span className="text-foreground print:text-black">O</span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-gray-500 block text-[9px] uppercase tracking-wider font-extrabold mb-0.5">Ghi chú bệnh lý</span>
              <span className="text-foreground print:text-black">Không</span>
            </div>
          </div>
        </div>

        {/* 2. CHỈ SỐ TIỀN MÂN KINH (PeriScore) */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-6 print:bg-white print:border-gray-300 text-left">
          {/* Vòng tròn PeriScore */}
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="44" className="stroke-muted/40 dark:stroke-muted/10" strokeWidth="6.5" fill="transparent" />
              <circle
                cx="56"
                cy="56"
                r="44"
                className="stroke-primary"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 - (avgPeriScore / 100) * (2 * Math.PI * 44)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-primary leading-none">{avgPeriScore}</span>
              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">/100</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 w-full">
            <div>
              <span className="text-muted-foreground print:text-gray-500 text-[10px] font-extrabold uppercase tracking-wider block mb-1">Đánh giá chung</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-foreground">Mức độ:</span>
                <span className={`inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border ${periScoreCat.color}`}>
                  {periScoreCat.label.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold mt-1">
                {avgPeriScore > 60 
                  ? "Chị ghi nhận nhiều dấu hiệu tiền mãn kinh ở mức độ cao. Hãy duy trì lối sống lành mạnh và mang báo cáo này thảo luận thêm với bác sĩ phụ khoa."
                  : avgPeriScore > 30 
                    ? "Thể trạng ghi nhận các triệu chứng ở mức trung bình. Chị nên tập trung cải thiện chất lượng giấc ngủ và chế độ dinh dưỡng dưỡng sinh tự nhiên."
                    : "Sức khỏe tiền mãn kinh của chị rất tốt. Các triệu chứng nhẹ nhàng và ít ảnh hưởng đến đời sống hàng ngày."}
              </p>
            </div>

            {/* Thanh đo mức độ 3 mốc (Mockup 5) */}
            <div className="space-y-1.5 pt-1">
              <div className="relative w-full h-2 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-rose-500">
                {/* Chấm chỉ vị trí điểm số */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary shadow-sm"
                  style={{ left: `${Math.min(96, Math.max(2, avgPeriScore))}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-black text-muted-foreground print:text-gray-500 uppercase select-none">
                <span>0-30 Thấp</span>
                <span>31-60 Trung bình</span>
                <span>61-100 Cao</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TỔNG QUAN SỨC KHỎE (Grid 3x2 Sparklines chuẩn mockup 5) */}
        <div className="space-y-3.5 mb-6 text-left">
          <h3 className="font-extrabold text-xs sm:text-sm text-foreground print:text-black flex items-center gap-1.5 border-b border-border/40 print:border-gray-300 pb-2">
            <Activity className="w-4.5 h-4.5 text-primary" /> Tổng quan sức khỏe
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
            {/* Chu kỳ */}
            <div className="border border-border/70 rounded-2xl p-4 bg-muted/15 flex flex-col justify-between min-h-[95px] print:border-gray-300">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Chu kỳ kinh nguyệt</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 leading-none">
                  {filteredCycles.filter((c) => c.isAbnormal).length > 0 ? "Bất thường" : "Đều đặn"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-sm font-black text-foreground">{averageCycleLength || "28"} ngày</span>
                  <p className="text-[9px] text-muted-foreground font-semibold leading-none">Trung bình</p>
                </div>
                {/* Sparkline vẽ bằng SVG */}
                <svg className="w-16 h-8 text-primary shrink-0 select-none pointer-events-none" viewBox="0 0 100 35">
                  <path d={getSparklineData("cycle")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Bốc hỏa */}
            <div className="border border-border/70 rounded-2xl p-4 bg-muted/15 flex flex-col justify-between min-h-[95px] print:border-gray-300">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Bốc hỏa</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 leading-none">
                  {parseFloat(avgHotFlashes) >= 2.0 ? "Nặng" : parseFloat(avgHotFlashes) >= 1.0 ? "Trung bình" : "Nhẹ"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-sm font-black text-foreground">{totalDays > 0 ? (parseFloat(avgHotFlashes) * 7).toFixed(0) : "0"} lần/tuần</span>
                  <p className="text-[9px] text-muted-foreground font-semibold leading-none">Trung bình</p>
                </div>
                <svg className="w-16 h-8 text-primary shrink-0 select-none pointer-events-none" viewBox="0 0 100 35">
                  <path d={getSparklineData("hotFlashes")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Chất lượng ngủ */}
            <div className="border border-border/70 rounded-2xl p-4 bg-muted/15 flex flex-col justify-between min-h-[95px] print:border-gray-300">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Chất lượng giấc ngủ</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 leading-none">
                  {parseFloat(avgSleepQuality) >= 7.0 ? "Tốt" : parseFloat(avgSleepQuality) >= 5.0 ? "Khá" : "Kém"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-sm font-black text-foreground">{avgSleepQuality}/10</span>
                  <p className="text-[9px] text-muted-foreground font-semibold leading-none">Điểm số TB</p>
                </div>
                <svg className="w-16 h-8 text-[#B05581] shrink-0 select-none pointer-events-none" viewBox="0 0 100 35">
                  <path d={getSparklineData("sleepQuality")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Mất ngủ */}
            <div className="border border-border/70 rounded-2xl p-4 bg-muted/15 flex flex-col justify-between min-h-[95px] print:border-gray-300">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Mất ngủ</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 leading-none">
                  {parseFloat(avgInsomnia) >= 2.0 ? "Cao" : parseFloat(avgInsomnia) >= 1.0 ? "Vừa" : "Thấp"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-sm font-black text-foreground">{severeInsomniaCount} ngày/tháng</span>
                  <p className="text-[9px] text-muted-foreground font-semibold leading-none">Bị mất ngủ nặng</p>
                </div>
                {/* Vẽ biểu đồ cột nhỏ Sparkline bằng SVG */}
                <svg className="w-16 h-8 text-primary shrink-0 select-none pointer-events-none" viewBox="0 0 100 35">
                  <rect x="10" y="20" width="8" height="12" rx="2" fill="currentColor" opacity="0.3" />
                  <rect x="25" y="10" width="8" height="22" rx="2" fill="currentColor" />
                  <rect x="40" y="25" width="8" height="7" rx="2" fill="currentColor" opacity="0.3" />
                  <rect x="55" y="5" width="8" height="27" rx="2" fill="currentColor" />
                  <rect x="70" y="15" width="8" height="17" rx="2" fill="currentColor" opacity="0.6" />
                  <rect x="85" y="22" width="8" height="10" rx="2" fill="currentColor" opacity="0.3" />
                </svg>
              </div>
            </div>

            {/* Tâm trạng */}
            <div className="border border-border/70 rounded-2xl p-4 bg-muted/15 flex flex-col justify-between min-h-[95px] print:border-gray-300">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Tâm trạng tích cực</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 leading-none">
                  {parseFloat(avgSleepQuality) >= 7.0 ? "Tốt" : "Ổn định"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-sm font-black text-foreground">75%</span>
                  <p className="text-[9px] text-muted-foreground font-semibold leading-none">Chỉ số cảm xúc</p>
                </div>
                <svg className="w-16 h-8 text-emerald-500 shrink-0 select-none pointer-events-none" viewBox="0 0 100 35">
                  <path d={getSparklineData("mood")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Triệu chứng nổi bật */}
            <div className="border border-border/70 rounded-2xl p-4 bg-muted/15 flex flex-col justify-between min-h-[95px] print:border-gray-300 font-bold text-left">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">Triệu chứng nổi bật</span>
              <ul className="text-[10px] text-foreground space-y-0.5 list-disc pl-3 flex-1 mt-1">
                <li>Bốc hỏa về đêm</li>
                <li>Mất ngủ & trằn trọc</li>
                <li>Tâm lý dễ lo âu, nhạy cảm</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4. KHUYẾN NGHỊ CẢI THIỆN (AI Coach) */}
        <div className="border border-primary/20 rounded-2xl p-5 mb-8 bg-primary/5 print:bg-transparent print:border-gray-300 text-left">
          <h3 className="font-extrabold text-xs sm:text-sm text-foreground print:text-black flex items-center gap-1.5 mb-2.5 select-none">
            <Sparkles className="w-4 h-4 text-primary fill-current animate-pulse" /> Khuyến nghị cải thiện thể trạng (AI Coach)
          </h3>
          <p className="text-xs leading-relaxed text-foreground/90 print:text-gray-700 font-semibold">
            {totalDays === 0 
              ? "Chưa có đủ dữ liệu ghi nhận nhật ký sức khỏe để phân tích khuyến nghị."
              : avgPeriScore > 50 
                ? "Dữ liệu cho thấy chị đang trải qua giai đoạn tiền mãn kinh với các triệu chứng bốc hỏa và khó ngủ ở mức độ vừa đến nặng. Khuyến nghị chị nên bổ sung thực phẩm chứa phytoestrogen tự nhiên (đậu nành, hạt lanh, cỏ ba lá đỏ), uống trà thảo mộc làm mát gan điều hòa cơ thể trước khi ngủ và hạn chế trà, cà phê sau 14h chiều. Chị cũng nên duy trì phòng ngủ thông thoáng và duy trì lối sống lành mạnh."
                : "Thể trạng chung của chị ổn định, các triệu chứng vận mạch và giấc ngủ ở ngưỡng dung nạp tốt. Chị nên duy trì chế độ ăn giàu canxi, vitamin D để bảo vệ xương khớp và tập thể dục thể thao nhẹ nhàng như yoga, đi bộ từ 30 phút mỗi ngày."}
          </p>
        </div>

        {/* Chữ ký & QR code chân trang (Mockup 5) */}
        <div className="border-t border-border/40 print:border-gray-200 pt-5 mt-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Disclaimer & Nhắc nhở */}
          <div className="flex-1 space-y-2 text-left">
            <p className="text-[9px] leading-relaxed text-muted-foreground print:text-gray-500 font-bold max-w-md">
              Tuyên bố pháp lý: Báo cáo này hoàn toàn tự động kết xuất dựa trên dữ liệu nhật ký tự ghi chép của cá nhân. Báo cáo không mang tính chất chẩn đoán bệnh lâm sàng thay thế bác sĩ. Hãy mang báo cáo này thảo luận trực tiếp với bác sĩ phụ khoa của chị trong lần khám định kỳ gần nhất.
            </p>
            <p className="text-[10px] font-black text-primary leading-normal">
              💝 Hãy tiếp tục ghi nhật ký mỗi ngày để có cái nhìn chính xác nhất về sức khỏe của bạn.
            </p>
          </div>

          <div className="flex items-center gap-5 shrink-0 self-center sm:self-auto select-none">
            {/* Chữ ký */}
            <div className="text-center text-[10px] font-semibold text-muted-foreground print:text-gray-700">
              <p className="italic mb-8">Người theo dõi sức khỏe</p>
              <p className="font-extrabold text-foreground print:text-black border-t border-border/60 print:border-black pt-1 px-4 leading-none">
                {profile.displayName}
              </p>
            </div>

            {/* Mã QR code giả lập */}
            <div className="w-16 h-16 bg-white border border-border/80 rounded-xl p-1.5 shadow-sm flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-foreground fill-current">
                {/* Vẽ mã QR cách điệu */}
                <rect x="10" y="10" width="25" height="25" />
                <rect x="15" y="15" width="15" height="15" fill="white" />
                <rect x="18" y="18" width="9" height="9" />

                <rect x="65" y="10" width="25" height="25" />
                <rect x="70" y="15" width="15" height="15" fill="white" />
                <rect x="73" y="73" width="9" height="9" />

                <rect x="10" y="65" width="25" height="25" />
                <rect x="15" y="70" width="15" height="15" fill="white" />
                <rect x="18" y="73" width="9" height="9" />

                {/* Các chấm pixel nhiễu */}
                <rect x="45" y="15" width="8" height="8" />
                <rect x="40" y="25" width="8" height="8" />
                <rect x="55" y="20" width="8" height="8" />
                <rect x="45" y="45" width="12" height="12" />
                <rect x="65" y="45" width="8" height="8" />
                <rect x="45" y="65" width="8" height="8" />
                <rect x="55" y="75" width="8" height="8" />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Tham vấn Chuyên gia Sức khỏe - Hidden when print */}
      <div className="mt-8 bg-gradient-to-br from-primary/5 via-card/50 to-secondary/10 border border-primary/20 p-5 sm:p-6 rounded-2xl shadow-sm print:hidden space-y-4 glass-card w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Nhận hỗ trợ cải thiện từ Chuyên gia Sức khỏe
            </h3>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Chuyên gia sẽ dựa trên báo cáo chi tiết {rangeMonths} tháng của chị để hỗ trợ thiết lập lộ trình cải thiện và lối sống phù hợp nhất.
            </p>
          </div>
          <Button 
            onClick={handleZaloConsult}
            className="w-full md:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:bg-primary/95 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-95 transition-transform shrink-0 cursor-pointer"
          >
            <Copy className="w-4 h-4" /> Gửi báo cáo & Trò chuyện Zalo
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3.5 border-t border-border/40 text-[11px] text-muted-foreground font-semibold select-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>Tự động tổng hợp chỉ số PeriScore và số ngày mất ngủ, bốc hỏa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>Chuyển tiếp đến Zalo của Chuyên gia tư vấn (SĐT: 0982581222)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>Hỗ trợ giải đáp và chăm sóc sức khỏe ban đầu hoàn toàn miễn phí</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-transparent text-foreground p-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="ml-3 text-sm font-semibold">Đang kết xuất báo cáo y khoa...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
