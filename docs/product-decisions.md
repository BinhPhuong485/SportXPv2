# Quyết định Sản phẩm & Quy chuẩn Nghiệp vụ SportXPv2

> Cập nhật: 10/11/2026 — **v2.3 UPDATED**.  
> Tài liệu chuẩn hóa toàn bộ luật nghiệp vụ sản phẩm (Product Decisions) cho hệ sinh thái SportXPv2.

---

## 1. Định Vị Chiến Lược: 100% B2C-First (Mô hình BYOV - Bring Your Own Venue)

Dự án SportXP thống nhất **tập trung 100% vào tệp người dùng cuối (B2C - Người chơi phong trào & Chủ kèo/Host)** thay vì đi theo hướng B2B Đặt Sân:
* **Không làm B2B Booking đại trà:** Không cạnh tranh trực diện với các nền tảng quản lý sân (Alobo, Datsan247, S-Minton) hay tranh giành hoa hồng đặt sân trong khung giờ vàng (giờ cao điểm vốn đã kín khách quen).
* **Mô hình BYOV (Người dùng tự mang sân vào):** Host tự đặt sân ở ngoài đời, lên SportXP tạo kèo tìm người (Flow A) hoặc thách đấu leo rank (Flow B). SportXP giải quyết bài toán ghép cạ cứng, chống bùng kèo và chia tiền văn minh.
* **Tận dụng Viral Loop (K > 1):** Cầu lông 80% là đánh đôi (2v2 = 4 người). Mỗi Host tạo phòng sẽ tự động gửi link qua Zalo/Facebook để rủ 3 người còn lại tham gia, giúp ứng dụng tăng trưởng tự nhiên với chi phí Marketing (CAC) gần như bằng 0.

---

## 2. Tách biệt 2 Luồng Nghiệp vụ Phòng (Flow A vs Flow B)

Để giải quyết mâu thuẫn giữa nhu cầu "tìm người chơi cho đủ sân" và "thi đấu leo hạng nghiêm túc", hệ thống phân tách thành hai luồng độc lập:

### 2.1 Flow A: Phòng Tuyển Quân Công Khai (`PUBLIC_RECRUIT`)
- **Mục đích:** Bảng tin dành cho các hội nhóm hoặc chủ sân đang thiếu người, cần tuyển thành viên vãng lai lấp chỗ trống.
- **Khám phá:** Hiển thị công khai trên sảnh tìm kèo theo vị trí sân và khoảng cách.
- **Yêu cầu trình độ:** Hiển thị rõ dải trình mong muốn (ví dụ: TB- đến TB+) để người chơi tự đối chiếu trước khi đăng ký.
- **Tính điểm Elo:** Mặc định **Unrated (Không tính điểm)** nhằm tạo tâm lý thoải mái cho người chơi mới/giao lưu, tránh áp lực rank. Nếu hai người trong buổi muốn thi đấu tính điểm, họ có thể tự mở Flow B.
- **Tiện ích:** Có nút mở trực tiếp **Link nhóm Zalo buổi chơi** do Host đính kèm để thành viên trao đổi cách thức vào sân.

### 2.2 Flow B: Phòng Cáp Kèo So Vợt Kín (`PRIVATE_RATED`)
- **Mục đích:** Dành cho các nhóm bạn, CLB hoặc các cặp đối thủ hẹn nhau thi đấu tính điểm Elo chính thức.
- **Khám phá:** Ẩn hoàn toàn khỏi sảnh công khai. Chỉ những người có **Mã phòng 6 ký tự** (Join Code) hoặc nhận được link mời trực tiếp mới có thể xem và tham gia.
- **Cơ chế Tính điểm sau khi Hoàn thành (Post-Match Consensus):**
  - Trận đấu đơn (1v1): Bắt buộc **cả 2 người chơi** phải bấm xác nhận tỉ số trên điện thoại.
  - Trận đấu đôi (2v2): Bắt buộc **đại diện cả 2 đội** (hoặc cả 4 thành viên) bấm đồng ý.
  - Nếu có bất đồng (Dispute): Trận đấu chuyển sang trạng thái `DISPUTED`, hệ thống **đóng băng điểm**, không cộng trừ Elo cho bất kỳ bên nào cho đến khi hai bên tự hòa giải hoặc bị hủy (`VOID`) sau 24h.

---

## 3. Hệ thống Elo Chống Gian Lận (Tham khảo mô hình Chess.com)

Thay vì chỉ giới hạn thi đấu tính điểm trong các giải đấu lớn, SportXP áp dụng cơ chế đánh giá trình độ linh hoạt:

1. **Hệ số biến động K động (Dynamic K-Factor):**
   - **Đấu giao lưu thường / Bạn bè quen mặt:** Hệ số K = 8 đến 10. Điểm số thắng/thua chỉ dao động rất nhỏ (±2 đến ±5 Elo), loại bỏ động cơ lập nick ảo để cày điểm chéo (Rating farming).
   - **Gặp đối thủ mới (chưa từng đấu hoặc cùng Rank Tier):** Hệ số K = 16 đến 20.
   - **Trận đấu có Host / Trọng tài bảo chứng (Official Match):** Hệ số K = 32.
2. **Áp trần đối đầu trực tiếp (Head-to-Head Capping):**
   - Trong vòng 24 giờ, giữa 2 người chơi (hoặc 2 cặp VĐV) chỉ được tính Elo tối đa **2 trận đầu tiên**.
   - Từ trận thứ 3 trở đi trong ngày giữa cùng đối thủ, hệ thống tự động đánh dấu là **Unrated** (giao lưu không biến động Elo).
3. **Chế độ Đấu tập (Casual Toggle):**
   - Người chơi có quyền chọn "Đánh tập không tính điểm" trước khi bấm bắt đầu trận đấu.

---

## 4. Giải Pháp Thanh Toán & Chống Bùng Kèo: Peer-to-Peer VietQR (Non-Escrow)

* **Không làm Trung gian giữ tiền (Non-Escrow):** Tuyệt đối không giữ tiền của người dùng trong hệ thống để tránh rủi ro pháp lý về Giấy phép Trung gian thanh toán của Ngân hàng Nhà nước.
* **Bảng cưa bill cuối buổi (P2P Bill Splitter):**
  - Kết thúc buổi chơi, Host nhập chi phí thực tế: *Tiền sân + Tiền cầu + Tiền nước*.
  - Hệ thống tự động chia đều cho các thành viên chính thức.
  - Màn hình mỗi người hiển thị nút **"Thanh toán ngay"**, bấm vào sẽ tự động mở app ngân hàng quét **Mã VietQR động** chuyển tiền trực tiếp vào tài khoản của Host.
* **Chống bùng kèo bằng Điểm Uy Tín (Trust Score) & Blacklist:**
  - Thành viên bùng tiền hoặc bỏ slot không báo trước sẽ bị Host gắn cờ (Report).
  - Hệ thống trừ tụt điểm uy tín (Trust Score). Nếu Trust Score dưới 80, tài khoản bị hạn chế tham gia các phòng công khai.

---

## 5. Trang Chủ, Bảng Tin & Đánh Giá Cụm Sân

Để ứng dụng không bị biến thành một công cụ tìm kèo khô khan, Trang chủ đóng vai trò là "Nhật ký thể thao & Review sân" (Sport Diary & Community Feed):

1. **Thanh Lịch sắp tới (Upcoming Rooms Strip):**
   - Nằm ngay đầu Trang chủ, nhắc nhở lịch hẹn chơi cầu tối nay hoặc các ngày kế tiếp.
2. **Bài viết Tóm tắt sau trận (Match Recap Posts):**
   - Sau khi kết thúc buổi chơi, người tham gia có thể đăng bài tổng kết: Đính kèm thành tích (set thắng, chuỗi trận, điểm số), ảnh chụp sân cùng đồng đội.
3. **Đánh giá & Review Sân Cầu Lông (UGC):**
   - Cho phép người chơi viết đánh giá cho sân cầu lông mà họ vừa trải nghiệm (1-5 sao về thảm, trần, ánh sáng, giá nước, bãi đỗ xe).
   - Đóng vai trò là nguồn dữ liệu quý giá hỗ trợ SEO Google.

---

## 6. Bảng Xếp Hạng Đa Chiều (Rankings)

1. **BXH Theo Sân Cầu Lông (Home Court Leaderboard):**
   - Tôn vinh những tay vợt xuất sắc nhất tại từng cụm sân ruột, tạo văn hóa tự hào sân nhà.
2. **BXH Theo Khu Vực (Regional Leaderboard):**
   - Xếp hạng theo Quận/Huyện hoặc Tỉnh/Thành phố.
3. **Phân cấp 20 Bậc Trình độ (Skill Taxonomy v2):**
   - Từ Nhập môn, Yếu, TBY, TB, TB+, TBK, Khá, Tốt đến Cao thủ phong trào.

---

## 7. Trạng Thái Các Hạng Mục Kinh Doanh & Kỹ Thuật

1. **Cấu trúc Gói Thu Tiền (Pricing Packages):** Đang trong giai đoạn khảo sát và sẽ hoàn thiện biểu phí chính thức trong phiên họp Hội đồng tiếp theo. Khung dự kiến gồm 3 gói (Free - Pro 49k/tháng [Recommended] - Club/Tournament).
2. **Lộ trình Phát triển Kỹ thuật:** Toàn bộ dự án có **kỳ hạn 3–5 tháng** để hoàn thiện trọn vẹn sản phẩm từ nền tảng Auth hiện tại tới bản phát hành thương mại (Commercial Launch).
