# Quy Trình Onboarding & Trắc Nghiệm Đánh Giá Trình Độ — SportXPv2

> Cập nhật: 31/10/2026.  
> Tài liệu quy chuẩn luồng Onboarding, bảng câu hỏi trắc nghiệm tự đánh giá trình độ và khởi tạo điểm Elo.

---

## 1. Luồng Người Dùng Khi Đăng Nhập Lần Đầu (Onboarding Gate)

1. Sau khi người dùng đăng ký hoặc đăng nhập tài khoản lần đầu qua Supabase Auth, hệ thống kiểm tra trường `profiles.onboarding_step`.
2. Nếu `onboarding_step < 5`: Ứng dụng tự động điều hướng tới trang `/onboarding` để làm bài trắc nghiệm 5 câu hỏi.
3. Nếu `onboarding_step == 5`: Người dùng đã hoàn thành onboarding, đi thẳng vào màn hình chính của ứng dụng.

---

## 2. Bảng 5 Câu Hỏi Trắc Nghiệm & Trọng Số Điểm

Công thức tính điểm khởi tạo:
```
initialElo = clamp(300 + sum(question_points), 300, 850)
```

- Mức khởi tạo tối thiểu: 300 điểm (Nhập môn).
- Mức trần tự khai báo: **850 điểm (TB+)**.
- *Quy tắc:* Điểm cao hơn 850 (TBK, Khá, Tốt) bắt buộc phải qua thi đấu cọ xát thực tế trên sân.

### Chi tiết 5 câu hỏi:
1. **Câu 1: Quá trình tập luyện & đào tạo:**
   - Tự chơi tự phát, chưa qua trường lớp: +0 điểm
   - Tự học qua YouTube / bạn bè chỉ bảo: +50 điểm
   - Từng tập luyện với HLV / lớp phong trào 3-6 tháng: +120 điểm
   - Tập luyện bài bản trên 1 năm / có nền tảng năng khiếu: +200 điểm

2. **Câu 2: Khả năng xử lý cầu cuối sân (Phông cầu / Đập cầu):**
   - Đánh hụt hoặc chỉ phông được tới giữa sân: +0 điểm
   - Phông cầu đều tay từ vạch cuối sân sang vạch cuối sân đối phương: +60 điểm
   - Đập cầu có lực, biết chém cầu hoặc bỏ nhỏ cài lưới: +100 điểm
   - Điều cầu linh hoạt mọi góc sân, bật đập cầu uy lực: +150 điểm

3. **Câu 3: Khả năng phòng thủ & Phản tạt:**
   - Thường đứng yên, khó thủ được các quả đập nhanh: +0 điểm
   - Thủ được các quả đập thẳng, phản tạt ngang lưới cơ bản: +100 điểm
   - Kê cầu sát lưới đổi thế, bung cầu linh hoạt sang hai góc chết: +150 điểm

4. **Câu 4: Bộ pháp di chuyển trên sân:**
   - Di chuyển tự do theo bản năng, dễ bị với cầu: +0 điểm
   - Biết bộ pháp cơ bản nhưng di chuyển lùi còn chậm: +50 điểm
   - Bộ pháp tương đối thanh thoát, giữ được trọng tâm cơ thể: +100 điểm
   - Bộ pháp chuẩn xác, tốc độ cao, bao quát tốt 4 góc sân: +130 điểm

5. **Câu 5: Kinh nghiệm đánh đôi & Phối hợp chiến thuật:**
   - Chưa rõ vị trí đứng, thường xuyên tranh cầu hoặc nhường cầu: +0 điểm
   - Nắm được quy tắc công đứng trước-sau, thủ đứng ngang: +50 điểm
   - Phối hợp bọc lót tốt, biết chủ động bắt lưới hoặc lùi thủ: +100 điểm
   - Đọc tình huống nhạy bén, phối hợp ăn ý các bài đánh chiến thuật: +150 điểm

---

## 3. Kết Quả & Chuyển Đổi Hạng Ban Đầu

Sau khi chọn xong câu thứ 5, Backend cập nhật:
- `onboarding_step = 5`
- `elo_rating = initialElo`
- `tier_name`: Xác định theo Taxonomy v2 (ví dụ: 300-399 -> Nhập môn, 400-549 -> Yếu, 550-699 -> TBY, 700-799 -> TB, 800-850 -> TB+).
- Nhãn VĐV ban đầu: **Tạm tính (0/5 trận)**. Cần hoàn thành 5 trận thi đấu thực tế để định hình Elo chuẩn xác.

