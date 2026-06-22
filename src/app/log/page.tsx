"use client";

import React, { useState, useEffect } from "react";
import { useDailyLog, DEFAULT_SYMPTOMS, DEFAULT_SLEEP, DEFAULT_MOOD } from "@/hooks/use-daily-log";
import { useSpeech } from "@/hooks/use-speech";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Smile, Frown, Meh, AlertCircle, Mic, MicOff, Info, 
  Flame, Moon, Smile as MoodIcon, Save, Calendar, Loader2, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function LogPage() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { getLogForDate, saveLog, getPeriScoreCategory, calculateSleepDuration, loading } = useDailyLog();

  // Local Form state
  const [symptoms, setSymptoms] = useState(DEFAULT_SYMPTOMS);
  const [sleep, setSleep] = useState(DEFAULT_SLEEP);
  const [mood, setMood] = useState(DEFAULT_MOOD);

  // Sync local state chỉ khi người dùng chọn ngày khác
  useEffect(() => {
    const log = getLogForDate(selectedDate);
    setSymptoms(log.symptoms);
    setSleep(log.sleep);
    setMood(log.mood);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Thiết lập Voice Recognition cho ghi chú tâm trạng
  const handleTranscript = (text: string) => {
    setMood((prev) => ({
      ...prev,
      note: prev.note ? `${prev.note} ${text}` : text,
    }));
    toast.success("Đã ghi nhận giọng nói của bạn.");
  };

  const { isListening, browserSupportsSpeech, startListening, stopListening } = useSpeech(handleTranscript);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info("Đang lắng nghe... Vui lòng nói vào micro.");
    }
  };

  // Cập nhật triệu chứng
  const handleSymptomChange = (name: keyof typeof DEFAULT_SYMPTOMS, val: number) => {
    setSymptoms((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  // Định nghĩa các loại triệu chứng để render cho khoa học
  const symptomGroups = [
    {
      title: "Triệu chứng Vận mạch (Vasomotor)",
      description: "Có hệ số tác động lớn đến chỉ số PeriScore",
      items: [
        { key: "hotFlashes" as const, label: "Bốc hỏa", desc: "Cảm giác nóng đột ngột ở mặt, cổ, ngực" },
        { key: "nightSweats" as const, label: "Đổ mồ hôi đêm", desc: "Mồ hôi ra nhiều khi ngủ" },
        { key: "palpitations" as const, label: "Tim đập nhanh", desc: "Hồi hộp, tim đập thình thịch" },
      ]
    },
    {
      title: "Triệu chứng Thần kinh & Cảm xúc",
      description: "Thay đổi về tâm lý và hệ thống thần kinh",
      items: [
        { key: "insomnia" as const, label: "Mất ngủ", desc: "Khó đi vào giấc ngủ, ngủ chập chờn" },
        { key: "anxiety" as const, label: "Lo âu", desc: "Cảm giác bồn chồn, lo lắng vô cớ" },
        { key: "irritability" as const, label: "Cáu gắt", desc: "Dễ nổi nóng, bực bội với xung quanh" },
        { key: "depression" as const, label: "Trầm buồn", desc: "Tâm trạng buồn bã, uể oải, suy sụp" },
      ]
    },
    {
      title: "Biến đổi Thể chất",
      description: "Ảnh hưởng cơ khớp và bề ngoài",
      items: [
        { key: "jointPain" as const, label: "Đau khớp", desc: "Nhức mỏi cơ xương khớp" },
        { key: "fatigue" as const, label: "Mệt mỏi", desc: "Thiếu năng lượng, suy nhược cơ thể" },
        { key: "weightGain" as const, label: "Tăng cân", desc: "Tích mỡ vùng bụng, tăng cân không rõ lý do" },
        { key: "drySkin" as const, label: "Khô da", desc: "Da khô ráp, ngứa, rụng tóc" },
      ]
    },
    {
      title: "Hệ thống Sinh dục & Nội tiết",
      description: "Do suy giảm nồng độ Estrogen",
      items: [
        { key: "vaginalDryness" as const, label: "Khô âm đạo", desc: "Gây đau rát khi quan hệ" },
        { key: "lowLibido" as const, label: "Giảm ham muốn", desc: "Không còn hứng thú trong chuyện chăn gối" },
      ]
    }
  ];

  const handleSaveLog = async () => {
    await saveLog(selectedDate, symptoms, sleep, mood);
  };

  const sleepDurMinutes = calculateSleepDuration(sleep.bedTime, sleep.wakeTime);
  const sleepDurHours = (sleepDurMinutes / 60).toFixed(1);

  // Emojis mapping cho Mood
  const moodOptions = [
    { level: "very-good" as const, label: "Rất tốt", icon: Smile, color: "text-green-500 bg-green-50 dark:bg-green-950/20" },
    { level: "good" as const, label: "Tốt", icon: Smile, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
    { level: "neutral" as const, label: "Bình thường", icon: Meh, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" },
    { level: "bad" as const, label: "Buồn", icon: Frown, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20" },
    { level: "very-bad" as const, label: "Rất buồn", icon: Frown, color: "text-red-500 bg-red-50 dark:bg-red-950/20" },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Title & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground sm:text-3xl">Nhật ký sức khỏe</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-semibold leading-relaxed">
            Ghi nhận thể trạng hàng ngày để AI Coach theo dõi và cá nhân hóa tư vấn sức khỏe tuổi trung niên.
          </p>
        </div>
        
        {/* Date input */}
        <div className="flex items-center gap-2 bg-card border border-border p-2 px-3 rounded-xl shadow-sm self-start sm:self-auto transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <Label htmlFor="log-date" className="sr-only">Chọn ngày ghi nhật ký</Label>
          <Input
            id="log-date"
            type="date"
            max={format(new Date(), "yyyy-MM-dd")}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto font-bold text-xs sm:text-sm w-32 cursor-pointer text-foreground"
          />
        </div>
      </div>

      {/* Main Forms Layout */}
      <Tabs defaultValue="symptoms" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-11 bg-muted/60 p-1 rounded-xl mb-6 shadow-inner">
          <TabsTrigger value="symptoms" className="rounded-lg font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Flame className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Triệu chứng
          </TabsTrigger>
          <TabsTrigger value="sleep" className="rounded-lg font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Moon className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Giấc ngủ
          </TabsTrigger>
          <TabsTrigger value="mood" className="rounded-lg font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <MoodIcon className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Tâm trạng
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Symptoms Form */}
        <TabsContent value="symptoms" className="space-y-4 outline-none">
          {symptomGroups.map((group, groupIdx) => (
            <Card key={groupIdx} className="border-border shadow-sm overflow-hidden bg-card/75 backdrop-blur-sm">
              <CardHeader className="bg-muted/10 border-b border-border/40 p-4 pb-3">
                <CardTitle className="text-sm sm:text-base font-extrabold">{group.title}</CardTitle>
                <CardDescription className="text-[11px] sm:text-xs font-semibold text-muted-foreground">{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/40">
                {group.items.map((item) => (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                    <div className="space-y-0.5 max-w-md">
                      <Label className="text-xs sm:text-sm font-extrabold text-foreground">{item.label}</Label>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed font-semibold">{item.desc}</p>
                    </div>

                    {/* Selector thang điểm 0-3 */}
                    <div className="flex items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSymptomChange(item.key, val)}
                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg font-bold text-xs border transition-all active:scale-95 ${
                              symptoms[item.key] === val
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10"
                                : "bg-background border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {val === 0 ? "0" : `+${val}`}
                          </button>
                        ))}
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 ${
                        symptoms[item.key] === 0 
                          ? "text-muted-foreground bg-muted/40 border-border/60" 
                          : symptoms[item.key] === 1 
                            ? "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200" 
                            : symptoms[item.key] === 2 
                              ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200" 
                              : "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200"
                      }`}>
                        {symptoms[item.key] === 0 ? "Không" :
                         symptoms[item.key] === 1 ? "Nhẹ" :
                         symptoms[item.key] === 2 ? "Vừa" : "Nặng"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Quick save button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveLog}
              className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-md w-full sm:w-auto active:scale-98 transition-transform"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Lưu nhật ký triệu chứng
            </Button>
          </div>
        </TabsContent>

        {/* TAB 2: Sleep Form */}
        <TabsContent value="sleep" className="outline-none">
          <Card className="border-border shadow-sm max-w-2xl bg-card/75 backdrop-blur-sm">
            <CardHeader className="bg-muted/10 border-b border-border/40 p-4 pb-3">
              <CardTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" /> Thông tin giấc ngủ ban đêm
              </CardTitle>
              <CardDescription className="text-xs">
                Theo dõi thời gian và chất lượng giấc ngủ để phát hiện sớm rối loạn giấc ngủ tuổi tiền mãn kinh.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Giờ đi ngủ */}
                <div className="space-y-1.5">
                  <Label htmlFor="bedTime" className="text-xs font-bold text-muted-foreground uppercase">Giờ đi ngủ</Label>
                  <Input
                    id="bedTime"
                    type="time"
                    value={sleep.bedTime}
                    onChange={(e) => setSleep((prev) => ({ ...prev, bedTime: e.target.value }))}
                    className="h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                  />
                </div>

                {/* Giờ thức dậy */}
                <div className="space-y-1.5">
                  <Label htmlFor="wakeTime" className="text-xs font-bold text-muted-foreground uppercase">Giờ thức dậy</Label>
                  <Input
                    id="wakeTime"
                    type="time"
                    value={sleep.wakeTime}
                    onChange={(e) => setSleep((prev) => ({ ...prev, wakeTime: e.target.value }))}
                    className="h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                  />
                </div>

                {/* Số lần thức giấc */}
                <div className="space-y-1.5">
                  <Label htmlFor="awakenings" className="text-xs font-bold text-muted-foreground uppercase">Số lần thức giấc trong đêm</Label>
                  <Input
                    id="awakenings"
                    type="number"
                    min="0"
                    max="30"
                    value={sleep.awakenings}
                    onChange={(e) => setSleep((prev) => ({ ...prev, awakenings: parseInt(e.target.value) || 0 }))}
                    className="h-11 rounded-xl border-border bg-background focus:ring-primary text-sm font-semibold"
                  />
                </div>

                {/* Chất lượng giấc ngủ */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="quality" className="text-xs font-bold text-muted-foreground uppercase">Chất lượng ngủ tự đánh giá</Label>
                    <span className="text-xs font-extrabold text-primary bg-secondary/30 px-2 py-0.5 rounded-md">{sleep.quality} / 10</span>
                  </div>
                  <Input
                    id="quality"
                    type="range"
                    min="1"
                    max="10"
                    value={sleep.quality}
                    onChange={(e) => setSleep((prev) => ({ ...prev, quality: parseInt(e.target.value) }))}
                    className="h-10 cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Tự động tính toán hiển thị */}
              {sleepDurMinutes > 0 && (
                <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-inner">
                  <span className="text-muted-foreground">Tổng thời lượng ngủ thực tế:</span>
                  <span className="text-primary text-sm sm:text-base font-black">
                    {sleepDurHours} tiếng ({sleepDurMinutes} phút)
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-end p-4 border-t border-border/40">
              <Button
                onClick={handleSaveLog}
                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-md w-full sm:w-auto active:scale-98 transition-transform"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Lưu nhật ký giấc ngủ
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB 3: Mood Form */}
        <TabsContent value="mood" className="outline-none">
          <Card className="border-border shadow-sm max-w-2xl bg-card/75 backdrop-blur-sm">
            <CardHeader className="bg-muted/10 border-b border-border/40 p-4 pb-3">
              <CardTitle className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                <MoodIcon className="w-4 h-4 text-primary" /> Cảm xúc & Ghi chú tự do
              </CardTitle>
              <CardDescription className="text-xs">
                Ghi nhận biến động tâm trạng hàng ngày để theo dõi ảnh hưởng của thay đổi nội tiết tố.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Lựa chọn Emoji cảm xúc - Tối ưu 5 cột trên một dòng */}
              <div className="space-y-3">
                <Label className="text-xs sm:text-sm font-bold text-muted-foreground uppercase">Hôm nay chị cảm thấy thế nào?</Label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                  {moodOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = mood.level === opt.level;
                    return (
                      <button
                        key={opt.level}
                        type="button"
                        onClick={() => setMood((prev) => ({ ...prev, level: opt.level }))}
                        className={`flex flex-col items-center justify-center p-1.5 sm:p-3 rounded-xl border transition-all active:scale-95 ${
                          isSelected 
                            ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 font-bold"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <Icon className={`w-5 h-5 sm:w-7 sm:h-7 mb-1 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                        <span className="text-[9px] sm:text-[10px] font-bold tracking-tight text-center truncate w-full">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú & micro */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="note" className="text-xs font-bold text-muted-foreground uppercase">Ghi chú tự do (Nhập hoặc Nói)</Label>
                  
                  {/* Speech to text button */}
                  {browserSupportsSpeech && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleListening}
                      className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${
                        isListening 
                          ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900 animate-pulse" 
                          : "hover:bg-muted text-primary border-border"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" /> Dừng nghe
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" /> Nói tiếng Việt
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <Textarea
                  id="note"
                  placeholder={
                    isListening 
                      ? "Đang lắng nghe giọng nói của chị... Hãy nói rõ ràng." 
                      : "Hôm nay có gì đặc biệt? Chị có triệu chứng nào lạ không? Hãy viết ra đây (hoặc nhấn nút Nói tiếng Việt)."
                  }
                  value={mood.note}
                  onChange={(e) => setMood((prev) => ({ ...prev, note: e.target.value }))}
                  className="min-h-[100px] rounded-xl border-border bg-background focus:ring-primary text-sm sm:text-base leading-relaxed font-semibold p-3"
                  disabled={isListening}
                />
                <p className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold leading-normal flex items-start gap-1 p-1 bg-muted/20 rounded-lg">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>
                    Tính năng giọng nói sử dụng Web Speech API được tối ưu trên Google Chrome & Safari.
                  </span>
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end p-4 border-t border-border/40">
              <Button
                onClick={handleSaveLog}
                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-md w-full sm:w-auto active:scale-98 transition-transform"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Lưu nhật ký cảm xúc
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
