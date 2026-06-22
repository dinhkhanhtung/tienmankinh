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
  const [copied, setCopied] = useState(false);
  const accountNumber = "0982581222";
  const bankName = "BIDV";

  const tiers = [
    { label: "☕ Cà phê", amount: 20000 },
    { label: "🥤 Trà sữa", amount: 50000 },
    { label: "🍕 Bữa trưa", amount: 100000 },
    { label: "💖 Tùy tâm", amount: 0 },
  ];

  // Xử lý nội dung chuyển khoản: TMK <TEN_KHONG_DAU> <SO_TIEN>
  const displayName = profile?.displayName || "Thanh vien";
  const cleanName = removeVietnameseTones(displayName)
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const amountSuffix = selectedAmount > 0 ? ` ${selectedAmount / 1000}K` : "";
  const rawInfo = `TMK ${cleanName}${amountSuffix}`;
  const addInfo = rawInfo.substring(0, 25); // Limit to 25 chars for safety

  // VietQR compact format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-compact2.png?amount=<AMOUNT>&addInfo=<ADD_INFO>
  const qrUrl = selectedAmount > 0
    ? `https://img.vietqr.io/image/BIDV-${accountNumber}-compact2.png?amount=${selectedAmount}&addInfo=${encodeURIComponent(addInfo)}`
    : `https://img.vietqr.io/image/BIDV-${accountNumber}-compact2.png?addInfo=${encodeURIComponent(addInfo)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    toast.success("Đã sao chép số tài khoản!");
    setTimeout(() => setCopied(false), 2000);
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-md border-border bg-card/98 backdrop-blur-md p-6 rounded-2xl shadow-2xl animate-in fade-in duration-200">
      <DialogHeader className="text-center flex flex-col items-center gap-1.5 pb-1">
        <div className="w-11 h-11 rounded-full bg-pink-50 dark:bg-pink-950/20 text-primary flex items-center justify-center shadow-inner animate-pulse">
          <Heart className="w-5.5 h-5.5 fill-current text-primary" />
        </div>
        <DialogTitle className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-2">
          Đồng hành cùng dự án
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground font-semibold px-4 text-center leading-relaxed">
          Sự ủng hộ của bạn giúp duy trì ứng dụng Tiền Mãn Kinh hoạt động ổn định và lâu dài.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4 py-2">
        {/* QR Code container */}
        <div className="relative p-2.5 bg-white rounded-2xl shadow-inner border border-border/60 max-w-[170px] w-full aspect-square flex items-center justify-center overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Mã QR chuyển khoản ủng hộ ứng dụng"
            className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-102"
          />
        </div>

        {/* Chọn các mức ủng hộ */}
        <div className="w-full space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-center">Gợi ý mức đồng hành</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tiers.map((tier) => (
              <button
                key={tier.amount}
                type="button"
                onClick={() => setSelectedAmount(tier.amount)}
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
        </div>

        {/* Lời nhắn khéo léo */}
        <p className="text-xs text-muted-foreground/90 text-center leading-relaxed font-semibold bg-muted/30 p-3 rounded-xl border border-border/50">
          Ứng dụng hoạt động phi lợi nhuận. Mọi sự ủng hộ là <span className="font-extrabold text-primary">hoàn toàn tự nguyện</span> nhằm chi trả tiền phí API AI Coach, duy trì máy chủ (hosting) và bảo dưỡng hệ thống.
        </p>

        {/* Thông tin tài khoản */}
        <div className="w-full bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-2.5">
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
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Sao chép số tài khoản"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-border/20">
            <span className="text-muted-foreground font-semibold">Nội dung chuyển khoản</span>
            <span className="font-black text-primary tracking-wide text-[11px]">{addInfo}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-1">
        <Button
          onClick={() => {
            if (onOpenChange) onOpenChange(false);
          }}
          className="h-10 rounded-xl px-6 bg-gradient-to-r from-primary to-primary/95 text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:shadow-primary/35 transition-all cursor-pointer"
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

