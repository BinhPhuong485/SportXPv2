# Quyết định Sản phẩm & Quy chuẩn Nghiệp vụ SportXPv2

> Cập nhật: 31/10/2026.  
> Tài liệu chuẩn hóa toàn bộ luật nghiệp vụ sản phẩm (Product Decisions) cho hệ thống SportXPv2.

---

## 1. Tách biệt 2 Luồng Nghiệp vụ Phòng (Flow A vs Flow B)

Để giải quyết mâu thuẫn giữa nhu cầu "tìm người chơi cho đủ sân" và "thi đấu leo hạng nghiêm túc", hệ thống phân tách thành hai luồng độc lập:

### 1.1 Flow A: Phòng Tuyển Quân Công Khai (`PUBLIC_RECRUIT`)
- **Mục đích:** Bảng tin dành cho các hội nhóm hoặc chủ sân đang thiếu người, cần tuyển thành viên vãng lai lấp chỗ trống.
- **Khám phá:** Hiển thị công khai trên sảnh tìm kèo theo vị trí sân và khoảng cách.
- **Yêu cầu trình độ:** Hiển thị rõ dải trình mong muốn (ví dụ: TB- đến TB+) để người chơi tự đối chiếu trước khi đăng ký.
- **Tính điểm Elo:** Mặc định **Unrated (Không tính điểm)** nhằm tạo tâm lý thoải mái cho người chơi mới/giao lưu, tránh áp lực rank. Nếu hai người trong buổi muốn thi đấu tính điểm, họ có thể tự mở Flow B.
- **Tiện ích:** Có nút mở trực tiếp **Link nhóm Zalo buổi chơi** do Host đính kèm để thành viên trao đổi cách thức vào sân.

### 1.2 Flow B: Phòng Cáp Kèo So Vợt Kín (`PRIVATE_RATED`)
- **Mục đích:** Dành cho các nhóm bạn, CLB hoặc các cặp đối thủ hẹn nhau thi đấu tính điểm Elo chính thức.
- **Khám phá:** Ẩn hoàn toàn khỏi sảnh công khai. Chỉ những người có **Mã phòng 6 ký tự** (Join Code) hoặc nhận được link mời trực tiếp mới có thể xem và tham gia.
- **Cơ chế Tính điểm sau khi Hoàn thành (Post-Match Consensus):**
  - Trận đấu đơn (1v1): Bắt buộc **cả 2 người chơi** phải bấm xác nhận tỉ số trên điện thoại.
  - Trận đấu đôi (2v2): Bắt buộc **đại diện cả 2 đội** (hoặc cả 4 thành viên) bấm đồng ý.
  - Nếu có bất đồng (Dispute): Trận đấu chuyển sang trạng thái `DISPUTED`, hệ thống **đóng băng điểm**, không cộng trừ Elo cho bất kỳ bên nào cho đến khi hai bên tự hòa giải hoặc bị hủy (`VOID`).

---

## 2. Hệ thống Elo Chống Gian Lận (Tham khảo mô hình Chess.com)

Thay vì chỉ giới hạn thi đấu tính điểm trong các giải đấu lớn (làm hẹp tệp người dùng phong trào), SportXP áp dụng cơ chế đánh giá trình độ linh hoạt:

1. **Hệ số biến động K động (Dynamic K-Factor):**
   - **Đấu giao lưu thường / Bạn bè quen mặt:** Hệ số $K = 8$ đến $10$. Điểm số thắng/thua chỉ dao động rất nhỏ ($\pm 2$ đến $\pm 5$ Elo), loại bỏ động cơ lập nick ảo để cày điểm chéo (Rating farming).
   - **Gặp đối thủ mới (chưa từng đấu hoặc cùng Rank Tier):** Hệ số $K = 16$ đến $20$.
   - **Trận đấu có Host / Trọng tài bảo chứng (Official Match):** Hệ số $K = 32$.
2. **Áp trần đối đầu trực tiếp (Head-to-Head Capping):**
   - Trong vòng 24 giờ, giữa 2 người chơi (hoặc 2 cặp VĐV) chỉ được tính Elo tối đa **2 trận đầu tiên**.
   - Từ trận thứ 3 trở đi trong ngày giữa cùng đối thủ, hệ thống tự động đánh dấu là **Unrated** (giao lưu không biến động Elo).
3. **Chế độ Đấu tập (Casual Toggle):**
   - Người chơi có quyền chọn "Đánh tập không tính điểm" trước khi bấm bắt đầu trận đấu.

---

## 3. Trang chủ: Bản tin Hoạt động & Giữ chân Cộng đồng

Để ứng dụng không bị biến thành một công cụ tìm kèo khô khan, Trang chủ đóng vai trò là "Nhật ký thể thao & Review sân" (Sport Diary & Community Feed):

1. **Thanh Lịch sắp tới (Upcoming Rooms Strip):**
   - Nằm ngay đầu Trang chủ, nhắc nhở lịch hẹn chơi cầu tối nay hoặc các ngày kế tiếp.
2. **Bài viết Tóm tắt sau trận (Match Recap Posts):**
   - Sau khi kết thúc buổi chơi, người tham gia có thể đăng bài tổng kết:
     - Tự động đính kèm thành tích (Số set thắng, chuỗi trận, điểm số).
     - Đăng tải hình ảnh chụp tại sân cùng đồng đội.
     - Bạn bè có thể Thả tim (Like) và Bình luận (Comment).
3. **Đánh giá & Review Sân Cầu Lông:**
   - Cho phép người chơi viết đánh giá cho sân cầu lông mà họ vừa trải nghiệm (Đánh giá 1-5 sao kèm nhận xét về thảm sân, độ cao trần, ánh sáng, giá nước, bãi đỗ xe).
   - Đánh giá này sẽ hiển thị trực tiếp trong trang chi tiết của Sân, giúp cộng đồng tham khảo.

---

## 4. Bảng Xếp Hạng Đa Chiều (Rankings)

Bảng xếp hạng không chỉ có một danh sách toàn quốc mà được chia thành 3 lăng kính gần gũi:

1. **BXH Theo Sân Cầu Lông (Home Court Leaderboard):**
   - Người chơi chọn **Sân nhà (Home Court)** mà mình thường xuyên sinh hoạt nhất.
   - Bảng xếp hạng sẽ tôn vinh những "Tay vợt xuất sắc nhất tại Sân X", tạo ra văn hóa cạnh tranh địa phương lành mạnh.
2. **BXH Theo Khu Vực (Regional Leaderboard):**
   - Xếp hạng theo Quận/Huyện hoặc Tỉnh/Thành phố (ví dụ: Top VĐV Quận 10, Top VĐV TP. Thủ Đức...).
3. **Phân cấp 20 Bậc Trình độ (Skill Taxonomy v2):**
   - Từ Nhập môn, Yếu, TBY, TB, TB+, TBK, Khá, Tốt đến Cao thủ phong trào.

---

## 5. Hồ sơ Cá nhân & Tích hợp Mạng Xã Hội

1. **Hộ chiếu VĐV (Badminton Passport QR):**
   - Chứa mã định danh công khai (`public_id`) duy nhất.
   - Quét mã QR trực tiếp tại sân để xem hồ sơ và gửi yêu cầu kết bạn 2 chiều.
2. **Liên kết Zalo / Facebook cá nhân:**
   - Người chơi có thể cập nhật số điện thoại Zalo hoặc link Facebook trong hồ sơ để bạn bè/đồng đội trong kèo dễ dàng liên hệ ngoài đời.
3. **Gắn liền Sân Nhà (Home Court):**
   - Chọn sân quen thuộc để tự động tham gia vào Bảng xếp hạng của cụm sân đó.

---

## 6. Các Quyết định Tạm hoãn (Deferred / Backlog)

1. **Giải đấu (Tournaments):** Tạm thời giữ schema và giao diện tĩnh, tập trung toàn lực hoàn thiện Core Loop (Kèo đấu Flow A/B -> Chơi & Ghi điểm -> Bảng tin & Xếp hạng).
2. **Trung gian Thanh toán & Thu quỹ sân (Escrow):** Tuyệt đối không đứng ra nhận tiền hay giữ tiền cọc để tránh rủi ro pháp lý giấy phép trung gian thanh toán.

