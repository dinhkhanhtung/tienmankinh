export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      uid,
      displayName = "Thành viên",
      email = "Chưa có email",
      type = "Ý kiến đóng góp khác",
      content = ""
    } = data;

    if (!uid) {
      return NextResponse.json({ error: "Thiếu UID người dùng." }, { status: 400 });
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "Nội dung góp ý quá ngắn (tối thiểu 10 ký tự)." }, { status: 400 });
    }

    const feedbackTime = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    // 1. GỬI TIN NHẮN QUA TELEGRAM BOT
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (telegramToken && telegramChatId) {
      try {
        let telegramMessage = `💬 <b>GÓP Ý MỚI TỪ NGƯỜI DÙNG!</b> 💬\n\n`;
        telegramMessage += `👤 <b>Thông tin tài khoản:</b>\n`;
        telegramMessage += `- <b>Họ tên:</b> ${displayName}\n`;
        telegramMessage += `- <b>Email:</b> ${email}\n`;
        telegramMessage += `- <b>UID:</b> <code>${uid}</code>\n\n`;
        
        telegramMessage += `🗂 <b>Loại góp ý:</b> <code>${type}</code>\n`;
        telegramMessage += `📝 <b>Nội dung góp ý:</b>\n<blockquote>${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</blockquote>\n`;
        telegramMessage += `⏰ <b>Thời gian gửi:</b> ${feedbackTime}\n`;

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
        console.error("Lỗi gửi tin nhắn Telegram khi nhận feedback:", tgError);
      }
    } else {
      console.warn("Telegram Bot chưa được cấu hình đầy đủ biến môi trường trong Feedback API.");
    }

    // 2. ĐỒNG BỘ VÀO NOTION (Ghi nhận dưới dạng block content trong trang khách hàng)
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    if (notionApiKey && notionDatabaseId) {
      try {
        // Tìm trang của khách hàng dựa trên UID
        const queryUrl = `https://api.notion.com/v1/databases/${notionDatabaseId}/query`;
        const queryRes = await fetch(queryUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${notionApiKey}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
          },
          body: JSON.stringify({
            filter: {
              property: "UID",
              rich_text: {
                equals: uid
              }
            }
          })
        });

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          const existingPages = queryData.results || [];
          if (existingPages.length > 0) {
            const pageId = existingPages[0].id;
            const blocksUrl = `https://api.notion.com/v1/blocks/${pageId}/children`;
            
            await fetch(blocksUrl, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${notionApiKey}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
              },
              body: JSON.stringify({
                children: [
                  {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                      rich_text: [
                        {
                          type: "text",
                          text: {
                            content: `💬 Góp ý [${type}]: "${content}" vào lúc ${feedbackTime}`
                          },
                          annotations: {
                            italic: true,
                            color: "blue"
                          }
                        }
                      ]
                    }
                  }
                ]
              })
            });
          } else {
            console.warn(`Không tìm thấy trang Notion tương ứng với UID ${uid} để append feedback.`);
          }
        }
      } catch (notionError) {
        console.error("Lỗi đồng bộ Notion khi nhận feedback:", notionError);
      }
    } else {
      console.warn("Notion Integration chưa được cấu hình đầy đủ biến môi trường trong Feedback API.");
    }

    return NextResponse.json({ success: true, message: "Cảm ơn bạn đã gửi ý kiến đóng góp." });
  } catch (error: any) {
    console.error("Lỗi API feedback:", error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
