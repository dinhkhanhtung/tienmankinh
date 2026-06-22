# KẾ HOẠCH PHÁT TRIỂN & CẬP NHẬT TÍNH NĂNG (TIỀN MÃN KINH APP)

Tài liệu này ghi nhận các tính năng dự kiến sẽ được nâng cấp và tích hợp vào ứng dụng trong thời gian tới nhằm tối ưu hóa trải nghiệm và nâng cao sức khỏe cho đối tượng phụ nữ trung niên (40 - 55 tuổi).

---

## 1. Hệ thống nhắc nhở thông minh (Smart Reminders & Notifications)
*   **Mục tiêu:** Giúp người dùng hình thành thói quen ghi chép nhật ký sức khỏe đều đặn, giảm thiểu việc quên do trí nhớ suy giảm tuổi trung niên.
*   **Giải pháp kỹ thuật:**
    *   Tối ưu hóa Service Worker của PWA để gửi thông báo đẩy (Push Notifications) ngoại tuyến ngay cả khi không mở ứng dụng.
    *   Tích hợp gửi tin nhắn nhắc nhở tự động qua **Zalo ZNS** (Zalo Notification Service) hoặc Messenger theo khung giờ cấu hình tùy chọn (mặc định 21:00 tối).
    *   Nhắc nhở uống nước thảo mộc làm mát cơ thể, ngâm chân thảo dược trước khi ngủ.

## 2. Thư viện Dưỡng sinh & Thư giãn (Wellness Hub)
*   **Mục tiêu:** Cung cấp giải pháp trực quan giúp giảm stress, cải thiện cơn bốc hỏa và chữa mất ngủ tức thì.
*   **Giải pháp kỹ thuật:**
    *   **Âm thanh dễ ngủ:** Tích hợp trình phát nhạc thiền, tiếng ồn trắng (tiếng mưa rơi, sóng biển, tiếng chuông xoay Tây Tạng).
    *   **Bài tập thở nhịp điệu:** Thiết kế bong bóng thở trực quan (hít vào 4s - giữ 7s - thở ra 8s) để hướng dẫn hạ hỏa nhanh khi bốc hỏa hoặc lo âu đột ngột.
    *   **Yoga & Dưỡng sinh:** Tích hợp danh sách các bài tập nhẹ nhàng (Yoga mở hông, thiền nằm) dưới dạng ảnh động (GIF) hoặc video ngắn 5-15 phút.

## 3. Cộng đồng chia sẻ an toàn (Safe Circle)
*   **Mục tiêu:** Tạo không gian chia sẻ, đồng cảm và giải tỏa căng thẳng tâm lý giai đoạn mãn kinh.
*   **Giải pháp kỹ thuật:**
    *   Xây dựng diễn đàn thảo luận nhỏ chia theo chuyên mục (Mất ngủ, Bốc hỏa, Giảm cân, Tâm sự tuổi 40+).
    *   Cơ chế **đăng bài ẩn danh (Anonymous Posting)** để bảo vệ sự riêng tư đối với các chủ đề nhạy cảm như suy giảm ham muốn, khô hạn hay rạn nứt gia đình.
    *   Chức năng thả tim, động viên từ các thành viên khác.

## 4. Tích hợp Thiết bị đeo thông minh (Smart Wearables Integration)
*   **Mục tiêu:** Tự động hóa quá trình thu thập dữ liệu giấc ngủ và thể trạng, giảm bớt thao tác ghi chép thủ công.
*   **Giải pháp kỹ thuật:**
    *   Kết nối với **Apple HealthKit** (iOS) và **Google Health Connect** (Android).
    *   Tự động đồng bộ số giờ ngủ, số lần thức giấc trong đêm từ các thiết bị thông minh (Apple Watch, Samsung Galaxy Watch, Garmin, Xiaomi Band).
    *   Đo lường sự biến thiên nhịp tim (HRV) để đưa ra cảnh báo căng thẳng tự động.

## 5. Cẩm nang sức khỏe & Giọng đọc nhân tạo (Audio Reader)
*   **Mục tiêu:** Cung cấp nguồn kiến thức khoa học thường thức chuẩn y khoa, hỗ trợ người dùng có thị lực suy giảm.
*   **Giải pháp kỹ thuật:**
    *   Xây dựng thư viện bài viết khoa học thường thức được kiểm duyệt bởi bác sĩ sản phụ khoa.
    *   Tích hợp công nghệ chuyển đổi văn bản thành giọng nói (Text-to-Speech) để người dùng có thể bấm nghe phát thanh (như dạng Podcast) thay vì đọc chữ trên màn hình.
