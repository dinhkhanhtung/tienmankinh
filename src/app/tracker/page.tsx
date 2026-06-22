"use client";

import React, { useState } from "react";
import { useCycles } from "@/hooks/use-cycles";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, AlertTriangle, CheckCircle, Info, Plus, Calendar as CalendarIcon, Trash2, Check } from "lucide-react";
import { format, differenceInDays, addDays, isWithinInterval, startOfDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

export default function TrackerPage() {
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
      return { text: "Kỳ kinh tiếp theo bắt đầu hôm nay!", color: "text-primary font-bold animate-pulse" };
    }
    if (diff > 0) {
      return { text: `Còn ${diff} ngày đến kỳ kinh tiếp theo`, color: "text-primary" };
    }
    return { text: `Trễ kinh ${Math.abs(diff)} ngày`, color: "text-red-500 font-bold" };
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
    },
    predicted: {
      backgroundColor: "#F8D7E6",
      color: "#7A4E6D",
      border: "1px dashed #D96C9D",
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
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Lịch chu kỳ kinh nguyệt</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Theo dõi chu kỳ kinh nguyệt hiện tại và xem dự báo chu kỳ tiếp theo để phát hiện bất thường
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Countdown Card */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Trạng thái chu kỳ</CardDescription>
            <CardTitle className={`text-base font-bold sm:text-lg mt-1 ${countdown.color}`}>
              {countdown.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {nextPeriodDate && !isCurrentlyInPeriod && (
              <p className="text-xs text-muted-foreground">
                Kỳ tiếp theo dự kiến: {format(nextPeriodDate, "dd MMMM, yyyy", { locale: vi })}
              </p>
            )}
            {isCurrentlyInPeriod && latestCycle && (
              <p className="text-xs text-muted-foreground">
                Bắt đầu từ: {format(parseISO(latestCycle.startDate), "dd MMMM, yyyy", { locale: vi })} (Đang hành kinh)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Average Cycle Length Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Độ dài chu kỳ trung bình</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground mt-1">
              {averageCycleLength} ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Tính trên các chu kỳ gần đây. Bình thường: 21–35 ngày.
            </p>
          </CardContent>
        </Card>

        {/* Average Period Duration Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider">Thời gian hành kinh trung bình</CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground mt-1">
              {averagePeriodDuration} ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Số ngày hành kinh trung bình mỗi chu kỳ. Bình thường: 3–7 ngày.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content Area (Calendar & Forms / Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar and Actions Card (Takes 2 cols) */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Lịch kinh nguyệt
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                <span className="inline-flex items-center gap-1 mr-3">
                  <span className="w-3.5 h-3.5 rounded-full bg-primary inline-block"></span> Ngày hành kinh
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded-full bg-secondary border border-dashed border-primary inline-block"></span> Ngày dự đoán
                </span>
              </CardDescription>
            </div>
            
            {/* Quick Actions Buttons */}
            <div>
              {!isCurrentlyInPeriod ? (
                <Button 
                  onClick={() => { setShowAddForm(!showAddForm); setShowEndForm(false); }}
                  className="h-10 px-4 font-semibold text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Bắt đầu kỳ kinh
                </Button>
              ) : (
                <Button 
                  onClick={() => { setShowEndForm(!showEndForm); setShowAddForm(false); }}
                  className="h-10 px-4 font-semibold text-sm rounded-xl bg-accent text-accent-foreground hover:bg-accent/95 flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Kết thúc kỳ kinh
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 pt-0 border-t border-border/40">
            {/* Calendar */}
            <div className="p-2 border border-border/60 bg-muted/20 rounded-2xl">
              <Calendar
                mode="single"
                locale={vi}
                className="rounded-xl"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
              />
            </div>

            {/* Form Panels */}
            <div className="flex-1 w-full max-w-sm space-y-4">
              {/* Form Bắt đầu kỳ kinh */}
              {showAddForm && (
                <form onSubmit={handleAddSubmit} className="bg-muted/40 p-4 border border-border rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-foreground">Bắt đầu kỳ kinh mới</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs font-semibold">Ngày bắt đầu</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 rounded-xl bg-background border-border text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-semibold">Ghi chú (tùy chọn)</Label>
                    <Input
                      id="notes"
                      placeholder="Cảm xúc, triệu chứng khởi đầu..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="h-10 rounded-xl bg-background border-border text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 h-9 text-xs rounded-xl"
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-9 text-xs rounded-xl bg-primary text-primary-foreground"
                      disabled={loading}
                    >
                      Ghi nhận
                    </Button>
                  </div>
                </form>
              )}

              {/* Form Kết thúc kỳ kinh */}
              {showEndForm && (
                <form onSubmit={handleEndSubmit} className="bg-muted/40 p-4 border border-border rounded-2xl space-y-4">
                  <h3 className="font-bold text-sm text-foreground">Kết thúc kỳ kinh nguyệt</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-xs font-semibold">Ngày kết thúc</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 rounded-xl bg-background border-border text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="endNotes" className="text-xs font-semibold">Ghi chú (tùy chọn)</Label>
                    <Input
                      id="endNotes"
                      placeholder="Lượng máu, triệu chứng đi kèm..."
                      value={endNotes}
                      onChange={(e) => setEndNotes(e.target.value)}
                      className="h-10 rounded-xl bg-background border-border text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowEndForm(false)}
                      className="flex-1 h-9 text-xs rounded-xl"
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-9 text-xs rounded-xl bg-accent text-accent-foreground"
                      disabled={loading}
                    >
                      Hoàn thành
                    </Button>
                  </div>
                </form>
              )}

              {/* Hướng dẫn khi chưa mở form */}
              {!showAddForm && !showEndForm && (
                <div className="p-4 bg-muted/20 border border-dashed border-border rounded-2xl text-center space-y-3">
                  <Info className="w-8 h-8 text-primary/70 mx-auto" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isCurrentlyInPeriod 
                      ? "Hệ thống đang ghi nhận bạn đang trong kỳ kinh nguyệt. Hãy cập nhật ngày kết thúc khi kỳ kinh kết thúc để tính toán thời gian chính xác."
                      : "Hãy ghi nhận ngày bắt đầu ngay khi bạn có kinh trở lại để hệ thống liên tục tối ưu hóa thuật toán dự báo chu kỳ mới."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline View & Abnormal Warnings (1 col) */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Lịch sử chu kỳ
            </CardTitle>
            <CardDescription className="text-xs">
              Xem lại các chu kỳ kinh nguyệt trước đây của bạn
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4 pt-0 border-t border-border/40 max-h-[420px] overflow-y-auto">
            {sortedCycles.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm font-medium">
                Chưa ghi nhận dữ liệu chu kỳ.
              </div>
            ) : (
              <div className="relative border-l border-border pl-4 space-y-6 pt-4">
                {sortedCycles.map((cycle, index) => {
                  const start = parseISO(cycle.startDate);
                  const end = cycle.endDate ? parseISO(cycle.endDate) : null;
                  
                  return (
                    <div key={cycle.id} className="relative">
                      {/* Cột mốc nhỏ */}
                      <span className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 ${
                        cycle.endDate ? "bg-primary border-primary-foreground" : "bg-green-500 border-green-100 animate-ping"
                      }`}></span>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {format(start, "dd/MM/yyyy")} - {end ? format(end, "dd/MM/yyyy") : "Đang diễn ra"}
                          </span>
                          <button
                            onClick={() => handleDelete(cycle.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 rounded transition-colors"
                            title="Xóa chu kỳ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {cycle.duration && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                              Hành kinh: {cycle.duration} ngày
                            </span>
                          )}
                          {cycle.cycleLength && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                              Vòng chu kỳ: {cycle.cycleLength} ngày
                            </span>
                          )}
                        </div>

                        {cycle.isAbnormal && (
                          <div className="flex items-start gap-1 p-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900 rounded-lg text-[11px] leading-relaxed font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              Chu kỳ bất thường (
                              {cycle.duration && (cycle.duration < 2 || cycle.duration > 8) ? "Thời gian hành kinh bất thường" : "Chu kỳ quá ngắn hoặc quá dài"}
                              ).
                            </span>
                          </div>
                        )}

                        {cycle.notes && (
                          <p className="text-[11px] italic text-muted-foreground leading-normal">
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
    </div>
  );
}
