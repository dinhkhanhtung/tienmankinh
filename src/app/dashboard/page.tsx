"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/use-user-store";
import { useLogStore } from "@/store/use-log-store";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useCycles } from "@/hooks/use-cycles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, Flame, Moon, Smile, Sparkles, AlertTriangle, 
  Calendar, ChevronRight, Activity, TrendingUp, Info 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, BarChart, Bar, ComposedChart 
} from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export default function DashboardPage() {
  const { profile } = useUserStore();
  const { dailyLogs } = useLogStore();
  const { getPeriScoreCategory, getLogForDate } = useDailyLog();
  const { nextPeriodDate, sortedCycles, averageCycleLength } = useCycles();
  
  const [isMounted, setIsMounted] = useState(false);

  // Đảm bảo Recharts chỉ render phía client
  useEffect(() => {
    setIsMounted(true);
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

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Chào {profile?.displayName || "chị"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 font-medium">
            Hôm nay là {format(new Date(), "EEEE, 'ngày' d 'tháng' M, yyyy", { locale: vi })}. Chúc chị một ngày an lành!
          </p>
        </div>

        {/* Nút nhanh ghi nhật ký */}
        <Link href="/log">
          <Button className="h-11 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold flex items-center gap-1.5 shadow-sm">
            Ghi nhật ký ngay <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Grid: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PeriScore */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary fill-current" /> PeriScore hôm nay
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary">{currentPeriScore}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-2 border ${periScoreCat.color.split(" ")[1]} ${periScoreCat.color.split(" ")[0]}`}>
              {periScoreCat.label}
            </span>
          </CardContent>
        </Card>

        {/* Card 2: Next Period */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Kỳ kinh tiếp theo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-black text-foreground truncate">
              {daysUntilNextPeriod}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {isCurrentlyInPeriod ? "Hãy chăm sóc bản thân" : `Độ dài chu kỳ TB: ${averageCycleLength} ngày`}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Avg Sleep */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-primary" /> Giấc ngủ trung bình
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-black text-foreground">
              {stats.avgSleep} giờ
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Chất lượng: <span className="font-bold text-primary">{stats.avgSleepQuality}</span> / 10
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Avg Hot Flashes */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-primary" /> Cường độ bốc hỏa TB
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-black text-foreground">
              {stats.avgHotFlashes} / 3.0
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              Dựa trên ghi chép 30 ngày
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: PeriScore detail & Medical Disclaimer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PeriScore Detail Card */}
        <Card className="border-border shadow-sm bg-gradient-to-br from-card to-secondary/10">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Chỉ số PeriScore (30 ngày)
            </CardTitle>
            <CardDescription className="text-xs">
              Điểm số phản ánh mức độ ảnh hưởng của các triệu chứng tiền mãn kinh
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl font-black text-primary">{stats.avgPeriScore}</div>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">Chỉ số PeriScore trung bình</p>
              
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mt-3 border ${avgPeriScoreCat.color}`}>
                {avgPeriScoreCat.label}
              </span>
            </div>

            <div className="space-y-2 border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1 text-[11px] uppercase tracking-wide">
                <Info className="w-3.5 h-3.5 text-primary" /> Giải thích chỉ số PeriScore
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><span className="font-bold text-foreground">0 - 30 (Thấp):</span> Các triệu chứng nhẹ, ít ảnh hưởng tiêu cực đến chất lượng sống.</li>
                <li><span className="font-bold text-foreground">31 - 60 (Trung bình):</span> Bắt đầu có bốc hỏa, mất ngủ rõ rệt. Cần điều chỉnh lối sống và dinh dưỡng.</li>
                <li><span className="font-bold text-foreground">61 - 100 (Cao):</span> Các triệu chứng nghiêm trọng. Chị nên tham khảo ý kiến của bác sĩ sản phụ khoa.</li>
              </ul>
            </div>

            {/* Medical disclaimer */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60 rounded-xl text-[11px] leading-relaxed text-amber-800 dark:text-amber-300 font-semibold mt-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-500" />
              <span>
                KHUYẾN CÁO: Điểm số này dựa trên tự đánh giá triệu chứng của chị, chỉ mang tính tham khảo cải thiện lối sống và tuyệt đối không thay thế chẩn đoán y khoa từ bác sĩ.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Coach Suggestion Quick Card */}
        <Card className="lg:col-span-2 border-border shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary fill-current" /> AI Coach của chị nói gì?
            </CardTitle>
            <CardDescription className="text-xs">
              Lời khuyên cá nhân hóa dựa trên dữ liệu sức khỏe 7 ngày qua của chị
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-muted/40 border border-border rounded-xl">
              <p className="text-sm leading-relaxed italic text-foreground">
                {stats.loggedDaysCount === 0 
                  ? "Chào chị! Hãy ghi nhận nhật ký triệu chứng tối thiểu 1 ngày để tôi có cơ sở phân tích thể trạng và đưa ra các lời khuyên dinh dưỡng, vận động cá nhân hóa dành riêng cho chị."
                  : stats.avgPeriScore > 50 
                    ? "Gần đây chỉ số bốc hỏa và mất ngủ của chị khá cao. Chị nên thử uống một ly trà hoa cúc ấm trước khi ngủ, ngâm chân nước ấm và duy trì phòng ngủ thoáng mát khoảng 22-24°C để giấc ngủ sâu hơn nhé."
                    : "Thể trạng của chị trong 30 ngày qua khá ổn định. Hãy duy trì đi bộ nhẹ nhàng 30 phút mỗi ngày và tăng cường các thực phẩm giàu phytoestrogen như đậu nành, hạt lanh chị nhé."}
              </p>
            </div>
          </CardContent>
          <CardContent className="pt-0 flex justify-end">
            <Link href="/chat">
              <Button variant="outline" className="h-10 rounded-xl border-border hover:bg-muted text-xs font-bold flex items-center gap-1.5 text-primary">
                Trò chuyện với AI Coach <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Section: Analytics Charts (30 days) */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Xu hướng & Phân tích sức khỏe (30 ngày gần nhất)
          </CardTitle>
          <CardDescription className="text-xs">
            Trực quan hóa sự thay đổi triệu chứng và tương quan giấc ngủ - tâm trạng
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4 border-t border-border/40">
          {stats.loggedDaysCount === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm font-semibold">
              Chưa có đủ dữ liệu ghi chép nhật ký 30 ngày qua để vẽ biểu đồ xu hướng.
            </div>
          ) : (
            isMounted && (
              <div className="space-y-8">
                {/* Chart 1: Triệu chứng Hot Flashes vs Insomnia */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Xu hướng Bốc hỏa & Mất ngủ</h4>
                  <p className="text-[11px] text-muted-foreground">Theo dõi cường độ từ 0 (Không bị) đến 3 (Nặng)</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1DDE7" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} stroke="#7A4E6D" />
                        <YAxis domain={[0, 3]} tickCount={4} tick={{ fontSize: 10 }} stroke="#7A4E6D" />
                        <Tooltip contentStyle={{ borderRadius: "10px", borderColor: "#F1DDE7" }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="Bốc hỏa" stroke="#D96C9D" strokeWidth={3} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Mất ngủ" stroke="#7A4E6D" strokeWidth={3} />
                        <Line type="monotone" dataKey="Đổ mồ hôi đêm" stroke="#ED8EB9" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Sleep vs Mood Correlation */}
                <div className="space-y-2 border-t border-border/30 pt-6">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Mối tương quan giữa Giấc ngủ & Cảm xúc</h4>
                  <p className="text-[11px] text-muted-foreground">So sánh số giờ ngủ thực tế, chất lượng ngủ (1-10) và mức cảm xúc (1: Rất buồn đến 5: Rất tốt)</p>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1DDE7" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} stroke="#7A4E6D" />
                        <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 10 }} stroke="#7A4E6D" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 10 }} stroke="#7A4E6D" />
                        <Tooltip contentStyle={{ borderRadius: "10px", borderColor: "#F1DDE7" }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar yAxisId="left" dataKey="Thời gian ngủ (giờ)" fill="#F8D7E6" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="left" type="monotone" dataKey="Chất lượng ngủ" stroke="#B05581" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Tâm trạng" stroke="#D96C9D" strokeWidth={2.5} dot={{ r: 4 }} />
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
