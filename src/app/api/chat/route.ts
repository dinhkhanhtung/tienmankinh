export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        reply: "Chào chị! Em là AI Coach của chị. Hiện tại hệ thống chưa được cấu hình khóa API (GEMINI_API_KEY) trong tệp `.env.local` ở máy chủ. Chị vui lòng mở tệp `.env.local`, điền khóa API của chị vào dòng `GEMINI_API_KEY=your_key_here` và khởi động lại dự án để bắt đầu trò chuyện cùng em nhé!" 
      });
    }

    if (!userId) {
      return NextResponse.json({ error: "Không tìm thấy thông tin định danh người dùng." }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Lịch sử trò chuyện không hợp lệ." }, { status: 400 });
    }

    // 1. Truy vấn Profile người dùng từ Firestore (Sử dụng Client SDK trên môi trường Node.js Server)
    let userProfileText = "Chưa có thông tin hồ sơ.";
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const profile = userDocSnap.data();
        const currentYear = new Date().getFullYear();
        const age = profile?.birthYear ? currentYear - profile.birthYear : "chưa rõ";
        userProfileText = `
        - Độ tuổi: ${age} tuổi (năm sinh: ${profile?.birthYear || "chưa rõ"})
        - Thể chất: Chiều cao ${profile?.height || "--"}cm, Cân nặng ${profile?.weight || "--"}kg, BMI: ${profile?.bmi || "--"}
        - Sinh học: Tuổi có kinh lần đầu: ${profile?.periodAge || "chưa rõ"}, Số con: ${profile?.childrenCount || 0}
        `;
      }
    } catch (dbErr) {
      console.warn("Bỏ qua lỗi đọc profile từ Firestore Server: ", dbErr);
    }

    // 2. Truy vấn nhật ký 7 ngày gần nhất của người dùng
    let logsText = "Không có ghi chép nhật ký trong 7 ngày qua.";
    try {
      const logsQuery = query(
        collection(db, "daily_logs"),
        where("userId", "==", userId)
      );
      const logsSnap = await getDocs(logsQuery);

      if (!logsSnap.empty) {
        const logs: any[] = [];
        logsSnap.forEach((doc) => logs.push(doc.data()));
        
        // Sắp xếp theo ngày giảm dần và lấy tối đa 7 ngày gần nhất để tránh yêu cầu composite index
        logs.sort((a: any, b: any) => b.date.localeCompare(a.date));
        const latestLogs = logs.slice(0, 7);
        
        logsText = latestLogs.map((log) => {
          const formattedDate = log.date;
          const symptomsList = Object.entries(log.symptoms || {})
            .filter(([_, val]: any) => val > 0)
            .map(([key, val]) => {
              // Dịch tên key triệu chứng sang tiếng Việt cho AI dễ đọc
              const trans: Record<string, string> = {
                hotFlashes: "Bốc hỏa",
                nightSweats: "Đổ mồ hôi đêm",
                palpitations: "Tim đập nhanh",
                insomnia: "Mất ngủ",
                anxiety: "Lo âu",
                irritability: "Cáu gắt",
                depression: "Trầm buồn",
                jointPain: "Đau khớp",
                fatigue: "Mệt mỏi",
                weightGain: "Tăng cân",
                drySkin: "Khô da",
                vaginalDryness: "Khô âm đạo",
                lowLibido: "Giảm ham muốn"
              };
              return `${trans[key] || key}: mức ${val}/3`;
            })
            .join(", ");
          
          return `
          * Ngày ${formattedDate}:
            - Triệu chứng ghi nhận: ${symptomsList || "Không có triệu chứng nổi bật"}
            - Giấc ngủ: ngủ ${(log.sleep?.totalDuration / 60).toFixed(1)} giờ, chất lượng ${log.sleep?.quality || 0}/10, thức giấc ${log.sleep?.awakenings || 0} lần
            - Cảm xúc: ${log.mood?.level || "bình thường"}. Ghi chú: "${log.mood?.note || "không ghi chú"}"
            - Điểm chỉ số PeriScore ngày này: ${log.periScore || 0}/100
          `;
        }).join("\n");
      }
    } catch (dbErr) {
      console.warn("Bỏ qua lỗi đọc logs từ Firestore Server: ", dbErr);
    }

    // 3. Xây dựng System Instruction (System Prompt) cho AI
    const systemInstruction = `
    Bạn là "AI Coach Sức Khỏe" - một trợ lý ảo ân cần, tâm lý và am hiểu chuyên sâu về y học sức khỏe phụ nữ tuổi trung niên (40-55 tuổi), đặc biệt là thời kỳ Tiền Mãn Kinh và Mãn Kinh.
    
    Thông tin thể trạng và hồ sơ của người dùng hiện tại:
    ${userProfileText}

    Dữ liệu nhật ký sức khỏe 7 ngày gần đây nhất của người dùng:
    ${logsText}

    HƯỚNG DẪN TRẢ LỜI & RÀNG BUỘC PHÁP LÝ (BẮT BUỘC TUÂN THỦ):
    1. XƯNG HÔ: Trò chuyện bằng tiếng Việt ấm áp, lịch sự. Xưng hô là "AI Coach" hoặc "Em" và gọi người dùng là "Chị" để tạo cảm giác gần gũi, trấn an.
    2. CÁ NHÂN HÓA: Hãy chú ý kỹ dữ liệu 7 ngày gần nhất của chị ấy. Ví dụ: Nếu dữ liệu ghi nhận chị ấy bị bốc hỏa hay mất ngủ nhiều, hãy mở đầu bằng việc hỏi thăm về triệu chứng đó, thể hiện sự đồng cảm sâu sắc.
    3. NỘI DUNG TƯ VẤN: Đưa ra các giải pháp tự nhiên, lành mạnh dựa trên thay đổi lối sống, thực phẩm (dinh dưỡng phù hợp như ăn đậu nành, rau xanh, uống nước đủ), mẹo giảm nóng (mặc quần áo thoáng mát, bật quạt nhẹ), thói quen ngủ tốt (ngâm chân ấm, thiền thở) và vận động nhẹ nhàng (yoga, đi bộ).
    4. RÀNG BUỘC Y TẾ CỰC KỲ QUAN TRỌNG:
       - TUYỆT ĐỐI KHÔNG đưa ra chẩn đoán bệnh y khoa cụ thể.
       - TUYỆT ĐỐI KHÔNG nhắc tên bất kỳ loại thuốc tây hay thuốc kê đơn nào (ví dụ: thuốc nội tiết tố HRT, thuốc ngủ, an thần, giảm đau kháng viêm tây y).
       - Luôn nhấn mạnh rõ ràng rằng thông tin tư vấn này chỉ mang tính tham khảo cải thiện thể trạng chung và khuyến nghị chị nên đi khám bác sĩ sản phụ khoa chuyên môn nếu các triệu chứng kéo dài hoặc gây ảnh hưởng nghiêm trọng đến sức khỏe.
    5. ĐỊNH DẠNG: Viết câu trả lời mạch lạc, chia thành các đoạn ngắn hoặc gạch đầu dòng rõ ràng để người trung niên dễ đọc. Tránh viết những đoạn văn quá dài dòng và phức tạp.
    `;

    // 4. Gọi Gemini API
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    // Chuẩn hóa và gộp các tin nhắn trùng role liên tiếp để đảm bảo cấu trúc đan xen hợp lệ cho Gemini API
    const sanitizedContents: any[] = [];
    let lastRole: string | null = null;

    messages.forEach((msg: any) => {
      // Bỏ qua tin nhắn welcome
      if (msg.id === "welcome") return;

      const role = msg.role === "assistant" ? "model" : "user";
      const text = msg.content?.trim() || "";
      if (!text) return;

      if (role === lastRole && sanitizedContents.length > 0) {
        // Gộp tin nhắn trùng role liên tiếp
        sanitizedContents[sanitizedContents.length - 1].parts[0].text += "\n" + text;
      } else {
        sanitizedContents.push({
          role,
          parts: [{ text }]
        });
        lastRole = role;
      }
    });

    // Đảm bảo tin nhắn đầu tiên bắt buộc phải có role là 'user'
    while (sanitizedContents.length > 0 && sanitizedContents[0].role !== "user") {
      sanitizedContents.shift();
    }

    if (sanitizedContents.length === 0) {
      return NextResponse.json({ error: "Lịch sử trò chuyện không chứa tin nhắn hợp lệ từ người dùng." }, { status: 400 });
    }

    const contents = sanitizedContents;

    const result = await model.generateContent({
      contents: contents,
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      }
    });

    const responseText = result.response.text();
    
    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error("Lỗi API Chat: ", error);
    const errorMessage = error?.message || "";
    
    // Nếu lỗi do API Key không hợp lệ hoặc hết hạn
    if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
      return NextResponse.json({ 
        reply: "Chào chị! Rất tiếc là em (AI Coach) chưa thể trò chuyện lúc này do khóa kết nối API (GEMINI_API_KEY) được cấu hình trên máy chủ hiện không hợp lệ hoặc đã hết hạn. Chị vui lòng kiểm tra và cập nhật lại khóa API chính xác trên trang cấu hình Vercel để kích hoạt lại nhé!" 
      });
    }

    return NextResponse.json(
      { error: `Không thể kết nối với AI Coach lúc này. Chi tiết: ${errorMessage || "Lỗi máy chủ không xác định"}` },
      { status: 500 }
    );
  }
}
