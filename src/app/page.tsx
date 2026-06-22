"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/use-auth-store";
import { useUserStore } from "@/store/use-user-store";
import { 
  Loader2, 
  Heart, 
  CalendarDays, 
  Mic, 
  MessageSquareCode, 
  FileText, 
  ShieldCheck, 
  ChevronRight, 
  Sparkles, 
  Moon, 
  Sun, 
  HelpCircle,
  ChevronDown
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const { profile, theme, setTheme } = useUserStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (profile?.isOnboarded) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    }
  }, [user, loading, profile, router]);

  // Toggle FAQ Accordion
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Nếu đang load auth hoặc người dùng đã đăng nhập (đang trong quá trình định tuyến), hiển thị màn hình loading
  if (loading || user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-6 min-h-screen text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <h2 className="text-lg font-bold">Tiền Mãn Kinh</h2>
          <p className="text-sm text-muted-foreground">Đang định tuyến an toàn...</p>
        </div>
      </div>
    );
  }

  // Danh sách các tính năng nổi bật
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      title: "Chỉ số PeriScore",
      desc: "Chỉ số độc quyền đánh giá mức độ ổn định nội tiết tố và sức khỏe tổng quát của bạn mỗi ngày, giúp chủ động phòng tránh rủi ro."
    },
    {
      icon: <Mic className="w-6 h-6 text-primary animate-pulse" />,
      title: "Nhật ký rảnh tay (Voice-to-Text)",
      desc: "Đặc biệt tối ưu cho phụ nữ trung niên. Bạn chỉ cần nhấn nút và nói tiếng Việt, ứng dụng tự động nhận diện và ghi chép triệu chứng."
    },
    {
      icon: <MessageSquareCode className="w-6 h-6 text-primary" />,
      title: "Trợ lý AI Coach 24/7",
      desc: "Lắng nghe ân cần, giải đáp thắc mắc sức khỏe và đưa ra lời khuyên dinh dưỡng, luyện tập tự nhiên dựa trên dữ liệu triệu chứng của riêng bạn."
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-primary" />,
      title: "Lịch theo dõi thông minh",
      desc: "Dự báo chu kỳ tiếp theo chính xác nhờ AI, cảnh báo ngay lập tức nếu phát hiện các chu kỳ bất thường để kịp thời đi khám."
    },
    {
      icon: <FileText className="w-6 h-6 text-primary" />,
      title: "Báo cáo Y khoa PDF",
      desc: "Tổng hợp biểu đồ xu hướng triệu chứng, chất lượng giấc ngủ trong 3, 6, 12 tháng rõ ràng. Dễ dàng in ấn hoặc lưu PDF mang theo gặp bác sĩ."
    }
  ];

  // Danh sách các câu hỏi thường gặp FAQ
  const faqs = [
    {
      q: "Ứng dụng Tiền Mãn Kinh có thu phí hay không?",
      a: "Hoàn toàn MIỄN PHÍ. Ứng dụng được xây dựng vì cộng đồng phụ nữ Việt Nam. Chúng tôi duy trì hoạt động thông qua sự ủng hộ tự nguyện từ người dùng nếu họ thấy ứng dụng thực sự hữu ích."
    },
    {
      q: "Dữ liệu sức khỏe cá nhân của tôi có được bảo mật không?",
      a: "Tuyệt đối bảo mật. Mọi thông tin triệu chứng, tâm trạng và nhật ký của bạn đều được mã hóa và lưu trữ an toàn trên nền tảng đám mây. Chúng tôi cam kết không chia sẻ dữ liệu y tế này với bất kỳ bên thứ ba nào."
    },
    {
      q: "Lời khuyên của AI Coach có thay thế được bác sĩ không?",
      a: "Không. Các tư vấn từ trợ lý AI Coach tập trung vào chăm sóc sức khỏe chủ động, cải thiện lối sống, chế độ dinh dưỡng và các bài tập luyện tự nhiên. Khi có dấu hiệu bệnh lý nghiêm trọng, bạn nên mang Báo cáo Y khoa từ ứng dụng đi khám tại các cơ sở chuyên khoa."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-secondary/80 text-primary flex items-center justify-center shadow-inner">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tiền Mãn Kinh
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
          
          <Link
            href="/login"
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-foreground border border-primary/30 px-3.5 py-1.5 rounded-xl hover:bg-primary transition-all duration-300"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        {/* Trang trí nền mờ ảo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-primary/10 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[200px] h-[200px] rounded-full bg-secondary/20 blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Giải pháp chăm sóc sức khỏe phụ nữ tuổi 40+</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto mb-6 bg-gradient-to-br from-foreground via-foreground to-accent/90 bg-clip-text text-transparent">
          Đồng hành cùng sức khỏe & sự an tâm của bạn
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Ứng dụng thiết kế riêng cho phụ nữ bước vào giai đoạn tiền mãn kinh. 
          Giúp bạn dễ dàng theo dõi chu kỳ, ghi chép triệu chứng bằng giọng nói, 
          và nhận tư vấn lối sống khoa học từ trợ lý sức khỏe AI thông minh.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm sm:text-base shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02] active:scale-98 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            Bắt đầu trải nghiệm ngay
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-card border border-border/80 text-muted-foreground hover:text-foreground font-bold text-sm sm:text-base hover:bg-muted/30 active:scale-98 transition-all duration-300"
          >
            Tìm hiểu tính năng
          </a>
        </div>
      </section>

      {/* 3. SYMPATHY SECTION (ĐỒNG CẢM) */}
      <section className="bg-muted/40 py-16 px-4 sm:px-6 lg:px-8 border-y border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-black mb-3">Bạn có đang gặp những thay đổi này?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Tuổi tiền mãn kinh mang đến những biến đổi nội tiết tố tự nhiên nhưng vô cùng nhạy cảm:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-2xl border border-border/50 text-center shadow-sm">
              <span className="text-3xl mb-3 block">🥵</span>
              <h3 className="font-bold text-sm sm:text-base mb-2">Bốc hỏa & Đổ mồ hôi</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Những cơn nóng đột ngột xuất hiện ở mặt, cổ và ngực kèm theo đổ mồ hôi ban đêm gây khó chịu.</p>
            </div>
            
            <div className="bg-card p-6 rounded-2xl border border-border/50 text-center shadow-sm">
              <span className="text-3xl mb-3 block">😴</span>
              <h3 className="font-bold text-sm sm:text-base mb-2">Mất ngủ & Mệt mỏi</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Trằn trọc khó vào giấc, dễ tỉnh giấc giữa đêm và cảm thấy uể oải, thiếu năng lượng vào hôm sau.</p>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border/50 text-center shadow-sm">
              <span className="text-3xl mb-3 block">🥀</span>
              <h3 className="font-bold text-sm sm:text-base mb-2">Tâm lý thay đổi</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">Cảm giác lo âu bồn chồn xuất hiện thường xuyên hơn, dễ cáu gắt hoặc đột ngột sụt sùi buồn bã.</p>
            </div>
          </div>

          <div className="mt-10 text-center bg-primary/5 p-5 rounded-2xl border border-dashed border-primary/20 max-w-2xl mx-auto">
            <p className="text-xs sm:text-sm font-bold text-primary leading-relaxed">
              👉 Đừng quá lo lắng! Mọi triệu chứng này đều có thể được theo dõi và cải thiện thông qua việc thay đổi lối sống lành mạnh cùng sự đồng hành của ứng dụng.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Ứng dụng mang lại những gì cho bạn?</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">Tập hợp các công cụ khoa học thông minh được thiết kế tối giản, trực quan và dễ sử dụng nhất.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Cột trái: Danh sách tính năng */}
          <div className="flex flex-col gap-5">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="glass-card p-6 rounded-2xl border border-border/50 flex gap-4 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] pulse-glow"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 shadow-inner">
                  {feat.icon}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Cột phải: Khối đồ họa minh họa ứng dụng */}
          <div className="hidden md:flex flex-col justify-center items-center relative p-8 bg-gradient-to-tr from-secondary/15 to-primary/5 rounded-3xl border border-border/30 overflow-hidden min-h-[500px]">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            
            {/* Giả lập giao diện Mobile App bên trong */}
            <div className="w-[280px] h-[480px] bg-card border-[6px] border-accent/20 rounded-[36px] shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Tai thỏ camera giả lập */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-accent/20 rounded-full z-10" />
              
              {/* App Content */}
              <div className="flex-1 flex flex-col p-4 pt-8 bg-background">
                {/* Header giả lập */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-primary fill-current" />
                    <span className="text-[10px] font-black">Sức Khỏe Hôm Nay</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-secondary text-[8px] font-bold text-primary flex items-center justify-center">TMK</div>
                </div>

                {/* Điểm PeriScore giả lập */}
                <div className="bg-gradient-to-br from-secondary/80 to-primary/10 rounded-2xl p-3 text-center mb-4 border border-primary/10 relative overflow-hidden">
                  <p className="text-[8px] font-bold text-muted-foreground">Chỉ số sức khỏe PeriScore</p>
                  <h4 className="text-2xl font-black text-primary my-1">82<span className="text-[10px] font-bold text-muted-foreground">/100</span></h4>
                  <span className="text-[7px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Trạng thái: Rất Tốt</span>
                </div>

                {/* AI Coach Chat giả lập */}
                <div className="flex-1 flex flex-col gap-2 overflow-hidden justify-end mb-2">
                  <div className="bg-muted text-[8px] p-2 rounded-xl rounded-tl-none self-start max-w-[85%] leading-normal border border-border/30">
                    Chào cô, dữ liệu 7 ngày qua cho thấy cô có hơi mất ngủ nhẹ. Cô nên uống một ly sữa ấm trước khi ngủ nhé!
                  </div>
                  <div className="bg-primary text-primary-foreground text-[8px] p-2 rounded-xl rounded-tr-none self-end max-w-[80%] leading-normal shadow-sm shadow-primary/10">
                    Cảm ơn trợ lý AI, cô sẽ thử ngay tối nay!
                  </div>
                </div>

                {/* Nút bấm microphone nổi bật */}
                <div className="flex justify-center items-center py-2 border-t border-border/40">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 animate-bounce">
                    <Mic className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lớp nhãn trang trí bay lơ lửng */}
            <div className="absolute top-10 right-4 bg-card border border-border p-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
              <span className="text-xs">🎙️</span>
              <span className="text-[10px] font-black">Nói tiếng Việt để ghi nhật ký</span>
            </div>

            <div className="absolute bottom-12 left-4 bg-card border border-border p-2.5 rounded-xl shadow-lg flex items-center gap-2">
              <span className="text-xs">🤖</span>
              <span className="text-[10px] font-black">AI tư vấn ân cần 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY & SECURITY SECTION */}
      <section className="bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 border-t border-border/20 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-black mb-2">Bảo mật thông tin & Quyền riêng tư tuyệt đối</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Dữ liệu sức khỏe cá nhân của bạn là riêng tư và linh thiêng. 
            Mọi thông tin lưu trữ đều được mã hóa hoàn toàn. Ứng dụng cam kết 100% không bán, 
            không chia sẻ dữ liệu cho bên thứ ba hoặc các hãng dược phẩm.
          </p>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <HelpCircle className="w-8 h-8 text-primary/80 mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-black">Câu hỏi thường gặp</h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-card border border-border/80 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 py-4 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-4 hover:bg-muted/30 active:bg-muted/50 transition-colors"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3 bg-muted/10 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FOOTER & CTA cuối trang */}
      <footer className="mt-auto bg-card border-t border-border/60 py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/80 text-primary flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 fill-current" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-foreground">Tiền Mãn Kinh</span>
          </div>
          
          <p className="max-w-md leading-relaxed">
            Ứng dụng đồng hành chăm sóc sức khỏe chủ động và cải thiện lối sống cho phụ nữ trung niên Việt Nam.
          </p>

          <div className="flex flex-wrap justify-center gap-6 font-semibold">
            <Link href="/login" className="hover:text-primary transition-colors">Trang đăng nhập</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Tạo tài khoản</Link>
            <a href="#features" className="hover:text-primary transition-colors">Xem tính năng</a>
          </div>

          <div className="border-t border-border/40 w-full pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Tiền Mãn Kinh. Bảo lưu mọi quyền.</p>
            <p className="font-medium">
              Thiết kế tràn đầy 💖 bởi cộng đồng phụ nữ thông thái.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
