"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/use-user-store";
import { useLogStore } from "@/store/use-log-store";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useCycles } from "@/hooks/use-cycles";
import { Button } from "@/components/ui/button";
import { 
  Printer, ArrowLeft, Heart, Sparkles, 
  ShieldAlert, Activity, FileText, Calendar, Loader2,
  Copy, MessageCircle
} from "lucide-react";
import { format, subMonths, parseISO, isAfter } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rangeMonths = parseInt(searchParams.get("range") || "3");

  const { profile } = useUserStore();
  const { dailyLogs } = useLogStore();
  const { getPeriScoreCategory } = useDailyLog();
  const { averageCycleLength, averagePeriodDuration, sortedCycles } = useCycles();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!profile) return null;

  // Lọc logs theo khoảng thời gian được chọn
  const startDateLimit = subMonths(new Date(), rangeMonths);

  const filteredLogs = Object.values(dailyLogs).filter((log) => {
    const logDate = parseISO(log.date);
    return isAfter(logDate, startDateLimit);
  });

  // Tính toán các chỉ số trung bình trong khoảng thời gian lọc
  const totalDays = filteredLogs.length;
  let totalPeriScore = 0;
  let totalSleepDuration = 0;
  let totalSleepQuality = 0;
  let totalHotFlashes = 0;
  let totalInsomnia = 0;
  let totalAnxiety = 0;

  // Đếm số ngày bị triệu chứng nặng (mức 2, 3)
  let severeHotFlashesCount = 0;
  let severeInsomniaCount = 0;

  filteredLogs.forEach((log) => {
    totalPeriScore += log.periScore;
    totalSleepDuration += log.sleep?.totalDuration || 0;
    totalSleepQuality += log.sleep?.quality || 0;
    totalHotFlashes += log.symptoms?.hotFlashes || 0;
    totalInsomnia += log.symptoms?.insomnia || 0;
    totalAnxiety += log.symptoms?.anxiety || 0;

    if ((log.symptoms?.hotFlashes || 0) >= 2) severeHotFlashesCount++;
    if ((log.symptoms?.insomnia || 0) >= 2) severeInsomniaCount++;
  });

  const avgPeriScore = totalDays > 0 ? Math.round(totalPeriScore / totalDays) : 0;
  const avgSleep = totalDays > 0 ? (totalSleepDuration / totalDays / 60).toFixed(1) : "0.0";
  const avgSleepQuality = totalDays > 0 ? (totalSleepQuality / totalDays).toFixed(1) : "0.0";
  const avgHotFlashes = totalDays > 0 ? (totalHotFlashes / totalDays).toFixed(1) : "0.0";
  const avgInsomnia = totalDays > 0 ? (totalInsomnia / totalDays).toFixed(1) : "0.0";
  const avgAnxiety = totalDays > 0 ? (totalAnxiety / totalDays).toFixed(1) : "0.0";

  const periScoreCat = getPeriScoreCategory(avgPeriScore);

  // Lấy danh sách chu kỳ trong khoảng thời gian lọc
  const filteredCycles = sortedCycles.filter((c) => {
    const cycleDate = parseISO(c.startDate);
    return isAfter(cycleDate, startDateLimit);
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleZaloConsult = () => {
    const name = profile?.displayName || "Thành viên";
    const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : "--";
    const bmiVal = profile?.bmi || "--";
    const bmiCategory = bmiVal !== "--" 
      ? (bmiVal < 18.5 ? "Gầy" : bmiVal < 25 ? "Bình thường" : bmiVal < 30 ? "Thừa cân" : "Béo phì")
      : "Chưa cập nhật";
    
    // Tìm ghi chú gần nhất trong filteredLogs
    let lastLogNote = "";
    const sortedFilteredLogs = [...filteredLogs].sort((a, b) => b.date.localeCompare(a.date));
    for (const log of sortedFilteredLogs) {
      if (log.mood?.note) {
        lastLogNote = log.mood.note;
        break;
      }
    }

    const message = `KÍNH GỬI BÁC SĨ ĐÔNG Y - BÁO CÁO SỨC KHỎE TIỀN MÃN KINH (${rangeMonths} THÁNG QUA)
---------------------------------
- Họ và tên: ${name} (${age} tuổi)
- Chiều cao/Cân nặng: ${profile?.height || "--"} cm / ${profile?.weight || "--"} kg
- Chỉ số BMI: ${bmiVal} (${bmiCategory})
- Điểm PeriScore trung bình: ${avgPeriScore}/100 (${periScoreCat.label})
- Dữ liệu nhật ký ${rangeMonths} tháng qua (Ghi chép ${totalDays} ngày):
  + Số ngày mất ngủ nặng (mức 2, 3): ${severeInsomniaCount} ngày
  + Số ngày bốc hỏa nặng (mức 2, 3): ${severeHotFlashesCount} ngày
  + Cường độ bốc hỏa TB: ${avgHotFlashes} / 3.0
  + Cường độ mất ngủ TB: ${avgInsomnia} / 3.0
  + Mức độ lo âu TB: ${avgAnxiety} / 3.0
  + Thời gian ngủ TB: ${avgSleep} giờ / đêm
- Chu kỳ kinh nguyệt trung bình: ${averageCycleLength} ngày (Thời gian hành kinh TB: ${averagePeriodDuration} ngày)
- Số chu kỳ đã ghi nhận: ${filteredCycles.length} (Chu kỳ bất thường: ${filteredCycles.filter((c) => c.isAbnormal).length})
- Ghi chú sức khỏe gần nhất: "${lastLogNote || "Không có ghi chú"}"
---------------------------------
Tôi cần tư vấn giải pháp Đông y cải thiện thể trạng tuổi 40+.`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(message)
        .then(() => {
          toast.success("Đã tự động gom và sao chép tóm tắt báo cáo sức khỏe của chị!");
          toast.info("Đang chuyển hướng Zalo... Chị chỉ cần Nhấp chuột phải -> Dán (Paste) để gửi báo cáo cho Bác sĩ Đông y.", { duration: 6000 });
          
          setTimeout(() => {
            window.open("https://zalo.me/0982581222", "_blank");
          }, 1500);
        })
        .catch((err) => {
          console.error("Lỗi sao chép: ", err);
          toast.error("Không thể tự động sao chép. Đang mở Zalo tư vấn bác sĩ: 0982581222.");
          setTimeout(() => {
            window.open("https://zalo.me/0982581222", "_blank");
          }, 1500);
        });
    } else {
      window.open("https://zalo.me/0982581222", "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-8 max-w-4xl mx-auto print:p-0 print:max-w-full">
      {/* Top action bar - Hidden when print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4 mb-6 print:hidden">
        <Button 
          variant="outline" 
          onClick={() => router.back()} 
          className="h-10 px-4 rounded-xl border-gray-300 text-gray-700 w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            onClick={handleZaloConsult}
            variant="outline"
            className="h-10 px-4 rounded-xl border-primary text-primary hover:bg-primary/5 font-semibold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm flex-1 sm:flex-none justify-center"
          >
            <MessageCircle className="w-4 h-4" /> Gửi Zalo tư vấn
          </Button>
          <Button 
            onClick={handlePrint}
            className="h-10 px-4 sm:px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-semibold flex items-center gap-1.5 shadow-sm text-xs sm:text-sm flex-1 sm:flex-none justify-center"
          >
            <Printer className="w-4 h-4" /> Tải PDF / In báo cáo
          </Button>
        </div>
      </div>

      {/* REPORT PAGE CONTAINER */}
      <div className="border border-gray-300 p-8 rounded-2xl shadow-sm print:border-0 print:p-0 print:shadow-none">
        
        {/* Header Báo cáo */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-lg">
              <Heart className="w-6 h-6 fill-current" />
              <span>Hệ Thống Theo Dõi Sức Khỏe Tiền Mãn Kinh</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              BÁO CÁO TỔNG HỢP SỨC KHỎE CÁ NHÂN
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Khoảng thời gian: {rangeMonths} tháng qua (Từ ngày {format(startDateLimit, "dd/MM/yyyy")} đến nay)
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 font-semibold space-y-1">
            <p>Ngày kết xuất: {format(new Date(), "dd/MM/yyyy")}</p>
            <p>Mã hồ sơ: #{profile.uid.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Thông tin bệnh nhân / người dùng */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm print:bg-gray-100">
          <div>
            <span className="text-gray-500 block text-xs font-semibold uppercase">Họ và tên</span>
            <span className="font-bold text-gray-900">{profile.displayName}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs font-semibold uppercase">Năm sinh / Tuổi</span>
            <span className="font-bold text-gray-900">
              {profile.birthYear} ({new Date().getFullYear() - (profile.birthYear || 1975)} tuổi)
            </span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs font-semibold uppercase">Chiều cao / Cân nặng</span>
            <span className="font-bold text-gray-900">{profile.height} cm / {profile.weight} kg</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs font-semibold uppercase">Chỉ số BMI</span>
            <span className="font-bold text-gray-900">
              {profile.bmi} ({profile.bmi && profile.bmi < 25 ? "Bình thường" : "Thừa cân"})
            </span>
          </div>
        </div>

        {/* Nội dung chính 1: PeriScore & Cảnh báo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* PeriScore Box */}
          <div className="border border-gray-300 rounded-xl p-5 text-center flex flex-col justify-center bg-gray-50/50 print:bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm PeriScore Trung bình</span>
            <div className="text-5xl font-black text-primary my-3">{avgPeriScore}</div>
            <span className={`inline-block mx-auto text-xs font-extrabold px-3 py-1 rounded-full border ${periScoreCat.color}`}>
              {periScoreCat.label}
            </span>
            <p className="text-[10px] text-gray-500 mt-3 italic leading-normal">
              * Hệ số nhân đôi được áp dụng cho triệu chứng Bốc hỏa và Mất ngủ theo tiêu chuẩn PeriScore.
            </p>
          </div>

          {/* Lịch sử chu kỳ tóm tắt */}
          <div className="md:col-span-2 border border-gray-300 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 border-b border-gray-200 pb-2">
              <Calendar className="w-4 h-4 text-primary" /> Tóm tắt chu kỳ kinh nguyệt
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 font-semibold block">Vòng chu kỳ trung bình:</span>
                <span className="text-base font-bold text-gray-900">{averageCycleLength} ngày</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Thời gian hành kinh trung bình:</span>
                <span className="text-base font-bold text-gray-900">{averagePeriodDuration} ngày</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Số chu kỳ đã theo dõi:</span>
                <span className="text-base font-bold text-gray-900">{filteredCycles.length} chu kỳ</span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Chu kỳ bất thường ghi nhận:</span>
                <span className="text-base font-bold text-red-600">
                  {filteredCycles.filter((c) => c.isAbnormal).length} lần
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung chính 2: Chi tiết triệu chứng */}
        <div className="space-y-4 mb-8">
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 border-b border-gray-200 pb-2">
            <Activity className="w-4 h-4 text-primary" /> Thống kê mức độ Triệu chứng & Giấc ngủ
          </h3>
          
          <div className="overflow-hidden border border-gray-300 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="px-4 py-3">Chỉ số sức khỏe phân tích</th>
                  <th className="px-4 py-3 text-center">Giá trị trung bình</th>
                  <th className="px-4 py-3">Mức độ / Nhận định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium text-gray-900">
                <tr>
                  <td className="px-4 py-3">Cường độ cơn bốc hỏa (Hot Flashes)</td>
                  <td className="px-4 py-3 text-center">{avgHotFlashes} / 3.0</td>
                  <td className="px-4 py-3 text-gray-600">
                    {parseFloat(avgHotFlashes) < 1.0 ? "Nhẹ / Không đáng kể" : parseFloat(avgHotFlashes) < 2.0 ? "Trung bình" : "Nghiêm trọng"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Mức độ mất ngủ (Insomnia)</td>
                  <td className="px-4 py-3 text-center">{avgInsomnia} / 3.0</td>
                  <td className="px-4 py-3 text-gray-600">
                    {parseFloat(avgInsomnia) < 1.0 ? "Ngủ tốt" : parseFloat(avgInsomnia) < 2.0 ? "Mất ngủ nhẹ" : "Mất ngủ nghiêm trọng"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Cảm giác lo âu bồn chồn (Anxiety)</td>
                  <td className="px-4 py-3 text-center">{avgAnxiety} / 3.0</td>
                  <td className="px-4 py-3 text-gray-600">
                    {parseFloat(avgAnxiety) < 1.0 ? "Tâm lý ổn định" : "Căng thẳng nhẹ/vừa"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Thời gian ngủ ban đêm trung bình</td>
                  <td className="px-4 py-3 text-center">{avgSleep} giờ / đêm</td>
                  <td className="px-4 py-3 text-gray-600">
                    {parseFloat(avgSleep) >= 7.0 ? "Đạt tiêu chuẩn sức khỏe" : "Thiếu ngủ nhẹ"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Chất lượng giấc ngủ tự đánh giá</td>
                  <td className="px-4 py-3 text-center">{avgSleepQuality} / 10</td>
                  <td className="px-4 py-3 text-gray-600">
                    {parseFloat(avgSleepQuality) >= 7.0 ? "Tốt" : parseFloat(avgSleepQuality) >= 5.0 ? "Trung bình" : "Kém"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Nội dung chính 3: Nhận định lâm sàng sơ bộ từ AI Coach */}
        <div className="border border-gray-300 rounded-xl p-5 mb-8 bg-gray-50/30 print:bg-transparent">
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-primary fill-current" /> Khuyến nghị cải thiện thể trạng (AI Coach)
          </h3>
          <p className="text-xs leading-relaxed text-gray-700 font-medium">
            {totalDays === 0 
              ? "Chưa có đủ dữ liệu ghi nhận nhật ký sức khỏe để phân tích khuyến nghị."
              : avgPeriScore > 50 
                ? "Dữ liệu cho thấy chị đang trải qua giai đoạn tiền mãn kinh với các triệu chứng bốc hỏa và khó ngủ ở mức độ vừa đến nặng. Khuyến nghị chị nên bổ sung thực phẩm chứa phytoestrogen tự nhiên (đậu nành, hạt lanh, cỏ ba lá đỏ), uống trà thảo mộc làm mát gan điều hòa cơ thể trước khi ngủ và hạn chế trà, cà phê sau 14h chiều. Chị cũng nên duy trì phòng ngủ thông thoáng và duy trì lối sống lành mạnh."
                : "Thể trạng chung của chị ổn định, các triệu chứng vận mạch và giấc ngủ ở ngưỡng dung nạp tốt. Chị nên duy trì chế độ ăn giàu canxi, vitamin D để bảo vệ xương khớp và tập thể dục thể thao nhẹ nhàng như yoga, đi bộ từ 30 phút mỗi ngày."}
          </p>
        </div>

        {/* Chữ ký & Disclaimer y tế */}
        <div className="border-t border-gray-200 pt-6 mt-8 flex flex-col md:flex-row md:justify-between items-start gap-6">
          {/* Disclaimer */}
          <div className="max-w-md flex items-start gap-2 text-[10px] leading-relaxed text-gray-500 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>
              Tuyên bố pháp lý: Báo cáo này hoàn toàn tự động kết xuất dựa trên dữ liệu nhật ký tự ghi chép của cá nhân. Báo cáo không mang tính chất chẩn đoán bệnh lâm sàng thay thế bác sĩ. Hãy mang báo cáo này thảo luận trực tiếp với bác sĩ phụ khoa của chị trong lần khám định kỳ gần nhất.
            </span>
          </div>

          {/* Signature block */}
          <div className="text-center md:mr-10 self-center md:self-auto text-xs font-semibold text-gray-700">
            <p className="italic mb-12">Người theo dõi sức khỏe</p>
            <p className="font-bold text-gray-900 border-t border-gray-300 pt-2 px-6">
              {profile.displayName}
            </p>
          </div>
        </div>

      </div>

      {/* Bác sĩ Đông y tư vấn trực tiếp - Hidden when print */}
      <div className="mt-8 bg-gradient-to-br from-primary/5 via-white to-secondary/10 border border-primary/20 p-6 rounded-2xl shadow-sm print:hidden space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Nhận tư vấn Đông y từ Bác sĩ Chuyên khoa
            </h3>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Bác sĩ Đông y sẽ dựa trên báo cáo chi tiết {rangeMonths} tháng của chị để tư vấn phác đồ thảo dược và liệu pháp dưỡng sinh phù hợp nhất.
            </p>
          </div>
          <Button 
            onClick={handleZaloConsult}
            className="w-full md:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:bg-primary/95 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-98 transition-all shrink-0"
          >
            <Copy className="w-4 h-4" /> Sao chép báo cáo & Chat Zalo
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-gray-200/60 text-[11px] text-muted-foreground font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>Tự động tổng hợp chỉ số PeriScore và số ngày mất ngủ, bốc hỏa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>Chuyển tiếp đến Zalo của Bác sĩ Đông y (SĐT: 0982581222)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>Dịch vụ tư vấn và chăm sóc sức khỏe ban đầu hoàn toàn miễn phí</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-black p-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="ml-3 text-sm">Đang kết xuất báo cáo y khoa...</p>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
