# Thư Viện Tài Liệu Dự Án SportXP (SportXPv2 Documentation)

> **Cập nhật:** 10/11/2026  
> **Phiên bản hệ thống:** SportXPv2 (Modular Monolith Spring Boot 3 + Supabase Postgres + React Tailwind Web App)  
> **Định hướng chiến lược:** B2C-First (BYOV - Bring Your Own Venue)  
> **Thời gian phát triển:** 3–5 tháng (Từ nền tảng Auth đến Commercial Launch)

---

## 🧭 Bản Đồ Tài Liệu Theo Phòng Ban (Department Index)

Tài liệu dự án được cấu trúc lại thành 3 khối chuyên môn chính để các phòng ban dễ dàng theo dõi, tra cứu và đối soát chéo:

```
docs/
├── README.md                          # [Bản đồ tài liệu tổng quan - Bạn đang ở đây]
│
├── 🏢 KHỐI CHIẾN LƯỢC & SẢN PHẨM (PRODUCT & BUSINESS)
│   ├── product-decisions.md           # Quyết định sản phẩm v2.3: BYOV, Flow A/B, P2P VietQR, Trust Score
│   ├── how-elo-works.md               # Bộ máy toán học Elo 20 bậc, Dynamic K-Factor, chống gian lận
│   └── onboarding.md                  # Quy trình Onboarding người dùng & cấp điểm trình ban đầu
│
├── ⚙️ KHỐI KỸ THUẬT & HẠ TẦNG (ENGINEERING & ARCHITECTURE)
│   ├── architecture.md                # Kiến trúc tổng thể hệ thống 3 lớp (Web, Spring Boot 3, Supabase)
│   ├── backend-implementation-plan.md # Kế hoạch chi tiết triển khai 6 Feature Modules Backend (v2.2)
│   ├── backend-detailed-design.md     # Đặc tả chi tiết RESTful API Endpoints, DTOs & Schema Mapping
│   └── algorithms-master-spec.md      # [MỚI - v3.0] Bản đặc tả thuật toán & kiến trúc (Glicko-2, H3, Tournament OS, Edge AI)
│
└── 🎨 KHỐI THIẾT KẾ & TRẢI NGHIỆM (UI/UX & DESIGN SYSTEM)
    ├── design-direction.md            # Triết lý thiết kế thể thao hiện đại, Bento Grid, chống template slop
    └── palettes.md                    # Bảng mã màu chuẩn WCAG (Court Emerald #00D665, Dark, Amber, Mint)
```

---

## 1. Tóm Tắt Khối Chiến Lược & Sản Phẩm (Product & Business)

* **[product-decisions.md](product-decisions.md):** 
  * Quyết nghị chuyển dịch 100% sang **B2C-First (Mô hình BYOV)**: Người dùng tự mang sân đã đặt ngoài đời vào app; app đóng vai trò là sảnh ghép kèo, bảo chứng uy tín và cưa bill văn minh.
  * Tách biệt 2 luồng: **Flow A (Tuyển vãng lai lấp slot - Unrated)** và **Flow B (Kèo kín tính Elo 1v1/2v2 - Mutual Consent)**.
  * Giải pháp thanh toán **Peer-to-Peer VietQR (Non-Escrow)** tránh rủi ro pháp lý giấy phép trung gian thanh toán.
* **[how-elo-works.md](how-elo-works.md):** 
  * Cơ chế tính điểm Elo học hỏi từ Chess.com: Adaptive K-factor (K=10 đến K=32), áp trần đối đầu H2H tối đa 2 trận/ngày giữa 2 đối thủ để chống cày điểm chéo.
* **[onboarding.md](onboarding.md):** 
  * Bộ câu hỏi khảo sát kinh nghiệm để gán mức Rank khởi điểm (Đồng, Bạc, Vàng, Kim Cương), giải quyết bài toán Cold Start.

---

## 2. Tóm Tắt Khối Kỹ Thuật & Hạ Tầng (Engineering & Architecture)

* **[architecture.md](architecture.md):** 
  * Mô hình 3 lớp chuẩn mực: Client (React 18 TypeScript PWA) ➔ Backend (Java 17/21 Spring Boot 3 Modular Monolith) ➔ Database (Supabase Cloud PostgreSQL 15 qua cổng PgBouncer 6543).
  * Giữ vững kiến trúc Monolith, không phân tách microservices phức tạp ở giai đoạn hiện tại.
* **[backend-implementation-plan.md](backend-implementation-plan.md):** 
  * Kế hoạch triển khai 6 Feature Modules bên trong `exe.sportxp.backend`: `core/`, `room/`, `match/`, `post/`, `ranking/`, `profile/`, `court/`.
  * Danh mục 25 API endpoints chuẩn RESTful.
  * Cấu hình HikariCP Pool kết nối PgBouncer Transaction Mode (`prepareThreshold=0`).
* **[backend-detailed-design.md](backend-detailed-design.md):** 
  * Chi tiết cấu trúc DTO, Request/Response body và logic xử lý nghiệp vụ cho từng Service.
* **[algorithms-master-spec.md](algorithms-master-spec.md):** 
  * [MỚI - v3.0] Đặc tả toàn diện 5 cỗ máy thuật toán: Continuous Glicko-2 & Bayesian 2v2 Decomposition, Uber H3 Geospatial & Smart Matchmaking, Tournament OS (Swiss Edmonds' Blossom, Seeding Elimination, Berger Round-Robin), Feed Gravity Time-Decay & Jaccard Social Graph, Edge AI Pose Biomechanics Coach (MediaPipe Wasm/WebGL chạy 100% Client-side).
  * Giải thuật triệt tiêu Deadlock bằng Canonical ID Ordering và SLA API < 25ms.

---

## 3. Tóm Tắt Khối Thiết Kế & Trải Nghiệm (UI/UX & Design System)

* **[design-direction.md](design-direction.md):** 
  * Triết lý giao diện thể thao cao cấp: Bố cục Bento Grid, thẻ bo góc nhẹ, viền mờ tinh tế, hiển thị tối ưu ngoài trời và thao tác dưới 3 chạm khi tay ướt mồ hôi trên sân.
* **[palettes.md](palettes.md):** 
  * Màu sắc chủ đạo: **Court Emerald (`#00D665`)** làm điểm nhấn thương hiệu; Nền tối **Court Dark (`#07080A`)** hoặc Nền sáng **Court Light (`#F8FAF9`)**; Điểm nhấn ngữ cảnh: **Amber (`#F5A623`)** cho Cúp/Streak và **Mint (`#E6F4EA`)** cho trạng thái xác nhận.

---

## 4. Lộ Trình Phát Triển Kỹ Thuật 3–5 Tháng (Master Engineering Roadmap)

```
[ GIAI ĐOẠN 1: THÁNG 1 - NỀN TẢNG MODULAR MONOLITH & KẾT NỐI API ]
├── Hoàn thiện 6 Module Backend Spring Boot 3 theo backend-implementation-plan.md
└── Bỏ Mock Data ở Frontend, kết nối các màn hình Phòng & Hồ sơ với API thực tế.

[ GIAI ĐOẠN 2: THÁNG 2 - BỘ MÁY ELO & P2P VIETQR BILL SPLITTER ]
├── Bộ máy tính điểm Elo 20 bậc kèm Mutual Consent và trần đối đầu H2H.
└── Cơ chế tự động cưa bill cuối buổi và sinh mã VietQR động thanh toán P2P cho Host.

[ GIAI ĐOẠN 3: THÁNG 3 - BẢN TIN RETENTION & AI POSE COACH ]
├── Match Recap Feed (Strava cầu lông) & Hệ thống đánh giá Review cụm sân (UGC).
└── Tích hợp MediaPipe Pose WebAssembly trên máy khách (Client-side) để sửa dáng đập cầu.

[ GIAI ĐOẠN 4: THÁNG 4 - HỆ THỐNG GÓI CƯỚC & CLUB/TOURNAMENT OS ]
├── Tự động hóa kích hoạt gói Hội viên qua biến động số dư VietQR (Casso/SeAPay).
└── Công cụ tự động bốc thăm, chia nhánh thi đấu và màn hình Live Scoreboard giải đấu.

[ GIAI ĐOẠN 5: THÁNG 5 - PILOT THỰC TẾ, KIỂM THỬ TẢI & COMMERCIAL LAUNCH ]
├── Chạy thử nghiệm Pilot tại 3-5 cụm sân trọng điểm tại TP.HCM (Q.10, Tân Bình).
└── Tối ưu Cache Caffeine, kiểm thử tải (Load test), bảo mật và Go-Live chính thức.
```

