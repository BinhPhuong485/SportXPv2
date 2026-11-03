# Hệ thống Tính Điểm Elo & Phân Cấp Trình Độ — SportXPv2

> Cập nhật: 31/10/2026.  
> Tài liệu quy chuẩn cách tính Elo, phân cấp trình độ phong trào và các thuật toán chống cày điểm gian lận trong SportXPv2.

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

## 3. Công Thức Tính Elo Trận Đấu

### 3.1 Xác suất Thắng Kỳ Vọng (Expected Outcome)
Cho hai bên A và B có điểm số là `Elo_A` và `Elo_B`:
- Hiệu số điểm: `D = Elo_B - Elo_A`
- Xác suất kỳ vọng bên A thắng: `E_A = 1 / (1 + 10^(D / 400))`
- Xác suất kỳ vọng bên B thắng: `E_B = 1 - E_A`

*Trong đánh đôi:* `Elo_A` và `Elo_B` được tính bằng **trung bình cộng Elo** của 2 thành viên trong đội:
- `Elo_A = (Elo_A1 + Elo_A2) / 2`
- `Elo_B = (Elo_B1 + Elo_B2) / 2`

### 3.2 Biến Động Điểm (Elo Delta)
- Kết quả thực tế $S$: Thắng = 1, Thua = 0.
- Điểm thay đổi của bên A: `Delta_Elo = round(K × (S_A - E_A))`
- Điểm thay đổi của bên B: `-Delta_Elo`

---

## 4. Cơ Chế Chống Gian Lận (Anti-Fraud & Dynamic K-Factor)

Học hỏi từ kinh nghiệm vận hành của Chess.com và Lichess:

### 4.1 Hệ Số K Động (Adaptive K-Factor)
*   **K = 8 đến 10 (Trận giao lưu / Bạn bè quen thuộc):** Áp dụng cho các trận đấu giữa hai người/cặp đã từng đấu với nhau trong 30 ngày qua. Biến động điểm chỉ từ $\pm 2$ đến $\pm 5$ điểm, khiến việc lập nick ảo để "bơm điểm" trở nên vô nghĩa vì mất quá nhiều thời gian mà không bõ công.
*   **K = 16 đến 20 (Trận đấu với đối thủ mới):** Áp dụng khi hai đối thủ lần đầu so vợt hoặc đã lâu không gặp. Điểm số phản ánh đúng sự biến động trình độ phong trào.
*   **K = 32 (Trận đấu có kiểm chứng / Có Host bảo chứng):** Trận đấu chính thức do Chủ sân hoặc Ban tổ chức giải duyệt kết quả.

### 4.2 Giới Hạn Đối Đầu Trong Ngày (Head-to-Head Cap)
*   Trong vòng 24 giờ, hệ thống chỉ tính điểm Elo cho **tối đa 2 trận đầu tiên** giữa cùng một cặp đấu.
*   Từ trận thứ 3 trở đi giữa hai bên trong ngày, trận đấu tự động chuyển sang chế độ **Unrated** (giao lưu giữ kỷ niệm, không thay đổi điểm xếp hạng).

### 4.3 Đồng Thuận Kết Quả (Mutual Consent Settlement)
*   Trận đấu đơn: Phải có 2/2 người bấm xác nhận tỉ số.
*   Trận đấu đôi: Đại diện cả hai đội bấm đồng ý.
*   Nếu một bên bấm "Khiếu nại (Dispute)": Trận đấu bị treo trạng thái `DISPUTED` và không tính điểm.

