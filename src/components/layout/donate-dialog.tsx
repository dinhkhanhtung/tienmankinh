"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface DonateDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DonateDialog({ trigger, open, onOpenChange }: DonateDialogProps) {
  const [copied, setCopied] = useState(false);
  const accountNumber = "0982581222";
  const bankName = "BIDV";
  
  // VietQR compact format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?addInfo=<ADD_INFO>
  const qrUrl = `https://img.vietqr.io/image/BIDV-${accountNumber}-compact2.png?addInfo=Duy%20tri%20Tien%20man%20kinh`;

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("Đã sao chép số tài khoản!");
    setTimeout(() => setCopied(false), 2000);
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-md border-border bg-card/98 backdrop-blur-md p-6 rounded-2xl shadow-2xl animate-in fade-in duration-200">
      <DialogHeader className="text-center flex flex-col items-center gap-1.5 pb-2">
        <div className="w-12 h-12 rounded-full bg-pink-50 dark:bg-pink-950/20 text-primary flex items-center justify-center shadow-inner animate-pulse">
          <Heart className="w-6 h-6 fill-current text-primary" />
        </div>
        <DialogTitle className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-2">
          Đồng hành cùng dự án
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground font-semibold px-4 text-center leading-relaxed">
          Sự đồng hành của bạn giúp duy trì ứng dụng Tiền Mãn Kinh hoạt động ổn định và lâu dài.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4 py-2">
        {/* QR Code container */}
        <div className="relative p-3 bg-white rounded-2xl shadow-inner border border-border/60 max-w-[200px] w-full aspect-square flex items-center justify-center overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Mã QR chuyển khoản ủng hộ ứng dụng"
            className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-102"
          />
        </div>

        {/* Lời nhắn khéo léo */}
        <p className="text-xs text-muted-foreground/90 text-center leading-relaxed font-medium bg-muted/30 p-3.5 rounded-xl border border-border/50">
          Ứng dụng được xây dựng hoàn toàn phi lợi nhuận. Mọi sự ủng hộ là <span className="font-extrabold text-primary">hoàn toàn tự nguyện</span> nhằm trang trải chi phí máy chủ (hosting), duy trì khóa API trí tuệ nhân tạo và bảo trì hệ thống.
        </p>

        {/* Thông tin tài khoản */}
        <div className="w-full bg-muted/40 p-4 rounded-xl border border-border/50 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-semibold">Ngân hàng</span>
            <span className="font-extrabold text-foreground">{bankName}</span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-semibold">Số tài khoản</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-foreground tracking-wider">{accountNumber}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Sao chép số tài khoản"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          onClick={() => {
            if (onOpenChange) onOpenChange(false);
          }}
          className="h-10 rounded-xl px-6 bg-gradient-to-r from-primary to-primary/95 text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:shadow-primary/35 transition-all"
        >
          Cảm ơn bạn rất nhiều!
        </Button>
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
