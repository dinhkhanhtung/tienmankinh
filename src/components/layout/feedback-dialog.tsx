"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/use-user-store";

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const feedbackTypes = [
  { value: "Báo lỗi ứng dụng 🐞", label: "🐞 Báo lỗi ứng dụng" },
  { value: "Đề xuất tính năng mới 💡", label: "💡 Đề xuất tính năng mới" },
  { value: "Trải nghiệm giao diện (UX) 🎨", label: "🎨 Trải nghiệm giao diện (UX)" },
  { value: "Ý kiến đóng góp khác 💬", label: "💬 Ý kiến đóng góp khác" },
];

export function FeedbackDialog({ trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange }: FeedbackDialogProps) {
  const { profile } = useUserStore();
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState(feedbackTypes[0].value);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const isControlled = controlledOpen !== undefined;
  const activeOpen = isControlled ? controlledOpen : open;
  const activeOnOpenChange = (val: boolean) => {
    if (isControlled) {
      controlledOnOpenChange?.(val);
    } else {
      setOpen(val);
    }
  };

  // Reset status và form khi đóng/mở dialog
  useEffect(() => {
    if (!activeOpen) {
      setStatus("idle");
      setContent("");
      setFeedbackType(feedbackTypes[0].value);
    }
  }, [activeOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error("Vui lòng đăng nhập để gửi góp ý.");
      return;
    }

    if (content.trim().length < 10) {
      toast.error("Nội dung góp ý phải có tối thiểu 10 ký tự.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: profile.uid,
          displayName: profile.displayName,
          email: profile.email,
          type: feedbackType,
          content: content.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus("success");
        toast.success("Gửi góp ý thành công! Trân trọng cảm ơn bạn.");
        
        // Tự động đóng dialog sau 2 giây
        setTimeout(() => {
          activeOnOpenChange(false);
        }, 2000);
      } else {
        throw new Error(result.error || "Gửi góp ý thất bại");
      }
    } catch (error: any) {
      console.error("Lỗi gửi góp ý:", error);
      toast.error(error?.message || "Có lỗi xảy ra khi gửi góp ý. Vui lòng thử lại.");
      setStatus("idle");
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-md border-border bg-card/98 backdrop-blur-md p-6 rounded-2xl shadow-2xl animate-in fade-in duration-200">
      <DialogHeader className="text-center flex flex-col items-center gap-1.5 pb-1">
        <div className="w-11 h-11 rounded-full bg-pink-50 dark:bg-pink-950/20 text-primary flex items-center justify-center shadow-inner">
          <MessageSquare className="w-5.5 h-5.5 text-primary" />
        </div>
        <DialogTitle className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-2">
          Góp ý & Phản hồi
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground font-semibold px-4 text-center leading-relaxed">
          Chia sẻ trải nghiệm hoặc thông báo lỗi của bạn để giúp chúng tôi cải thiện ứng dụng tốt hơn.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Phân loại góp ý */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Loại góp ý</Label>
          <Select 
            value={feedbackType} 
            onValueChange={(val) => {
              setFeedbackType(val || feedbackTypes[0].value);
              if (status === "success") setStatus("idle");
            }}
          >
            <SelectTrigger className="w-full h-10 rounded-xl bg-background border-border text-xs font-semibold text-foreground">
              <SelectValue placeholder="Chọn loại góp ý" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border rounded-xl">
              {feedbackTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-xs font-semibold">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nội dung góp ý */}
        <div className="space-y-1.5">
          <Label htmlFor="feedback-content" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nội dung chi tiết</Label>
          <Textarea
            id="feedback-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (status === "success") setStatus("idle");
            }}
            placeholder="Mô tả cụ thể góp ý, lỗi hoặc ý tưởng cải tiến của bạn... (tối thiểu 10 ký tự)"
            className="min-h-[120px] max-h-[200px] rounded-xl bg-background border-border text-xs font-semibold p-3 leading-relaxed focus-visible:ring-primary"
            required
            maxLength={1000}
            disabled={status === "submitting" || status === "success"}
          />
          <div className="text-[10px] text-muted-foreground text-right font-medium">
            {content.length}/1000 ký tự
          </div>
        </div>

        {/* Lời nhắn gửi */}
        <p className="text-[10px] text-muted-foreground/80 leading-normal font-medium italic">
          * Ý kiến của bạn sẽ được gửi trực tiếp đến đội ngũ quản trị qua Telegram và lưu trong hệ thống Notion để theo dõi, xử lý sớm nhất.
        </p>

        {/* Nút gửi */}
        <div className="flex flex-col gap-2 pt-2 w-full">
          {status === "success" ? (
            <Button
              disabled
              className="w-full h-11 rounded-xl bg-green-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-600/25"
            >
              <Check className="w-4 h-4" /> Đã gửi góp ý! Cảm ơn bạn rất nhiều.
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={status === "submitting" || content.trim().length < 10}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/95 text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:shadow-primary/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi ý kiến...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Gửi góp ý phản hồi
                </>
              )}
            </Button>
          )}
          
          <button
            type="button"
            onClick={() => activeOnOpenChange(false)}
            className="text-[10px] text-muted-foreground font-bold hover:text-foreground text-center py-1 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={activeOpen} onOpenChange={activeOnOpenChange}>
        <DialogTrigger render={trigger as React.ReactElement} />
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={activeOpen} onOpenChange={activeOnOpenChange}>
      {dialogContent}
    </Dialog>
  );
}
