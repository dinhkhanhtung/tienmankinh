"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  MessageCircle, Send, Heart, Sparkles, Loader2, 
  HelpCircle, AlertTriangle, ArrowDown 
} from "lucide-react";
import { ChatMessage } from "@/types";
import { toast } from "sonner";

export default function ChatPage() {
  const { user } = useAuthStore();
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Các câu hỏi gợi ý nhanh
  const quickQuestions = [
    "Làm sao để giảm cơn bốc hỏa đột ngột?",
    "Mẹo để dễ đi vào giấc ngủ hơn vào ban đêm?",
    "Dinh dưỡng thế nào để hạn chế tăng cân tuổi trung niên?",
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || !user || sending) return;

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
        throw new Error(data.error || "Gặp lỗi khi kết nối với AI.");
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
    <div className="flex flex-col h-[calc(100dvh-9.5rem)] md:h-[calc(100vh-7rem)] max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5 sm:w-6 h-6 text-primary" /> Trò chuyện cùng AI Coach
        </h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-semibold">
          Tư vấn cá nhân hóa dựa trên dữ liệu nhật ký sức khỏe 7 ngày qua của chị
        </p>
      </div>

      {/* Main Chat Box */}
      <Card className="flex-1 flex flex-col border-border shadow-sm overflow-hidden bg-card/75 backdrop-blur-sm rounded-2xl min-h-0">
        {/* Chat window Header */}
        <CardHeader className="bg-muted/10 border-b border-border/40 py-2.5 px-4 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary text-primary flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <CardTitle className="text-xs sm:text-sm font-extrabold text-foreground">Bác sĩ ảo Coach</CardTitle>
              <CardDescription className="text-[9px] text-green-500 font-bold flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-500 inline-block animate-pulse"></span> Hoạt động trực tuyến
              </CardDescription>
            </div>
          </div>
          
          <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full font-bold">
            Gemini 1.5 Flash
          </span>
        </CardHeader>

        {/* Message Area */}
        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4.5 min-h-0 bg-gradient-to-b from-card to-background/10">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex w-full gap-2.5 items-start ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center font-bold shadow-sm shrink-0 border border-primary/10">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed font-semibold ${
                    isUser
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm shadow-md shadow-primary/10"
                      : "bg-[#FFF9FC] dark:bg-[#281822] text-[#3D2232] dark:text-[#FFF0F6] rounded-tl-sm border border-border/40 shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI is thinking bubble */}
          {sending && (
            <div className="flex w-full gap-2.5 items-start justify-start">
              <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center font-bold shadow-sm shrink-0 border border-primary/10 animate-pulse">
                <Sparkles className="w-4 h-4 fill-current animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="bg-card dark:bg-secondary/10 rounded-2xl rounded-tl-sm p-3.5 border border-border/30 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-[10px] text-muted-foreground font-semibold">AI Coach đang phân tích sức khỏe của chị...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Chat Box Footer & Form */}
        <CardFooter className="flex flex-col border-t border-border/40 p-3 sm:p-4 gap-3 bg-muted/5 shrink-0">
          
          {/* Quick Questions suggestions - Cuộn ngang trên di động cực kỳ mượt mà */}
          {messages.length <= 2 && !sending && (
            <div className="w-full">
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-extrabold uppercase tracking-wider mb-2">
                <HelpCircle className="w-3 h-3 text-primary" /> Gợi ý câu hỏi nhanh:
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 scrollbar-none snap-x snap-mandatory">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="text-left text-[11px] text-primary font-bold bg-primary/5 hover:bg-primary/10 border border-primary/15 px-3.5 py-2 rounded-full transition-all shrink-0 snap-start max-w-[240px] truncate shadow-sm active:scale-95"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medical disclaimer note */}
          <div className="w-full flex items-start gap-1.5 text-[9px] leading-relaxed text-muted-foreground bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-500/10">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
            <span>
              Lưu ý: Lời khuyên của AI Coach chỉ mang tính tham khảo cải thiện lối sống, không thay thế chẩn đoán y khoa.
            </span>
          </div>

          {/* Chat Form Input */}
          <form onSubmit={handleFormSubmit} className="flex w-full items-center gap-2 pt-1">
            <Input
              placeholder="Nhập câu hỏi của chị..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-12 rounded-full border-border bg-background focus:ring-primary text-sm font-semibold pl-5 pr-3 shadow-inner"
              disabled={sending}
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/15 active:scale-90 transition-all shrink-0"
              disabled={!input.trim() || sending}
            >
              <Send className="w-4.5 h-4.5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
