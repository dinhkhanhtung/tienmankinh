export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Phân tích dữ liệu Webhook từ SePay hoặc Casso
    const body = await req.json();
    console.log("Nhận Webhook ủng hộ:", JSON.stringify(body));

    // SePay định dạng payload phẳng: body.amountIn, body.content, body.transactionDate
    // Casso định dạng payload: body.data: [{ amount, content, ... }]
    let amount = 0;
    let content = "";
    let dateStr = "";
    let transactionCode = "";
    let bankGateway = "";

    if (body.amountIn !== undefined) {
      // Định dạng SePay
      amount = Number(body.amountIn);
      content = body.content || "";
      dateStr = body.transactionDate || "";
      transactionCode = body.code || "";
      bankGateway = body.gateway || "BIDV";
    } else if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      // Định dạng Casso
      const tx = body.data[0];
      amount = Number(tx.amount || 0);
      content = tx.description || tx.content || "";
      dateStr = tx.when || "";
      transactionCode = tx.refId || "";
      bankGateway = "BIDV";
    } else {
      // Fallback cho định dạng khác
      amount = Number(body.amount || 0);
      content = body.content || "";
      dateStr = body.date || "";
      transactionCode = body.code || body.id || "";
      bankGateway = body.gateway || "BIDV";
    }

    // Chỉ xử lý nếu có phát sinh giao dịch nhận tiền (amount > 0)
    if (amount <= 0) {
      return NextResponse.json({ success: true, message: "Không phải giao dịch nhận tiền ủng hộ." });
    }

    // Phân tích nội dung chuyển khoản để lấy thông tin người gửi (nếu khớp cú pháp TMK <TEN>)
    let senderName = "Thành viên ẩn danh";
    const cleanContent = content.trim().toUpperCase();
    if (cleanContent.startsWith("TMK")) {
      // Cú pháp: TMK TEN_KHONG_DAU [AMOUNT_SUFFIX]
      // Lấy phần giữa TMK và số tiền
      const parts = cleanContent.split(" ");
      if (parts.length > 1) {
        // parts[0] là TMK, parts[1] đến parts[n-1] là tên
        // Nếu phần tử cuối kết thúc bằng "K" (ví dụ 50K) thì bỏ phần tử cuối
        const nameParts = parts.slice(1);
        const lastPart = nameParts[nameParts.length - 1];
        if (lastPart.endsWith("K") && !isNaN(Number(lastPart.slice(0, -1)))) {
          nameParts.pop();
        }
        if (nameParts.length > 0) {
          senderName = nameParts.join(" ");
        }
      }
    }

    const currentLocalTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    // 2. GỬI TIN NHẮN THÔNG BÁO QUA TELEGRAM BOT
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (telegramToken && telegramChatId) {
      try {
        let telegramMessage = `💖 <b>CÓ ỦNG HỘ MỚI CHO DỰ ÁN!</b> 💖\n\n`;
        telegramMessage += `💰 <b>Số tiền:</b> <code>${amount.toLocaleString("vi-VN")} đ</code>\n`;
        telegramMessage += `👤 <b>Người gửi:</b> <b>${senderName}</b>\n`;
        telegramMessage += `📝 <b>Nội dung CK:</b> <i>"${content}"</i>\n`;
        telegramMessage += `🏦 <b>Ngân hàng:</b> ${bankGateway}\n`;
        telegramMessage += `🔑 <b>Mã GD:</b> <code>${transactionCode}</code>\n`;
        telegramMessage += `📅 <b>Thời gian nhận:</b> ${dateStr || currentLocalTime}\n\n`;
        telegramMessage += `🍀 <i>Cảm ơn sự đóng góp quý báu của bạn để duy trì hệ thống và nâng cấp AI Coach!</i>`;

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: telegramMessage,
            parse_mode: "HTML",
          }),
        });
      } catch (tgError) {
        console.error("Lỗi gửi tin nhắn Telegram webhook:", tgError);
      }
    }

    // 3. ĐỒNG BỘ VÀO NOTION DATABASE
    const notionApiKey = process.env.NOTION_API_KEY;
    // Ưu tiên dùng NOTION_DONATE_DATABASE_ID để quản lý riêng, nếu không có sẽ dùng NOTION_DATABASE_ID (database khách hàng)
    const notionDatabaseId = process.env.NOTION_DONATE_DATABASE_ID || process.env.NOTION_DATABASE_ID;

    if (notionApiKey && notionDatabaseId) {
      try {
        // Tạo một page mới lưu trữ thông tin giao dịch ủng hộ
        const properties: any = {
          "Tên khách hàng": {
            "title": [
              {
                "text": {
                  "content": senderName
                }
              }
            ]
          },
          "Số tiền": {
            "number": amount
          },
          "Nội dung": {
            "rich_text": [
              {
                "text": {
                  "content": content
                }
              }
            ]
          },
          "Mã giao dịch": {
            "rich_text": [
              {
                "text": {
                  "content": transactionCode
                }
              }
            ]
          },
          "Thời gian nhận": {
            "date": {
              "start": new Date().toISOString()
            }
          }
        };

        const createUrl = `https://api.notion.com/v1/pages`;
        await fetch(createUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${notionApiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
          },
          body: JSON.stringify({
            parent: {
              database_id: notionDatabaseId
            },
            properties: properties
          })
        });
      } catch (notionError) {
        console.error("Lỗi đồng bộ Notion webhook:", notionError);
      }
    }

    return NextResponse.json({ success: true, message: "Xử lý Webhook hoàn tất." });
  } catch (error: any) {
    console.error("Lỗi hệ thống xử lý Webhook:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
