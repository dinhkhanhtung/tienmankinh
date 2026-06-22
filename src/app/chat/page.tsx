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
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" /> Trò chuyện cùng AI Coach
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
          Tư vấn cá nhân hóa dựa trên dữ liệu nhật ký sức khỏe 7 ngày qua của chị
        </p>
      </div>

      {/* Main Chat Box */}
      <Card className="flex-1 flex flex-col border-border shadow-sm overflow-hidden bg-card rounded-2xl">
        {/* Chat window Header */}
        <CardHeader className="bg-muted/10 border-b border-border/40 py-3.5 px-4 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Bác sĩ ảo Coach</CardTitle>
              <CardDescription className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-ping"></span> Hoạt động trực tuyến
              </CardDescription>
            </div>
          </div>
          
          <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-bold">
            Gemini 1.5 Flash
          </span>
        </CardHeader>

        {/* Message Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gradient-to-b from-card to-background/30">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                      : "bg-secondary/40 text-foreground dark:bg-secondary/20 rounded-tl-none border border-border/50"
                  }`}
                >
                  {/* Nội dung tin nhắn (hỗ trợ phân dòng cơ bản) */}
                  <div className="whitespace-pre-line font-medium">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* AI is thinking bubble */}
          {sending && (
            <div className="flex w-full justify-start">
              <div className="bg-secondary/30 dark:bg-secondary/10 rounded-2xl rounded-tl-none p-3.5 border border-border/30 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-semibold">AI Coach đang suy nghĩ và phân tích...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Chat Box Footer & Form */}
        <CardFooter className="flex flex-col border-t border-border/40 p-4 gap-3 bg-muted/5 shrink-0">
          
          {/* Quick Questions suggestions (Chỉ hiển thị khi chưa chat quá nhiều) */}
          {messages.length <= 2 && !sending && (
            <div className="w-full">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" /> Gợi ý câu hỏi nhanh:
              </p>
              <div className="flex flex-col gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="text-left text-xs text-primary font-bold bg-secondary/30 dark:bg-secondary/15 hover:bg-secondary/60 px-3 py-2 rounded-xl transition-all border border-primary/10 truncate"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medical disclaimer note */}
          <div className="w-full flex items-start gap-1.5 text-[10px] leading-normal text-muted-foreground p-2 bg-muted/40 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
            <span>
              Lưu ý: Lời khuyên của AI Coach chỉ mang tính tham khảo cải thiện sức khỏe lối sống, không thay thế chẩn đoán y khoa từ bác sĩ.
            </span>
          </div>

          {/* Chat Form Input */}
          <form onSubmit={handleFormSubmit} className="flex w-full items-center gap-2">
            <Input
              placeholder="Nhập câu hỏi của chị về sức khỏe..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-12 rounded-xl border-border bg-background focus:ring-primary text-base"
              disabled={sending}
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm transition-colors"
              disabled={!input.trim() || sending}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
