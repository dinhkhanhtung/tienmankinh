export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      uid,
      displayName = "Thành viên",
      email = "Chưa có email",
      birthYear,
      height,
      weight,
      bmi,
      periodAge,
      childrenCount,
      lastPeriodDate,
      cycleLength,
      action = "onboarding" // "onboarding" | "update"
    } = data;

    if (!uid) {
      return NextResponse.json({ error: "Thiếu UID người dùng." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    const age = birthYear ? currentYear - birthYear : null;

    // 1. GỬI THÔNG BÁO QUA TELEGRAM BOT
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (telegramToken && telegramChatId) {
      try {
        const actionText = action === "onboarding" ? "🆕 KHÁCH HÀNG MỚI ĐĂNG KÝ!" : "🔄 CẬP NHẬT THÔNG TIN HỒ SƠ!";
        
        let telegramMessage = `🔔 *${actionText}*\n\n`;
        telegramMessage += `👤 *Thông tin tài khoản:*\n`;
        telegramMessage += `- *Họ tên:* ${displayName}\n`;
        telegramMessage += `- *Email:* ${email}\n`;
        telegramMessage += `- *UID:* \`${uid}\`\n`;
        if (age) telegramMessage += `- *Tuổi:* ${age} tuổi (Năm sinh: ${birthYear})\n`;
        
        telegramMessage += `\n📊 *Chỉ số thể chất:*\n`;
        if (height) telegramMessage += `- *Chiều cao:* ${height} cm\n`;
        if (weight) telegramMessage += `- *Cân nặng:* ${weight} kg\n`;
        if (bmi) telegramMessage += `- *BMI:* ${bmi}\n`;
        
        telegramMessage += `\n🌸 *Thông tin chu kỳ & sinh sản:*\n`;
        if (periodAge) telegramMessage += `- *Tuổi dậy thì:* ${periodAge} tuổi\n`;
        if (childrenCount !== undefined) telegramMessage += `- *Số con:* ${childrenCount}\n`;
        if (lastPeriodDate) telegramMessage += `- *Kỳ kinh gần nhất:* ${lastPeriodDate}\n`;
        if (cycleLength) telegramMessage += `- *Độ dài chu kỳ:* ${cycleLength} ngày\n`;
        
        telegramMessage += `\n⏰ *Thời gian:* ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`;

        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: telegramMessage,
            parse_mode: "Markdown",
          }),
        });
      } catch (tgError) {
        console.error("Lỗi khi gửi tin nhắn Telegram:", tgError);
        // Không throw lỗi, để tiếp tục thực hiện phần Notion
      }
    } else {
      console.warn("Telegram Bot chưa được cấu hình đầy đủ biến môi trường.");
    }

    // 2. ĐỒNG BỘ VÀO NOTION DATABASE
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    if (notionApiKey && notionDatabaseId) {
      try {
        // A. Tìm xem đã có trang nào chứa UID hoặc Email này chưa
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
              or: [
                {
                  property: "UID",
                  rich_text: {
                    equals: uid
                  }
                },
                ...(email && email !== "Chưa có email" ? [{
                  property: "Email",
                  email: {
                    equals: email
                  }
                }] : [])
              ]
            }
          })
        });

        if (!queryRes.ok) {
          const errData = await queryRes.text();
          throw new Error(`Query Database thất bại: ${errData}`);
        }

        const queryData = await queryRes.json();
        const existingPages = queryData.results || [];
        const isExist = existingPages.length > 0;

        // B. Chuẩn bị thuộc tính chung
        const properties: any = {
          "Tên khách hàng": {
            "title": [
              {
                "text": {
                  "content": displayName
                }
              }
            ]
          },
          "UID": {
            "rich_text": [
              {
                "text": {
                  "content": uid
                }
              }
            ]
          },
          "Cập nhật lần cuối": {
            "date": {
              "start": new Date().toISOString()
            }
          }
        };

        if (email) {
          properties["Email"] = { "email": email };
        }
        if (age) {
          properties["Tuổi"] = { "number": age };
        }
        if (birthYear) {
          properties["Năm sinh"] = { "number": Number(birthYear) };
        }
        if (height) {
          properties["Chiều cao (cm)"] = { "number": Number(height) };
        }
        if (weight) {
          properties["Cân nặng (kg)"] = { "number": Number(weight) };
        }
        if (bmi) {
          properties["BMI"] = { "number": Number(bmi) };
        }
        if (periodAge) {
          properties["Tuổi dậy thì"] = { "number": Number(periodAge) };
        }
        if (childrenCount !== undefined) {
          properties["Số con"] = { "number": Number(childrenCount) };
        }
        if (lastPeriodDate) {
          properties["Ngày kinh gần nhất"] = {
            "date": {
              "start": lastPeriodDate
            }
          };
        }
        if (cycleLength) {
          properties["Độ dài chu kỳ (ngày)"] = { "number": Number(cycleLength) };
        }

        if (isExist) {
          // CẬP NHẬT BẢN GHI ĐÃ CÓ
          const pageId = existingPages[0].id;
          const updateUrl = `https://api.notion.com/v1/pages/${pageId}`;
          
          const updateRes = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${notionApiKey}`,
              "Content-Type": "application/json",
              "Notion-Version": "2022-06-28"
            },
            body: JSON.stringify({
              properties: properties
            })
          });

          if (!updateRes.ok) {
            const errData = await updateRes.text();
            throw new Error(`Update Page thất bại: ${errData}`);
          }
        } else {
          // TẠO MỚI BẢN GHI
          // Thêm trạng thái mặc định "Chưa tư vấn" cho bản ghi mới
          properties["Trạng thái"] = {
            "select": {
              "name": "Chưa tư vấn"
            }
          };

          const createUrl = `https://api.notion.com/v1/pages`;
          const createRes = await fetch(createUrl, {
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

          if (!createRes.ok) {
            const errData = await createRes.text();
            throw new Error(`Create Page thất bại: ${errData}`);
          }
        }
      } catch (notionError) {
        console.error("Lỗi khi đồng bộ Notion:", notionError);
        // Không throw lỗi
      }
    } else {
      console.warn("Notion Integration chưa được cấu hình đầy đủ biến môi trường.");
    }

    return NextResponse.json({ success: true, message: "Thông báo & đồng bộ hoàn tất." });
  } catch (error: any) {
    console.error("Lỗi API integration:", error);
    // Trả về 200 kèm success: false để client không crash, nhưng vẫn báo lỗi ở backend
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 200 });
  }
}
