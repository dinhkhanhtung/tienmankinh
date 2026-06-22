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
import { Input } from "@/components/ui/input";
import { Heart, Copy, Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/use-user-store";

interface DonateDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
};

export function DonateDialog({ trigger, open, onOpenChange }: DonateDialogProps) {
  const { profile } = useUserStore();
  const [selectedAmount, setSelectedAmount] = useState<number>(50000); // 50k default
  const [customAmount, setCustomAmount] = useState<string>("200000"); // 200k default custom
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const accountNumber = "0982581222";
  const bankName = "BIDV";

  const tiers = [
    { label: "☕ Cà phê", amount: 20000 },
    { label: "🥤 Trà sữa", amount: 50000 },
    { label: "🍕 Bữa trưa", amount: 100000 },
    { label: "💖 Tùy tâm", amount: 0 },
  ];

  // Tính số tiền thực tế
  const actualAmount = selectedAmount > 0 ? selectedAmount : (Number(customAmount) || 0);

  // Xử lý nội dung chuyển khoản cố định
  const addInfo = "DUY TRI TIEN MAN KINH";

  // Reset status when dialog is closed/opened
  useEffect(() => {
    if (open === false) {
      setStatus("idle");
    }
  }, [open]);

  // VietQR compact format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<ADD_INFO>
  const qrUrl = actualAmount > 0
    ? `https://img.vietqr.io/image/BIDV-${accountNumber}-compact2.png?amount=${actualAmount}&addInfo=${encodeURIComponent(addInfo)}`
    : `https://img.vietqr.io/image/BIDV-${accountNumber}-compact2.png?addInfo=${encodeURIComponent(addInfo)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("Đã sao chép số tài khoản!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!profile) {
      toast.error("Vui lòng đăng nhập để thực hiện xác nhận.");
      return;
    }

    if (actualAmount <= 0) {
      toast.error("Vui lòng chọn hoặc nhập số tiền ủng hộ hợp lệ.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/customer-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: profile.uid,
          displayName: profile.displayName,
          email: profile.email,
          action: "donate",
          amount: actualAmount,
          content: addInfo,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus("success");
        toast.success("Đã gửi thông báo xác nhận! Xin chân thành cảm ơn bạn.");
        
        // Tự động đóng dialog sau 2.5s
        setTimeout(() => {
          if (onOpenChange) {
            onOpenChange(false);
          }
        }, 2500);
      } else {
        throw new Error(result.error || "Gửi yêu cầu thất bại");
      }
    } catch (error: any) {
      console.error("Lỗi gửi xác nhận donate:", error);
      toast.error(error?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
      setStatus("idle");
    }
  };

  const dialogContent = (
    <DialogContent className="max-w-[95%] w-full sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-none border-border bg-card/98 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-2xl animate-in fade-in duration-200">
      <DialogHeader className="text-center flex flex-col items-center gap-1 pb-0.5">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-pink-50 dark:bg-pink-950/20 text-primary flex items-center justify-center shadow-inner animate-pulse">
          <Heart className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 fill-current text-primary" />
        </div>
        <DialogTitle className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-1">
          Đồng hành cùng dự án
        </DialogTitle>
        <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground font-semibold px-2 sm:px-4 text-center leading-relaxed">
          Sự ủng hộ của bạn giúp duy trì ứng dụng Tiền Mãn Kinh hoạt động ổn định và lâu dài.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-2.5 sm:gap-4 py-0 sm:py-1">
        {/* QR Code container */}
        <div className="relative p-2 bg-white rounded-xl shadow-inner border border-border/60 max-w-[150px] sm:max-w-[180px] w-full aspect-square flex items-center justify-center overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Mã QR chuyển khoản ủng hộ ứng dụng"
            className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-102"
          />
        </div>

        {/* Chọn các mức ủng hộ */}
        <div className="w-full space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-center">Gợi ý mức đồng hành</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tiers.map((tier) => (
              <button
                key={tier.amount}
                type="button"
                onClick={() => {
                  setSelectedAmount(tier.amount);
                  if (status === "success") setStatus("idle");
                }}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition-all border flex flex-col items-center justify-center cursor-pointer ${
                  selectedAmount === tier.amount
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.02]"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground hover:scale-[1.01]"
                }`}
              >
                <span>{tier.label}</span>
                {tier.amount > 0 && (
                  <span className="text-[9px] opacity-80 mt-0.5 font-bold">
                    {(tier.amount / 1000)}kđ
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Ô nhập số tiền tùy chỉnh */}
          {selectedAmount === 0 && (
            <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
              <label htmlFor="custom-amount" className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Nhập số tiền ủng hộ (đ)</label>
              <Input
                id="custom-amount"
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  if (status === "success") setStatus("idle");
                }}
                placeholder="Nhập số tiền (ví dụ: 200000)"
                className="h-10 rounded-xl bg-background border-border text-xs font-semibold"
                min="10000"
                step="10000"
              />
            </div>
          )}
        </div>

        {/* Lời nhắn khéo léo */}
        <p className="text-[11px] sm:text-xs text-muted-foreground/90 text-center leading-relaxed font-semibold bg-muted/30 p-2 sm:p-3 rounded-xl border border-border/50">
          Ứng dụng hoạt động phi lợi nhuận. Mọi sự ủng hộ là <span className="font-extrabold text-primary">hoàn toàn tự nguyện</span> nhằm chi trả tiền phí API AI Coach, duy trì máy chủ (hosting) và bảo dưỡng hệ thống.
        </p>

        {/* Thông tin tài khoản */}
        <div className="w-full bg-muted/40 p-2.5 sm:p-3 rounded-xl border border-border/50 space-y-2">
          <div className="flex justify-between items-center text-[11px] sm:text-xs">
            <span className="text-muted-foreground font-semibold">Ngân hàng</span>
            <span className="font-extrabold text-foreground">{bankName}</span>
          </div>
          
          <div className="flex justify-between items-center text-[11px] sm:text-xs">
            <span className="text-muted-foreground font-semibold">Số tài khoản</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-foreground tracking-wider">{accountNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Sao chép số tài khoản"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] sm:text-xs pt-1 border-t border-border/20">
            <span className="text-muted-foreground font-semibold">Nội dung chuyển khoản</span>
            <span className="font-black text-primary tracking-wide text-[11px]">{addInfo}</span>
          </div>
        </div>
      </div>

      {/* Nút thao tác gửi báo cáo Telegram & Notion */}
      <div className="flex flex-col gap-2 pt-1.5 w-full">
        {status === "success" ? (
          <Button
            disabled
            className="w-full h-11 rounded-xl bg-green-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
          >
            <Check className="w-4 h-4" /> Cảm ơn bạn! Xác nhận đã được gửi.
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={status === "submitting" || actualAmount <= 0}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/95 text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:shadow-primary/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi thông báo...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Tôi đã chuyển khoản {actualAmount > 0 ? `${actualAmount.toLocaleString("vi-VN")}đ` : ""}
              </>
            )}
          </Button>
        )}
      </div>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger render={trigger as React.ReactElement} />
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </Dialog>
  );
}
