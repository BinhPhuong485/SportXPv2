# Hệ thống Tính Điểm Elo & Phân Cấp Trình Độ — SportXPv2

> Cập nhật: 03/11/2026.  
> Tài liệu quy chuẩn cách tính Elo, phân cấp trình độ phong trào, phân bổ điểm 1v1 & 2v2, điều kiện lên Bảng xếp hạng và các thuật toán chống cày điểm gian lận trong SportXPv2.

---

## 1. Bảng Phân Cấp 20 Bậc Trình Độ (Skill Taxonomy v2)

Hệ thống phân cấp được xây dựng dựa trên khảo sát thực tế ngôn ngữ cầu lông phong trào Việt Nam (kết hợp các mốc từ ShopVNB, Yêu Cầu Lông, Mê Cầu Lông):

| Mã Enum | Tên Hiển Thị | Khoảng Elo | Tiêu chí kỹ thuật quan sát |
| :--- | :--- | :--- | :--- |
| `newbie` | **Nhập môn** | 0 – 399 | Mới làm quen luật, cách cầm vợt, bước di chuyển cơ bản (Khởi tạo tối thiểu 300) |
| `weakMinus` | **Yếu-** | 400 – 449 | Biết luật cơ bản nhưng đánh cầu qua lưới chưa đều, hay hụt cầu |
| `weak` | **Yếu** | 450 – 499 | Đánh được nhịp chậm; quả phông và giao cầu còn nhiều lỗi |
| `weakPlus` | **Yếu+** | 500 – 549 | Thực hiện được các cú đánh cơ bản; bộ pháp di chuyển còn bị động |
| `lowerIntermediateMinus` | **TBY-** | 550 – 599 | Bắt đầu có phản xạ cầu nhanh; vị trí đứng trên sân chưa ổn định |
| `lowerIntermediate` | **TBY** | 600 – 649 | Xử lý được các pha cầu quen tay; dễ lúng túng khi đối phương đổi hướng |
| `lowerIntermediatePlus` | **TBY+** | 650 – 699 | Biết giữ vị trí, bước đầu biết phối hợp bọc lót trong đánh đôi |
| `intermediateMinus` | **TB-** | 700 – 749 | Kỹ thuật cơ bản tương đối đầy đủ; độ chính xác giảm khi đối thủ đẩy tốc độ |
| `intermediate` | **TB** | 750 – 799 | Phông, đập, thủ cơ bản; duy trì được loạt cầu dài và biết chuyển đổi công thủ |
| `intermediatePlus` | **TB+** | 800 – 899 | Điều cầu có ý đồ chiến thuật, biết khai thác khoảng trống và đập cắm sân |
| `upperIntermediateMinus` | **TBK-** | 900 – 949 | Nền tảng kỹ thuật vững chắc; bắt đầu tạo thế chủ động ép đối phương |
| `upperIntermediate` | **TBK** | 950 – 999 | Phối hợp tốt chuỗi đường cầu; bọc lót nhịp nhàng trong đánh đôi |
| `upperIntermediatePlus` | **TBK+** | 1000 – 1099 | Đọc tình huống nhanh, phản xạ thủ cầu tốt; hiếm khi mắc lỗi ở quả cầu dễ |
| `advancedMinus` | **Khá-** | 1100 – 1199 | Có nhiều bài đánh đa dạng; bộ pháp thanh thoát, ổn định khi bị ép góc |
| `advanced` | **Khá** | 1200 – 1299 | Kiểm soát tốc độ trận đấu; đập cầu uy lực, chém cầu sát lưới chuẩn xác |
| `advancedPlus` | **Khá+** | 1300 – 1399 | Gây áp lực liên tục; biến hóa chiến thuật linh hoạt theo từng đối thủ |
| `strongMinus` | **Tốt-** | 1400 – 1499 | Duy trì chất lượng quả đánh ngay cả trong các pha cầu tốc độ rất cao |
| `strong` | **Tốt** | 1500 – 1599 | Khả năng tấn công và phòng ngự toàn diện ở trình độ phong trào đỉnh cao |
| `strongPlus` | **Tốt+** | 1600 – 1699 | Rất ổn định, có kinh nghiệm thi đấu nhiều giải phong trào lớn |
| `eliteAmateur` | **Cao thủ phong trào** | ≥ 1700 | Đẳng cấp hàng đầu hệ thống; tiệm cận trình độ cựu năng khiếu/bán chuyên |

---

## 2. Điểm Khởi Tạo Ban Đầu (Onboarding Quiz)

Người dùng mới tham gia trả lời bài trắc nghiệm tự đánh giá 5 câu hỏi để xác định mức điểm khởi điểm:

```
initialElo = clamp(300 + sum(question_points), 300, 850)
```

- Điểm tối thiểu: 300 (Nhập môn).
- Điểm trần tối đa khi tự khai báo: **850 (TB+)**.
- *Quy tắc:* Người chơi không thể tự chọn mức trên 850 qua trắc nghiệm. Mọi điểm số từ 900 trở lên (TBK, Khá, Tốt) bắt buộc phải đạt được thông qua thi đấu thực tế trên sân.

---

## 3. Công Thức Tính Elo Trận Đấu (1v1 & 2v2)

### 3.1 Xác định Điểm Đại diện Đội
- **Đánh Đơn (1v1):**
  - `Elo_TeamA = Elo_PlayerA`
  - `Elo_TeamB = Elo_PlayerB`
- **Đánh Đôi (2v2):**
  - Điểm đại diện mỗi đội được tính bằng **Trung bình cộng Elo** của 2 thành viên:
  - `Elo_TeamA = (Elo_A1 + Elo_A2) / 2`
  - `Elo_TeamB = (Elo_B1 + Elo_B2) / 2`

### 3.2 Xác suất Thắng Kỳ Vọng (Expected Outcome)
- Hiệu số điểm: `D = Elo_TeamB - Elo_TeamA`
- Xác suất kỳ vọng đội A thắng: `E_A = 1 / (1 + 10^(D / 400))`
- Xác suất kỳ vọng đội B thắng: `E_B = 1 - E_A`

### 3.3 Biến Động Điểm (Elo Delta)
- Kết quả thực tế `S`: Thắng = 1, Thua = 0.
- Điểm thay đổi của trận: `Delta_Elo = round(K × (S_A - E_A))`

### 3.4 Phân Bổ Điểm Cá Nhân Sau Trận
- **Đánh Đơn (1v1):**
  - Người thắng: `Elo_moi = Elo_cu + Delta_Elo`
  - Người thua: `Elo_moi = max(100, Elo_cu - Delta_Elo)`
- **Đánh Đôi (2v2) — Cơ chế Phân bổ Đồng đội (Flat Team Distribution):**
  - Cả hai thành viên đội thắng đều được cộng cùng một mức: `+Delta_Elo`
    - `Elo_A1_moi = Elo_A1_cu + Delta_Elo`
    - `Elo_A2_moi = Elo_A2_cu + Delta_Elo`
  - Cả hai thành viên đội thua đều bị trừ cùng một mức: `-Delta_Elo`
    - `Elo_B1_moi = max(100, Elo_B1_cu - Delta_Elo)`
    - `Elo_B2_moi = max(100, Elo_B2_cu - Delta_Elo)`
  - *Ý nghĩa thiết kế:* Cầu lông đôi là môn phối hợp gắn kết. Thắng cùng hưởng, thua cùng chia sẻ trách nhiệm, tránh tâm lý đổ lỗi "gánh team" hay "kéo rank".

---

## 4. Cơ Chế Chống Gian Lận & Hiệu Chuẩn Điểm

Học hỏi từ mô hình vận hành của Chess.com và Lichess:

### 4.1 Hệ Số K Động (Adaptive K-Factor)
- **K = 8 đến 10 (Trận bạn bè quen / Giao lưu thường):** Áp dụng cho các trận đấu giữa 2 bên đã từng thi đấu trong 30 ngày qua hoặc đã kết bạn. Điểm số chỉ dao động rất nhỏ (±2 đến ±5 Elo), triệt tiêu hoàn toàn động cơ lập nick ảo cày điểm chéo.
- **K = 16 đến 20 (Trận gặp đối thủ mới):** Áp dụng khi hai đối thủ lần đầu so vợt hoặc đã lâu không gặp nhau.
- **K = 32 (Trận đấu có kiểm chứng / Trọng tài / Host bảo chứng):** Áp dụng khi trận đấu có người thứ ba có thẩm quyền xác nhận hoặc thuộc sự kiện chính thức.

### 4.2 Giới Hạn Đối Đầu Trong Ngày (Head-to-Head Cap)
- Trong vòng 24 giờ, hệ thống chỉ tính Elo cho **tối đa 2 trận đầu tiên** giữa cùng một cặp đối thủ.
- Từ trận thứ 3 trở đi giữa hai bên trong ngày, trận đấu tự động chuyển sang chế độ **Unrated** (giao lưu không thay đổi điểm xếp hạng).

### 4.3 Đồng Thuận Kết Quả (Mutual Consent Settlement)
- Trận đơn (1v1): Cả 2 người chơi phải cùng bấm Xác nhận trên điện thoại.
- Trận đôi (2v2): Ít nhất 1 đại diện bên A và 1 đại diện bên B bấm Xác nhận.
- Nếu có bên bấm "Khiếu nại (Dispute)": Trận đấu chuyển sang trạng thái `DISPUTED`, khóa toàn bộ biến động điểm.

### 4.4 Cơ Chế Chuỗi Thắng (Win Streak) & Hiệu Chuẩn (Calibration)
- **Giai đoạn hiệu chuẩn (5 trận đầu tiên):** Điểm số dao động mạnh hơn để nhanh chóng xóa bỏ sai số do người dùng tự khai báo lúc làm bài Quiz ban đầu.
- **Thưởng Chuỗi Thắng (Win Streak Bonus):** Khi người chơi đạt chuỗi thắng từ 3 trận liên tiếp trở lên (`win_streak >= 3`), mỗi trận thắng tiếp theo được thưởng thêm `+3` đến `+5` Elo. Giúp các tay vợt có trình độ thật (hoặc smurf) nhanh chóng leo về đúng bậc rank của mình mà không làm phiền người chơi ở trình độ thấp.

---

## 5. Tiêu Chuẩn Điều Kiện Lên Bảng Xếp Hạng (Leaderboard Qualification)

Nhằm ngăn chặn hiện tượng "VĐV du lịch" (đến sân lạ đánh 1 trận ăn may rồi chiếm top 1 vĩnh viễn), hệ thống áp dụng ngưỡng hoạt động tối thiểu:

1. **Bảng Xếp Hạng Cụm Sân (Home Court Leaderboard):**
   - **Điều kiện:** Hoàn thành tối thiểu **5 trận đấu tính điểm** tại chính cụm sân đó (`court_id`).
   - *Mục đích:* Tôn vinh các tay vợt sinh hoạt thường xuyên và gắn bó với sân nhà.
2. **Bảng Xếp Hạng Khu Vực (Regional Leaderboard - Quận/Huyện):**
   - **Điều kiện:** Hoàn thành tối thiểu **5 trận đấu tính điểm** tại các sân nằm trong cùng Quận/Huyện (`district`).
   - *Ví dụ:* Đánh 2 trận ở Sân A (Quận 10) và 3 trận ở Sân B (Quận 10) → Chưa đủ 5 trận tại từng sân con nên chưa lên BXH Sân A hay B, nhưng tổng đạt 5 trận tại Quận 10 → **Đủ điều kiện xuất hiện trên BXH Quận 10**.
3. **Bảng Xếp Hạng Toàn Quốc (Global Leaderboard):**
   - **Điều kiện:** Hoàn thành tối thiểu **5 trận đấu tính điểm** trên toàn hệ thống SportXP.

---

## 6. Phân Hệ Giải Đấu (Tournaments Engine) — Định Vị Lộ Trình

- **Giai đoạn MVP (Mốc 10 ngày):** Phân hệ giải đấu tạm thời đóng băng (chỉ giữ schema cơ bản). Hệ thống tập trung tối đa vào **Core Loop: Tạo kèo đấu 1v1 / 2v2 → Nhập kết quả & Đồng thuận → Tính toán Elo & Bảng xếp hạng**.
- **Roadmap dài hạn (5–6 tháng sau):** Sẽ triển khai bộ máy bốc thăm tự động chia nhánh (Single Elimination, Double Elimination, Round Robin) và cơ chế cộng điểm thưởng danh hiệu (Cup Elo Bonus) cho các giải đấu chính thức.
