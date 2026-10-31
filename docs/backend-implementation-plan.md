# Đặc Tả Kiến Trúc & Kế Hoạch Triển Khai Backend Modular Monolith (Spring Boot 3) — SportXPv2

> Cập nhật: 31/10/2026.  
> Tài liệu thiết kế kỹ thuật toàn diện cho dịch vụ Backend (thư mục `backend/`) xây dựng theo kiến trúc **Modular Monolith (Package by Feature)** bằng **Java 17/21 + Spring Boot 3.x**, kết nối cơ sở dữ liệu **Supabase PostgreSQL**.

---

## 1. Mục tiêu & Định vị Công nghệ cho `backend/`

*   **Ngôn ngữ & Runtime:** Java 17 hoặc 21 (LTS).
*   **Framework cốt lõi:** **Spring Boot 3.x**
*   **Mô hình Kiến trúc:** **Modular Monolith (Package by Feature)** — Chia gói theo từng miền nghiệp vụ (Domain Bounded Contexts) để tăng tính gắn kết (Cohesion), che giấu logic nội bộ (Encapsulation) và dễ dàng bảo trì.
*   **Package Root:** `exe.sportxp.backend`
*   **Các Starter & Thư viện Chính:**
    *   `spring-boot-starter-web`: Xây dựng RESTful API.
    *   `spring-boot-starter-data-jpa`: Tương tác với PostgreSQL qua Hibernate / JPA.
    *   `spring-boot-starter-security` & `spring-boot-starter-oauth2-resource-server`: Xác thực Supabase JWT Bearer token tự động qua OIDC / JWKS.
    *   `spring-boot-starter-validation`: Xác thực dữ liệu đầu vào (Jakarta Validation).
    *   `org.postgresql:postgresql`: PostgreSQL JDBC Driver.
    *   `org.projectlombok:lombok`: Tối ưu mã nguồn boilerplate.

---

## 2. Cấu trúc Khung Thư Mục Modular Monolith trong `backend/`

Dự án được phân chia thành các Module độc lập bên trong `backend/src/main/java/exe/sportxp/backend/`:

```
backend/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── exe/
│   │   │       └── sportxp/
│   │   │           └── backend/
│   │   │               ├── BackendApplication.java
│   │   │               │
│   │   │               ├── core/                           # 0. HẠ TẦNG DÙNG CHUNG (INFRASTRUCTURE & CROSS-CUTTING)
│   │   │               │   ├── config/                     # SecurityConfig, CorsConfig, OpenApiConfig
│   │   │               │   ├── security/                   # JwtDecoder, UserPrincipal, SecurityUtils
│   │   │               │   ├── exception/                  # GlobalExceptionHandler, BusinessException
│   │   │               │   └── util/                       # CodeGenerator (sinh mã phòng), DateUtils
│   │   │               │
│   │   │               ├── room/                           # 1. MODULE KÈO ĐẤU (FLOW A & FLOW B)
│   │   │               │   ├── controller/                 # RoomController
│   │   │               │   ├── service/                    # RoomService
│   │   │               │   ├── repository/                 # MatchRoomRepository, RoomMemberRepository
│   │   │               │   ├── domain/                     # MatchRoom, RoomMember, RoomType, RoomStatus
│   │   │               │   └── dto/                        # CreateRoomRequest, RoomDetailResponse...
│   │   │               │
│   │   │               ├── match/                          # 2. MODULE TRẬN ĐẤU & BỘ MÁY ELO
│   │   │               │   ├── controller/                 # MatchController
│   │   │               │   ├── service/                    # MatchService (đồng thuận), EloEngine (tính điểm)
│   │   │               │   ├── repository/                 # SessionMatchRepository
│   │   │               │   ├── domain/                     # SessionMatch, MatchStatus, MatchType
│   │   │               │   └── dto/                        # SubmitScoreRequest, MatchConfirmRequest...
│   │   │               │
│   │   │               ├── post/                           # 3. MODULE BẢN TIN TRANG CHỦ & REVIEW SÂN
│   │   │               │   ├── controller/                 # PostController
│   │   │               │   ├── service/                    # PostService
│   │   │               │   ├── repository/                 # PostRepository, PostLikeRepository, PostCommentRepository
│   │   │               │   ├── domain/                     # Post, PostLike, PostComment, PostType
│   │   │               │   └── dto/                        # CreatePostRequest, PostResponse...
│   │   │               │
│   │   │               ├── ranking/                        # 4. MODULE BẢNG XẾP HẠNG ĐA CHIỀU
│   │   │               │   ├── controller/                 # LeaderboardController
│   │   │               │   ├── service/                    # LeaderboardService (BXH toàn quốc, theo sân, khu vực)
│   │   │               │   ├── repository/                 # (Truy vấn tối ưu từ profiles & courts)
│   │   │               │   ├── domain/                     # RankTier (Enum 20 bậc)
│   │   │               │   └── dto/                        # LeaderboardResponse, PlayerRankDto...
│   │   │               │
│   │   │               ├── profile/                        # 5. MODULE HỒ SƠ & BẠN BÈ
│   │   │               │   ├── controller/                 # ProfileController
│   │   │               │   ├── service/                    # ProfileService
│   │   │               │   ├── repository/                 # ProfileRepository, FriendshipRepository
│   │   │               │   ├── domain/                     # Profile, Friendship
│   │   │               │   └── dto/                        # ProfileResponse, UpdateProfileRequest...
│   │   │               │
│   │   │               └── court/                          # 6. MODULE CỤM SÂN CẦU LÔNG
│   │   │                   ├── controller/                 # CourtController
│   │   │                   ├── service/                    # CourtService
│   │   │                   ├── repository/                 # CourtRepository
│   │   │                   ├── domain/                     # Court
│   │   │                   └── dto/                        # CourtResponse...
│   │   │
│   │   └── resources/
│   │       ├── application.yaml                            # Cấu hình Datasource, JPA, Supabase JWKS
│   │       └── application-prod.yaml
│   └── test/
```

---

## 3. Cấu hình Bảo Mật & Xác thực JWT với Supabase

Client (React Web trong `frontend/`) đăng nhập qua Supabase Auth và gửi Bearer Token qua Header:
`Authorization: Bearer <supabase_access_token>`.

### Cấu hình `application.yaml`:
```yaml
server:
  port: 8080

spring:
  application:
    name: sportxp-backend

  datasource:
    url: jdbc:postgresql://yjcqaxszvmpnlmypxjqq.supabase.co:5432/postgres?sslmode=require
    username: postgres
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    show-sql: false

  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://yjcqaxszvmpnlmypxjqq.supabase.co/auth/v1
```

---

## 4. Đặc Tả Chi Tiết Nghiệp Vụ Từng Feature Module

### 4.1 Module Kèo Đấu (`room/`)
*   **Flow A: Tuyển Người Công Khai (`PUBLIC_RECRUIT`):**
    - Mặc định `is_rated = false` (Unrated), hiển thị công khai trên sảnh.
    - Hỗ trợ lưu `zalo_group_link` để thành viên vào trao đổi.
*   **Flow B: Kèo So Vợt Kín (`PRIVATE_RATED`):**
    - `is_rated = true`, ẩn khỏi sảnh công khai.
    - Server tự sinh mã phòng 6 ký tự `join_code` ngẫu nhiên (ví dụ: `XP-8492`).
*   **Quản lý Slot & Waitlist FIFO:**
    - Khi phòng đầy slot, người đăng ký sau tự động chuyển sang `WAITLIST`.
    - Khi có thành viên rời phòng, người đầu tiên trong Waitlist tự động được đôn lên `REGISTERED`.

### 4.2 Module Trận Đấu & Bộ Máy Elo (`match/`)
*   **Nhập kết quả:** VĐV tạo bản ghi trận đấu (`singles` hoặc `doubles`, tỉ số từng set). Khởi tạo `status = pending`.
*   **Đồng thuận 2 chiều (Mutual Consent):**
    - Đơn: Cả 2 VĐV cùng bấm xác nhận.
    - Đôi: Đại diện cả 2 đội (hoặc cả 4 thành viên) cùng bấm xác nhận.
    - Nếu có khiếu nại -> Chuyển thành `disputed`, khóa điểm Elo.
*   **Bộ máy tính Elo (`EloEngine`):**
    - Áp trần đối đầu H2H (tối đa 2 trận/ngày giữa cùng đối thủ).
    - Hệ số K động: $K = 8$ đến $10$ cho bạn bè quen; $K = 16$ đến $20$ cho đối thủ mới.
    - Cập nhật điểm, hạng (`tier_name`) và chuỗi thắng (`win_streak`) trong `@Transactional`.

### 4.3 Module Bản Tin Trang Chủ (`post/`)
*   Hỗ trợ 3 loại bài viết: `match_recap` (gắn với buổi chơi), `court_review` (gắn với sân kèm đánh giá 1–5 sao), và `general` (bài thường).
*   Quản lý Thả tim (`post_likes`) và Bình luận (`post_comments`).
*   Tự động tính lại điểm sao trung bình (`rating`) và `review_count` cho sân trong bảng `courts`.

### 4.4 Module Bảng Xếp Hạng Đa Chiều (`ranking/`)
*   **BXH Toàn quốc:** Sắp xếp theo `elo_rating` giảm dần.
*   **BXH Sân nhà (Home Court Leaderboard):** Lọc theo `home_court_id`.
*   **BXH Khu vực (Regional Leaderboard):** Lọc theo `district` hoặc `city`.

### 4.5 Module Hồ Sơ & Mạng Xã Hội (`profile/`)
*   Quản lý Hộ chiếu QR VĐV (`public_id`).
*   Cập nhật sân nhà (`home_court_id`), số điện thoại Zalo, link Facebook, tiểu sử lối đánh.

---

## 5. Danh Sách RESTful API Endpoints Đầy Đủ

| Module | Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Room** | `POST` | `/api/rooms` | Authenticated | Tạo phòng (Flow A hoặc Flow B) |
| | `GET` | `/api/rooms` | Public / Auth | Danh sách phòng Flow A theo khu vực sân, trình độ |
| | `POST` | `/api/rooms/lookup-code` | Authenticated | Tra cứu phòng Flow B bằng `join_code` |
| | `GET` | `/api/rooms/{id}` | Authenticated | Chi tiết phòng, danh sách VĐV, danh sách chờ |
| | `POST` | `/api/rooms/{id}/join` | Authenticated | Đăng ký tham gia phòng |
| | `POST` | `/api/rooms/{id}/leave` | Authenticated | Rời phòng -> Tự động đôn Waitlist FIFO |
| | `POST` | `/api/rooms/{id}/start` | Host | Bắt đầu buổi chơi (`IN_PROGRESS`) |
| | `POST` | `/api/rooms/{id}/finish` | Host | Kết thúc buổi chơi (`COMPLETED`) |
| | `POST` | `/api/rooms/{id}/cancel` | Host | Hủy phòng kèm lý do |
| **Match** | `POST` | `/api/rooms/{roomId}/matches` | Người trong phòng | Nhập kết quả trận đấu mới (chờ xác nhận) |
| | `GET` | `/api/rooms/{roomId}/matches` | Người trong phòng | Danh sách các trận đã đấu trong buổi chơi |
| | `POST` | `/api/matches/{matchId}/confirm` | Đối thủ trận đấu | Xác nhận tỉ số -> Chốt ván & tính Elo |
| | `POST` | `/api/matches/{matchId}/dispute` | Đối thủ trận đấu | Khiếu nại kết quả sai -> Khóa điểm |
| **Post** | `GET` | `/api/posts` | Public / Auth | Danh sách bài viết Trang chủ (phân trang) |
| | `POST` | `/api/posts` | Authenticated | Đăng bài viết (Recap, Review sân, bài thường) |
| | `POST` | `/api/posts/{id}/like` | Authenticated | Thả tim / Bỏ thả tim bài viết |
| | `GET` | `/api/posts/{id}/comments` | Public / Auth | Danh sách bình luận |
| | `POST` | `/api/posts/{id}/comments` | Authenticated | Thêm bình luận |
| **Court** | `GET` | `/api/courts` | Public | Danh sách sân cầu lông, địa chỉ, tiện ích, rating |
| | `GET` | `/api/courts/{id}/reviews` | Public | Xem danh sách đánh giá của sân |
| **Ranking**| `GET` | `/api/leaderboard/global` | Public | Top VĐV toàn hệ thống |
| | `GET` | `/api/leaderboard/courts/{courtId}` | Public | Top VĐV tại sân nhà cụ thể |
| | `GET` | `/api/leaderboard/regions` | Public | Top VĐV theo Quận/Huyện/Thành phố |
| **Profile**| `GET` | `/api/profiles/me` | Authenticated | Xem hồ sơ cá nhân và số liệu thi đấu |
| | `PUT` | `/api/profiles/me` | Authenticated | Cập nhật thông tin, sân quen, Zalo phone, FB |
| | `GET` | `/api/profiles/qr/{publicId}` | Authenticated | Quét mã QR xem thông tin người khác |
| | `POST` | `/api/friends/request` | Authenticated | Gửi lời mời kết bạn |
| | `POST` | `/api/friends/accept` | Authenticated | Chấp nhận kết bạn |
