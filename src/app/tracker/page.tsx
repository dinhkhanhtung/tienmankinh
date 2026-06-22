"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCycles } from "@/hooks/use-cycles";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, AlertTriangle, CheckCircle, Info, Plus, Calendar as CalendarIcon, Trash2, Check, Heart, Loader2 } from "lucide-react";
import { format, differenceInDays, addDays, isWithinInterval, startOfDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function TrackerContent() {
  const { 
    sortedCycles, 
    averageCycleLength, 
    averagePeriodDuration, 
    nextPeriodDate, 
    addPeriod, 
    updatePeriod, 
    deletePeriod,
    loading 
  } = useCycles();

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  
  const [showEndForm, setShowEndForm] = useState(false);
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endNotes, setEndNotes] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "start") {
      setShowAddForm(true);
      setShowEndForm(false);
    } else if (action === "end") {
      setShowEndForm(true);
      setShowAddForm(false);
    }
  }, [searchParams]);

  const latestCycle = sortedCycles[0];
  const isCurrentlyInPeriod = latestCycle && latestCycle.endDate === null;

  // Tính toán đếm ngược đến kỳ kinh tiếp theo
  const getCountdownText = () => {
    if (isCurrentlyInPeriod) {
      return { text: "Bạn đang trong kỳ kinh nguyệt", color: "text-primary" };
    }
    if (!nextPeriodDate) {
      return { text: "Chưa có đủ dữ liệu dự báo", color: "text-muted-foreground" };
    }

    const today = startOfDay(new Date());
    const target = startOfDay(nextPeriodDate);
    const diff = differenceInDays(target, today);

    if (diff === 0) {
      return { text: "Kỳ kinh tiếp theo bắt đầu hôm nay!", color: "text-primary font-black animate-pulse" };
    }
    if (diff > 0) {
      return { text: `Còn ${diff} ngày đến kỳ kinh tiếp theo`, color: "text-primary font-black" };
    }
    return { text: `Trễ kinh ${Math.abs(diff)} ngày`, color: "text-red-500 font-black animate-pulse" };
  };

  const countdown = getCountdownText();

  // 1. Tạo danh sách các ngày hành kinh thực tế để highlight trên Lịch
  const getPeriodDays = (): Date[] => {
    const dates: Date[] = [];
    sortedCycles.forEach((cycle) => {
      const start = parseISO(cycle.startDate);
      if (cycle.endDate) {
        const end = parseISO(cycle.endDate);
        const days = differenceInDays(end, start) + 1;
        for (let i = 0; i < days; i++) {
          dates.push(addDays(start, i));
        }
      } else {
        // Nếu chưa kết thúc, đánh dấu từ startDate đến hôm nay hoặc tối đa 7 ngày
        const today = new Date();
        const diff = Math.min(differenceInDays(today, start), 7);
        for (let i = 0; i <= diff; i++) {
          dates.push(addDays(start, i));
        }
      }
    });
    return dates;
  };

  // 2. Tạo danh sách ngày dự đoán hành kinh tiếp theo (tối đa dự báo 5 ngày bắt đầu từ nextPeriodDate)
  const getPredictedDays = (): Date[] => {
    if (!nextPeriodDate || isCurrentlyInPeriod) return [];
    const dates: Date[] = [];
    for (let i = 0; i < averagePeriodDuration; i++) {
      dates.push(addDays(nextPeriodDate, i));
    }
    return dates;
  };

  const periodDays = getPeriodDays();
  const predictedDays = getPredictedDays();

  // Custom modifiers cho Calendar
  const modifiers = {
    period: periodDays,
    predicted: predictedDays,
  };

  const modifiersStyles = {
    period: {
      backgroundColor: "#D96C9D",
      color: "white",
      fontWeight: "bold",
      borderRadius: "50%",
      boxShadow: "0 2px 8px rgba(217, 108, 157, 0.4)",
    },
    predicted: {
      backgroundColor: "#F8D7E6",
      color: "#7A4E6D",
      border: "2px dashed #D96C9D",
      borderRadius: "50%",
    },
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu.");
      return;
    }
    await addPeriod(startDate, notes);
    setShowAddForm(false);
    setNotes("");
  };

  const handleEndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endDate) {
      toast.error("Vui lòng chọn ngày kết thúc.");
      return;
    }
    if (!latestCycle) return;
    await updatePeriod(latestCycle.id, endDate, endNotes);
    setShowEndForm(false);
    setEndNotes("");
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa chu kỳ kinh nguyệt này không?")) {
      deletePeriod(id);
    }
  };

  return (
    <div className="space-y-6 pb-6 page-transition">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground sm:text-3xl">Lịch chu kỳ kinh nguyệt</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-semibold leading-relaxed">
          Theo dõi chu kỳ kinh nguyệt hiện tại và xem dự báo chu kỳ tiếp theo để phát hiện sớm các bất thường nội tiết.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Countdown Card */}
        <Card className="border-border shadow-sm flex flex-col justify-between glass-card hover:-translate-y-0.5 duration-300">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Trạng thái chu kỳ</CardDescription>
            <CardTitle className={`text-base sm:text-lg font-black mt-1 ${countdown.color} leading-snug`}>
              {countdown.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:pt-2">
            {nextPeriodDate && !isCurrentlyInPeriod && (
              <p className="text-xs text-muted-foreground font-semibold">
                Kỳ tiếp theo dự kiến: <span className="text-foreground font-bold">{format(nextPeriodDate, "dd MMMM, yyyy", { locale: vi })}</span>
              </p>
            )}
            {isCurrentlyInPeriod && latestCycle && (
              <p className="text-xs text-muted-foreground font-semibold">
                Bắt đầu từ: <span className="text-foreground font-bold">{format(parseISO(latestCycle.startDate), "dd MMMM, yyyy", { locale: vi })}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Average Cycle Length Card */}
        <Card className="border-border shadow-sm glass-card hover:-translate-y-0.5 duration-300">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Vòng chu kỳ trung bình</CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {averageCycleLength} ngày
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:pt-2">
            <p className="text-[11px] text-muted-foreground font-semibold leading-normal">
              Tính trên các chu kỳ gần đây. Bình thường: 21–35 ngày.
            </p>
          </CardContent>
        </Card>

        {/* Average Period Duration Card */}
        <Card className="border-border shadow-sm glass-card hover:-translate-y-0.5 duration-300">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Thời gian hành kinh trung bình</CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {averagePeriodDuration} ngày
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:pt-2">
            <p className="text-[11px] text-muted-foreground font-semibold leading-normal">
              Số ngày ra máu trung bình. Bình thường: 3–7 ngày.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content Area (Calendar & Forms / Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar and Actions Card (Takes 2 cols) */}
        <Card className="lg:col-span-2 border-border shadow-sm overflow-hidden glass-card">
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40">
            <div>
              <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Lịch kinh nguyệt
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-xs mt-2 flex flex-wrap gap-x-4 gap-y-1.5 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block shadow-sm"></span> Ngày hành kinh
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-secondary border-2 border-dashed border-primary inline-block"></span> Ngày dự đoán
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span> Nhật ký tốt
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#7A4E6D] inline-block"></span> Nhật ký mệt
                </span>
              </CardDescription>
            </div>
            
            {/* Quick Actions Buttons */}
            <div className="w-full sm:w-auto shrink-0">
              {!isCurrentlyInPeriod ? (
                <Button 
                  onClick={() => { setShowAddForm(!showAddForm); setShowEndForm(false); }}
                  className="w-full sm:w-auto h-11 px-5 font-bold text-xs rounded-xl bg-gradient-to-r from-primary to-primary/95 text-primary-foreground hover:opacity-95 flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" /> Ghi nhận bắt đầu kỳ kinh
                </Button>
              ) : (
                <Button 
                  onClick={() => { setShowEndForm(!showEndForm); setShowAddForm(false); }}
                  className="w-full sm:w-auto h-11 px-5 font-bold text-xs rounded-xl bg-accent text-accent-foreground hover:bg-accent/95 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  <Check className="w-4 h-4" /> Đánh dấu kết thúc kỳ kinh
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8 p-4 sm:p-6">
            {/* Calendar Container */}
            <div className="p-2 sm:p-4 border border-border/80 bg-muted/10 rounded-3xl w-full max-w-[325px] md:max-w-[350px] flex justify-center overflow-hidden shadow-inner shrink-0">
              <Calendar
                mode="single"
                locale={vi}
                className="rounded-2xl p-0"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
              />
            </div>

            {/* Hướng dẫn ghi nhận chu kỳ */}
            <div className="flex-1 w-full max-w-sm space-y-4 self-stretch flex flex-col justify-center">
              <div 
                onClick={() => {
                  if (isCurrentlyInPeriod) {
                    setShowEndForm(true);
                  } else {
                    setShowAddForm(true);
                  }
                }}
                className="p-5 bg-primary/5 border border-dashed border-primary/30 rounded-2xl text-center space-y-3 py-8 shadow-sm cursor-pointer hover:bg-primary/10 hover:border-primary/50 active:scale-98 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <Info className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold max-w-[280px] mx-auto group-hover:text-foreground transition-colors">
                  {isCurrentlyInPeriod 
                    ? "Chị đang trong kỳ kinh. Hãy cập nhật ngày kết thúc ngay khi kỳ kinh kết thúc để cải thiện độ chính xác của dự báo chu kỳ."
                    : "Hãy ghi nhận ngày bắt đầu ngay khi chị có kinh trở lại để hệ thống tự động tính toán vòng chu kỳ tiếp theo."}
                </p>
                <div className="pt-1.5">
                  <span className="text-[10px] font-black text-primary px-3.5 py-1.5 rounded-full bg-primary-foreground border border-primary/20 shadow-sm uppercase tracking-wider group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {isCurrentlyInPeriod ? "Cập nhật ngày kết thúc" : "Ghi nhận bắt đầu"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline View & Abnormal Warnings (1 col) - Art Timeline */}
        <Card className="border-border shadow-sm glass-card flex flex-col">
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4 border-b border-border/40">
            <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Lịch sử chu kỳ
            </CardTitle>
            <CardDescription className="text-xs">
              Lịch sử ghi chép các chu kỳ kinh nguyệt trước đây
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 flex-1 max-h-[420px] overflow-y-auto scrollbar-none">
            {sortedCycles.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs font-semibold">
                Chưa ghi nhận dữ liệu chu kỳ nào.
              </div>
            ) : (
              // Art Timeline Tree
              <div className="relative border-l-2 border-primary/20 pl-6 space-y-6 pt-2 ml-3">
                {sortedCycles.map((cycle, index) => {
                  const start = parseISO(cycle.startDate);
                  const end = cycle.endDate ? parseISO(cycle.endDate) : null;
                  
                  return (
                    <div key={cycle.id} className="relative group">
                      {/* Trái tim cột mốc nghệ thuật */}
                      <span className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-background transition-transform duration-300 group-hover:scale-110 ${
                        cycle.endDate 
                          ? "border-primary text-primary shadow-sm" 
                          : "border-green-500 text-green-500 shadow-sm animate-pulse"
                      }`}>
                        <Heart className="w-2.5 h-2.5 fill-current" />
                      </span>
                      
                      <div className="space-y-2 p-3 bg-muted/20 border border-border/30 rounded-2xl transition-all duration-300 group-hover:bg-muted/30 group-hover:border-primary/20">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-foreground leading-none">
                            {format(start, "dd/MM/yyyy")} - {end ? format(end, "dd/MM/yyyy") : "Đang diễn ra"}
                          </span>
                          <button
                            onClick={() => handleDelete(cycle.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors shrink-0 active:scale-90"
                            title="Xóa chu kỳ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          {cycle.duration && (
                            <span className="px-2 py-0.5 rounded-md bg-secondary/40 text-secondary-foreground font-black border border-secondary/20">
                              Hành kinh: {cycle.duration} ngày
                            </span>
                          )}
                          {cycle.cycleLength && (
                            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-black border border-border/50">
                              Vòng chu kỳ: {cycle.cycleLength} ngày
                            </span>
                          )}
                        </div>

                        {cycle.isAbnormal && (
                          <div className="flex items-start gap-1.5 p-2.5 bg-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/10 rounded-xl text-[10px] leading-relaxed font-bold shadow-inner pulse-glow">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                            <span>
                              Bất thường: {cycle.duration && (cycle.duration < 2 || cycle.duration > 8) ? "Thời gian hành kinh quá ngắn hoặc quá dài" : "Chu kỳ nằm ngoài ngưỡng an toàn (21 - 35 ngày)"}.
                            </span>
                          </div>
                        )}

                        {cycle.notes && (
                          <p className="text-[10px] sm:text-[11px] italic text-muted-foreground leading-normal bg-card p-2 rounded-xl border border-border/40 font-semibold">
                            Ghi chú: {cycle.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Bắt đầu kỳ kinh */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-base text-foreground">Bắt đầu kỳ kinh mới</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ghi nhận ngày bắt đầu kỳ kinh nguyệt mới của chị để hệ thống tính toán chu kỳ.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-[11px] font-bold text-muted-foreground uppercase">Ngày bắt đầu</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-xl bg-background border-border text-sm font-semibold focus-visible:ring-primary/20"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-[11px] font-bold text-muted-foreground uppercase">Ghi chú (tùy chọn)</Label>
              <Input
                id="notes"
                placeholder="Cảm xúc, triệu chứng khởi đầu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 rounded-xl bg-background border-border text-sm font-semibold focus-visible:ring-primary/20"
              />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border/40 mt-4 -mx-4 -mb-4 bg-muted/30 p-4 rounded-b-xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="flex-1 h-10 text-xs rounded-xl font-bold border-border"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-10 text-xs rounded-xl font-bold bg-primary text-primary-foreground"
                disabled={loading}
              >
                Ghi nhận
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Kết thúc kỳ kinh */}
      <Dialog open={showEndForm} onOpenChange={setShowEndForm}>
        <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-base text-foreground">Kết thúc kỳ kinh nguyệt</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ghi nhận ngày kết thúc kỳ kinh nguyệt của chị để cải thiện dự báo sức khỏe.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEndSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-[11px] font-bold text-muted-foreground uppercase">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-xl bg-background border-border text-sm font-semibold focus-visible:ring-primary/20"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endNotes" className="text-[11px] font-bold text-muted-foreground uppercase">Ghi chú (tùy chọn)</Label>
              <Input
                id="endNotes"
                placeholder="Lượng máu, triệu chứng đi kèm..."
                value={endNotes}
                onChange={(e) => setEndNotes(e.target.value)}
                className="h-10 rounded-xl bg-background border-border text-sm font-semibold focus-visible:ring-primary/20"
              />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border/40 mt-4 -mx-4 -mb-4 bg-muted/30 p-4 rounded-b-xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEndForm(false)}
                className="flex-1 h-10 text-xs rounded-xl font-bold border-border"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-10 text-xs rounded-xl font-bold bg-accent text-accent-foreground"
                disabled={loading}
              >
                Hoàn thành
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[400px] page-transition">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-2 font-semibold animate-pulse">Đang tải lịch chu kỳ...</p>
      </div>
    }>
      <TrackerContent />
    </Suspense>
  );
}
