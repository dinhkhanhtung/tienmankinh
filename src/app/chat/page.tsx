"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useUserStore } from "@/store/use-user-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  MessageCircle, Send, Heart, Sparkles, 
  HelpCircle, AlertTriangle, ArrowDown, Mic, MicOff, CheckSquare, Leaf
} from "lucide-react";
import { ChatMessage } from "@/types";
import { toast } from "sonner";
import { useSpeech } from "@/hooks/use-speech";

export default function ChatPage() {
  const { user } = useAuthStore();
  const { profile, updateProfile } = useUserStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Chào chị! Em là AI Coach đồng hành sức khỏe của chị. Dựa trên thông tin cơ thể và các triệu chứng chị ghi nhận trong tuần qua, em có thể đưa ra các lời khuyên hữu ích về lối sống, giấc ngủ và chế độ dinh dưỡng lành mạnh. Chị cần em hỗ trợ vấn đề gì hôm nay ạ?",
      createdAt: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Thiết lập Voice Recognition cho chat input
  const handleTranscript = React.useCallback((text: string) => {
    setInput((prev) => prev ? `${prev} ${text}` : text);
    toast.success("Đã nhận giọng nói của chị.");
  }, []);

  const { isListening, browserSupportsSpeech, startListening, stopListening } = useSpeech(handleTranscript);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      toast.info("Đang lắng nghe... Chị hãy nói vào micro.");
    }
  };

  // Giới hạn lượt chat trong ngày theo múi giờ Việt Nam
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const CHAT_LIMIT = 10;
  const isToday = profile?.lastChatDate === today;
  const chatCount = isToday ? (profile?.todayChatCount || 0) : 0;
  const remainingChats = Math.max(0, CHAT_LIMIT - chatCount);
  const isLimitReached = remainingChats <= 0;

  // Tự động cuộn xuống cuối
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      const { scrollHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior,
      });
    }
  };

  // Lắng nghe sự kiện scroll để hiển thị nút cuộn xuống cuối
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 200) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  // Cuộn xuống khi có tin nhắn mới hoặc khi gửi tin nhắn
  useEffect(() => {
    scrollToBottom(messages.length === 1 ? "auto" : "smooth");
  }, [messages, sending]);

  // Các câu hỏi gợi ý nhanh kèm icon
  const quickQuestions = [
    { text: "Bốc hỏa là gì?", icon: HelpCircle },
    { text: "Mẹo ngủ ngon", icon: CheckSquare },
    { text: "Thực phẩm nên ăn", icon: Leaf },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !user || sending) return;

    if (isLimitReached) {
      toast.error("Chị đã dùng hết số lượt tư vấn hôm nay. Hẹn gặp lại chị vào ngày mai nhé!");
      return;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const chatHistory = [...messages, userMessage].map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content
      }));

      // Gọi API Endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: chatHistory,
          userId: user.uid,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === "LIMIT_REACHED") {
          // Đồng bộ state để disable nút chat ngay lập tức
          updateProfile({
            todayChatCount: CHAT_LIMIT,
            lastChatDate: today
          });

          const aiMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            content: data.reply || "Hôm nay chị đã sử dụng hết lượt tư vấn rồi. Hãy nghỉ ngơi và ngày mai quay lại chia sẻ tiếp cùng em nhé!",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          return;
        }
        throw new Error(data.error || "Gặp lỗi khi kết nối với AI.");
      }

      // Cập nhật local store profile để đồng bộ lượt dùng mới nhất
      if (data.todayChatCount !== undefined) {
        updateProfile({
          todayChatCount: data.todayChatCount,
          lastChatDate: data.lastChatDate || today
        });
      }

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Lỗi gửi tin nhắn: ", error);
      toast.error(error.message || "Không thể nhận phản hồi từ AI Coach. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-9.5rem)] md:h-[calc(100vh-7rem)] max-w-5xl mx-auto space-y-4 page-transition">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <MessageCircle className="w-5 h-5 sm:w-6 h-6 text-primary animate-pulse" /> AI Coach
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-bold">
            Trợ lý sức khỏe
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center shadow-inner border border-primary/10">
          <Heart className="w-4.5 h-4.5 fill-current" />
        </div>
      </div>

      {/* Main Chat Box */}
      <Card className="flex-1 flex flex-col border-border/80 shadow-md overflow-hidden bg-card/85 backdrop-blur-md rounded-3xl min-h-0 glass-card">
        {/* Chat window Header */}
        <CardHeader className="bg-muted/5 border-b border-border/40 py-2.5 px-4 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center font-bold shadow-inner border border-primary/10">
              <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-xs sm:text-sm font-extrabold text-foreground tracking-wide">AI Coach Sức Khỏe</CardTitle>
              <CardDescription className="text-[9px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 inline-block animate-ping"></span> Hoạt động trực tuyến
              </CardDescription>
            </div>
          </div>
          
          <div className="flex gap-1.5 items-center">
            <span className={`text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full font-black border ${isLimitReached ? "text-destructive bg-destructive/5 border-destructive/15" : "text-amber-600 bg-amber-500/5 border-amber-500/15"}`}>
              Còn {remainingChats}/{CHAT_LIMIT} lượt hôm nay
            </span>
          </div>
        </CardHeader>

        {/* Message Area */}
        <div className="flex-1 relative min-h-0 flex flex-col">
          <CardContent 
            ref={scrollContainerRef} 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5 min-h-0 bg-gradient-to-b from-card to-background/5 scrollbar-none"
          >
            {/* 1. Greeting Card của Coach ở trên cùng của vùng chat */}
            <div className="relative overflow-hidden rounded-2xl bg-secondary/30 border border-secondary/60 p-4.5 flex items-center gap-4 animate-in fade-in duration-300">
              {/* Hình avatar AI Coach xinh đẹp vẽ bằng SVG */}
              <div className="w-12 h-12 rounded-full bg-background border border-primary/20 shrink-0 overflow-hidden relative shadow-inner">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-primary">
                  <circle cx="50" cy="50" r="50" className="text-secondary/70 fill-current" />
                  <circle cx="50" cy="35" r="16" />
                  <path d="M50,55 C35,55 25,65 25,75 L75,75 C75,65 65,55 50,55 Z" />
                  <path d="M42 35 C42 35 45 42 50 42 C55 42 58 35 58 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </div>
              <div className="space-y-1 text-left flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-foreground">Xin chào, {profile?.displayName || "Lan"}! 👋</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold leading-relaxed">
                  Tôi là AI Coach, luôn sẵn sàng lắng nghe và đồng hành cùng bạn trên hành trình chăm sóc sức khỏe. ❤️
                </p>
              </div>
            </div>

            {messages.map((msg) => {
              const isUser = msg.role === "user";
              
              // Nếu là tin nhắn chào mừng mặc định, ta ẩn đi vì đã có Greeting Card ở trên cực kỳ đẹp mắt rồi
              if (msg.id === "welcome") return null;

              return (
                <div
                  key={msg.id}
                  className={`flex w-full gap-2.5 items-start ${isUser ? "justify-end animate-in slide-in-from-right-3 duration-250" : "justify-start animate-in slide-in-from-left-3 duration-250"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center font-bold shadow-sm shrink-0 border border-primary/10 overflow-hidden">
                      <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                        <circle cx="50" cy="50" r="50" className="text-secondary/80 fill-current" />
                        <circle cx="50" cy="35" r="16" className="text-primary" />
                        <path d="M50,55 C35,55 25,65 25,75 L75,75 C75,65 65,55 50,55 Z" className="text-primary" />
                      </svg>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed font-semibold shadow-sm transition-all duration-200 ${
                      isUser
                        ? "bg-[#F8D7E6] text-[#7A4E6D] rounded-tr-none border border-[#F1DDE7] shadow-sm shadow-primary/5"
                        : "bg-card text-foreground rounded-tl-none border border-border/80 hover:shadow-md"
                    }`}
                  >
                    {/* Render format đặc biệt cho Coach messages để hiển thị bullet point đẹp dạng ô tròn chứa icon */}
                    {!isUser ? (
                      <div className="space-y-3">
                        {/* Tách phần text mở đầu và phần list */}
                        {msg.content.split("\n").map((line, lineIdx) => {
                          const trimLine = line.trim();
                          
                          // Nhận diện dòng chứa icon như 🌙, ☕, 🧘, 🌸
                          const hasEmojiBullet = /^(🌙|☕|🧘|🌸|💡|👉|🌱|🥦)/.test(trimLine);
                          
                          if (hasEmojiBullet) {
                            const emoji = trimLine.charAt(0);
                            const text = trimLine.substring(1).trim();
                            return (
                              <div key={lineIdx} className="flex items-start gap-3 mt-1.5">
                                <div className="w-6 h-6 rounded-full bg-secondary/50 text-primary flex items-center justify-center shrink-0 font-bold text-xs select-none">
                                  {emoji}
                                </div>
                                <span className="flex-1 mt-0.5">{text}</span>
                              </div>
                            );
                          }
                          
                          return (
                            <p key={lineIdx} className="whitespace-pre-line leading-relaxed">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="whitespace-pre-line">
                        {msg.content}
                      </div>
                    )}

                    {/* Hiển thị thời gian và tick cho tin nhắn của User */}
                    {isUser && (
                      <div className="text-[8px] text-right mt-1.5 opacity-60 font-bold flex items-center justify-end gap-1 select-none">
                        <span>09:30</span>
                        <span>✓✓</span>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shadow-sm shrink-0 border border-primary/10 font-black text-xs">
                      {profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI is thinking bubble (Typing Indicator) */}
            {sending && (
              <div className="flex w-full gap-2.5 items-start justify-start animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center font-bold shadow-sm shrink-0 border border-primary/10 overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                    <circle cx="50" cy="50" r="50" className="text-secondary/80 fill-current" />
                    <circle cx="50" cy="35" r="16" className="text-primary" />
                    <path d="M50,55 C35,55 25,65 25,75 L75,75 C75,65 65,55 50,55 Z" className="text-primary" />
                  </svg>
                </div>
                <div className="bg-card rounded-2xl rounded-tl-none px-4 py-3 border border-border/80 flex items-center gap-1.5 shadow-sm min-w-[64px] h-[38px] justify-center">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
          </CardContent>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <Button
              type="button"
              size="icon"
              onClick={() => scrollToBottom("smooth")}
              className="absolute bottom-4 right-4 h-9.5 w-9.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/95 border border-primary/20 active:scale-90 transition-all z-20 animate-bounce"
            >
              <ArrowDown className="w-4.5 h-4.5" />
            </Button>
          )}
        </div>

        {/* Chat Box Footer & Form */}
        <CardFooter className="flex flex-col border-t border-border/40 p-3 sm:p-4 gap-3 bg-muted/5 shrink-0">
          
          {/* Quick Questions suggestions - 3 nút gợi ý ngang trực quan chuẩn mockup */}
          {!sending && !isLimitReached && (
            <div className="w-full">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none snap-x snap-mandatory">
                {quickQuestions.map((q, idx) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q.text)}
                      className="text-left text-[11px] text-[#7A4E6D] font-bold bg-[#FFF9FC] hover:bg-muted/70 border border-border/70 px-4.5 py-2.5 rounded-2xl transition-all shrink-0 snap-start flex items-center gap-1.5 shadow-sm active:scale-95 duration-150 cursor-pointer"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <Icon className="w-4 h-4 text-primary shrink-0" />
                      {q.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medical disclaimer note hoặc Thông báo hết lượt */}
          {isLimitReached ? (
            <div className="w-full flex items-start gap-2.5 text-[10px] sm:text-xs leading-relaxed text-amber-700 bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-2xl border border-amber-500/15 shadow-sm animate-in fade-in duration-300">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500 mt-0.5 animate-pulse" />
              <span className="font-extrabold">
                Thông báo: Hôm nay chị đã sử dụng hết 10 lượt tư vấn rồi. AI Coach chúc chị một ngày thật nhiều sức khỏe và bình an, hẹn gặp lại chị vào ngày mai nhé!
              </span>
            </div>
          ) : (
            <div className="w-full flex items-start gap-2 text-[9px] leading-relaxed text-muted-foreground bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-500/10 select-none">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
              <span className="font-semibold">
                Lưu ý: Lời khuyên của AI Coach chỉ mang tính tham khảo cải thiện lối sống, không thay thế chẩn đoán y khoa từ bác sĩ chuyên môn.
              </span>
            </div>
          )}

          {/* Chat Form Input */}
          <form onSubmit={handleFormSubmit} className="flex w-full items-center gap-2 pt-1">
            <Input
              placeholder={isLimitReached ? "Hôm nay chị đã hết lượt tư vấn..." : "Bạn đang cảm thấy thế nào?"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-12 rounded-full border-border bg-background focus-visible:ring-primary text-sm font-semibold pl-5 pr-3 shadow-inner placeholder:text-muted-foreground/50 focus:border-primary/55 disabled:opacity-70"
              disabled={sending || isLimitReached}
              maxLength={500}
            />
            
            {/* Voice Input to chat input (nút Micro hồng to tròn chuẩn mockup) */}
            {browserSupportsSpeech && !isLimitReached && (
              <button
                type="button"
                onClick={toggleListening}
                className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all active:scale-90 relative ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-primary text-primary-foreground hover:bg-primary/95"
                }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
                title="Nói tiếng Việt"
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                {/* Ripple wave animations khi đang nghe */}
                {isListening && (
                  <>
                    <div className="voice-wave voice-wave-1"></div>
                    <div className="voice-wave voice-wave-2"></div>
                  </>
                )}
              </button>
            )}

            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 rounded-full bg-secondary/80 text-primary hover:bg-secondary shadow-md active:scale-90 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              disabled={!input.trim() || sending || isLimitReached}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
