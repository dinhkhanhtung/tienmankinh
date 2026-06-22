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

  // Sync local state khi ngày thay đổi hoặc log được lấy
  useEffect(() => {
    const log = getLogForDate(selectedDate);
    setSymptoms(log.symptoms);
    setSleep(log.sleep);
    setMood(log.mood);
  }, [selectedDate, getLogForDate]);

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
    <div className="space-y-6">
      {/* Title & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Nhật ký sức khỏe</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 font-medium">
            Ghi nhận thể trạng hàng ngày để cải thiện sức khỏe tuổi trung niên
          </p>
        </div>
        
        {/* Date input */}
        <div className="flex items-center gap-2 bg-card border border-border p-2 rounded-xl shadow-sm self-start">
          <Calendar className="w-4 h-4 text-primary" />
          <Label htmlFor="log-date" className="sr-only">Chọn ngày ghi nhật ký</Label>
          <Input
            id="log-date"
            type="date"
            max={format(new Date(), "yyyy-MM-dd")}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto font-bold text-sm w-32 cursor-pointer text-foreground"
          />
        </div>
      </div>

      {/* Main Forms Layout */}
      <Tabs defaultValue="symptoms" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md h-12 bg-muted/60 p-1 rounded-xl mb-6">
          <TabsTrigger value="symptoms" className="rounded-lg font-bold text-sm">
            <Flame className="w-4 h-4 mr-1.5" /> Triệu chứng
          </TabsTrigger>
          <TabsTrigger value="sleep" className="rounded-lg font-bold text-sm">
            <Moon className="w-4 h-4 mr-1.5" /> Giấc ngủ
          </TabsTrigger>
          <TabsTrigger value="mood" className="rounded-lg font-bold text-sm">
            <MoodIcon className="w-4 h-4 mr-1.5" /> Tâm trạng
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Symptoms Form */}
        <TabsContent value="symptoms" className="space-y-6 outline-none">
          {symptomGroups.map((group, groupIdx) => (
            <Card key={groupIdx} className="border-border shadow-sm">
              <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold">{group.title}</CardTitle>
                <CardDescription className="text-xs">{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/40">
                {group.items.map((item) => (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
                    <div className="space-y-1 max-w-md">
                      <Label className="text-sm sm:text-base font-bold text-foreground">{item.label}</Label>
                      <p className="text-xs text-muted-foreground leading-normal">{item.desc}</p>
                    </div>

                    {/* Selector thang điểm 0-3 */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      {[0, 1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleSymptomChange(item.key, val)}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl font-bold text-sm border transition-all ${
                            symptoms[item.key] === val
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {val === 0 ? "0" : `+${val}`}
                        </button>
                      ))}
                      <span className="text-[11px] font-semibold text-muted-foreground ml-2">
                        {symptoms[item.key] === 0 ? "Không bị" :
                         symptoms[item.key] === 1 ? "Nhẹ" :
                         symptoms[item.key] === 2 ? "Trung bình" : "Nặng"}
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
              className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-base font-bold flex items-center gap-2 shadow-md w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Lưu nhật ký triệu chứng
            </Button>
          </div>
        </TabsContent>

        {/* TAB 2: Sleep Form */}
        <TabsContent value="sleep" className="outline-none">
          <Card className="border-border shadow-sm max-w-2xl">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Moon className="w-5 h-5 text-primary" /> Thông tin giấc ngủ ban đêm
              </CardTitle>
              <CardDescription className="text-xs">
                Mất ngủ là triệu chứng phổ biến trong thời kỳ tiền mãn kinh. Hãy theo dõi kỹ.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Giờ đi ngủ */}
                <div className="space-y-2">
                  <Label htmlFor="bedTime" className="text-sm font-semibold">Giờ đi ngủ</Label>
                  <Input
                    id="bedTime"
                    type="time"
                    value={sleep.bedTime}
                    onChange={(e) => setSleep((prev) => ({ ...prev, bedTime: e.target.value }))}
                    className="h-12 rounded-xl border-border bg-background focus:ring-primary text-base"
                  />
                </div>

                {/* Giờ thức dậy */}
                <div className="space-y-2">
                  <Label htmlFor="wakeTime" className="text-sm font-semibold">Giờ thức dậy</Label>
                  <Input
                    id="wakeTime"
                    type="time"
                    value={sleep.wakeTime}
                    onChange={(e) => setSleep((prev) => ({ ...prev, wakeTime: e.target.value }))}
                    className="h-12 rounded-xl border-border bg-background focus:ring-primary text-base"
                  />
                </div>

                {/* Số lần thức giấc */}
                <div className="space-y-2">
                  <Label htmlFor="awakenings" className="text-sm font-semibold">Số lần thức giấc trong đêm</Label>
                  <Input
                    id="awakenings"
                    type="number"
                    min="0"
                    max="30"
                    value={sleep.awakenings}
                    onChange={(e) => setSleep((prev) => ({ ...prev, awakenings: parseInt(e.target.value) || 0 }))}
                    className="h-12 rounded-xl border-border bg-background focus:ring-primary text-base"
                  />
                </div>

                {/* Chất lượng giấc ngủ */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="quality" className="text-sm font-semibold">Chất lượng giấc ngủ tự đánh giá</Label>
                    <span className="text-sm font-bold text-primary">{sleep.quality} / 10</span>
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
                <div className="p-4 bg-muted/50 border border-border rounded-xl flex items-center justify-between text-sm font-semibold">
                  <span className="text-muted-foreground">Tổng thời lượng ngủ thực tế:</span>
                  <span className="text-foreground text-base font-black">
                    {sleepDurHours} tiếng ({sleepDurMinutes} phút)
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-end p-6 border-t border-border/40">
              <Button
                onClick={handleSaveLog}
                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-base font-bold flex items-center gap-2 shadow-md w-full sm:w-auto"
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
          <Card className="border-border shadow-sm max-w-2xl">
            <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MoodIcon className="w-5 h-5 text-primary" /> Cảm xúc & Ghi chú tự do
              </CardTitle>
              <CardDescription className="text-xs">
                Tâm trạng thay đổi thất thường là một khía cạnh quan trọng của thay đổi nội tiết tố.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Lựa chọn Emoji cảm xúc */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Hôm nay bạn cảm thấy thế nào?</Label>
                <div className="flex flex-wrap gap-3">
                  {moodOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = mood.level === opt.level;
                    return (
                      <button
                        key={opt.level}
                        type="button"
                        onClick={() => setMood((prev) => ({ ...prev, level: opt.level }))}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all flex-1 min-w-[70px] ${
                          isSelected 
                            ? "bg-primary border-primary text-primary-foreground shadow-md font-bold"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className={`w-7 h-7 mb-1.5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                        <span className="text-[11px] tracking-wide">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú & micro */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="note" className="text-sm font-semibold">Ghi chú tự do (Nhập hoặc Nói)</Label>
                  
                  {/* Speech to text button */}
                  {browserSupportsSpeech && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleListening}
                      className={`h-9 px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold ${
                        isListening 
                          ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900 animate-pulse" 
                          : "hover:bg-muted text-primary"
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
                      ? "Đang lắng nghe giọng nói của bạn... Hãy nói rõ ràng." 
                      : "Hôm nay có gì đặc biệt? Bạn có triệu chứng nào lạ không? Hãy viết ra đây (hoặc nhấn nút Nói tiếng Việt)."
                  }
                  value={mood.note}
                  onChange={(e) => setMood((prev) => ({ ...prev, note: e.target.value }))}
                  className="min-h-[120px] rounded-xl border-border bg-background focus:ring-primary text-base leading-relaxed"
                  disabled={isListening}
                />
                <p className="text-[11px] text-muted-foreground leading-normal flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Tính năng giọng nói sử dụng Web Speech API được tối ưu trên Google Chrome & Safari.
                  </span>
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end p-6 border-t border-border/40">
              <Button
                onClick={handleSaveLog}
                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-base font-bold flex items-center gap-2 shadow-md w-full sm:w-auto"
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
