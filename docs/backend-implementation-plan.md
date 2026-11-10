# Đặc Tả Kiến Trúc & Kế Hoạch Triển Khai Backend Modular Monolith (Spring Boot 3) — SportXPv2

> Cập nhật: 07/11/2026 — **v2.2 UPDATED** (Cập nhật đồng bộ các tinh chỉnh nghiệp vụ Flow A/B, Join Code Normalization, Auto-Expiry và loại bỏ Stored Procedure).
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
    *   `spring-boot-starter-cache` + `com.github.ben-manes.caffeine:caffeine`: Cache Leaderboard có TTL. *(MỚI)*
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
│   │   │               ├── core/                           # 0. HẠ TẦNG DÙNG CHUNG
│   │   │               │   ├── config/                     # SecurityConfig, CorsConfig, CacheConfig [MỚI]
│   │   │               │   ├── security/                   # JwtDecoder, UserPrincipal, SecurityUtils
│   │   │               │   ├── exception/                  # GlobalExceptionHandler, BusinessException, ErrorCode
│   │   │               │   ├── scheduler/                  # WaitlistExpiryScheduler [MỚI], MatchAutoConfirmScheduler [MỚI]
│   │   │               │   └── util/                       # CodeGenerator (sinh mã phòng), DateUtils
│   │   │               │
│   │   │               ├── room/                           # 1. MODULE KÈO ĐẤU (FLOW A & FLOW B)
│   │   │               │   ├── controller/                 # RoomController
│   │   │               │   ├── service/                    # RoomService, RoomServiceImpl
│   │   │               │   ├── repository/                 # MatchRoomRepository, RoomMemberRepository
│   │   │               │   ├── domain/                     # MatchRoom, RoomMember, RoomType, RoomStatus, MemberStatus
│   │   │               │   └── dto/                        # CreateRoomRequest, RoomDetailResponse...
│   │   │               │
│   │   │               ├── match/                          # 2. MODULE TRẬN ĐẤU & BỘ MÁY ELO
│   │   │               │   ├── controller/                 # MatchController
│   │   │               │   ├── service/                    # MatchService, EloEngine
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
│   │   │               │   ├── service/                    # LeaderboardService
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

### Cấu hình `application.yaml` *(đã vá Fix #3 — Connection Pool)*:

```yaml
server:
  port: 8080

spring:
  application:
    name: sportxp-backend

  datasource:
    # ✅ FIX #3: Đổi sang cổng 6543 — Supavisor/PgBouncer Transaction Pooler
    # Cổng 5432 là Direct Connection: mỗi query chịu latency Internet + pool cạn nhanh
    # Cổng 6543 dùng PgBouncer: nhiều request share chung ít TCP connection thực → không bị nghẽn
    url: jdbc:postgresql://yjcqaxszvmpnlmypxjqq.supabase.co:6543/postgres?sslmode=require&prepareThreshold=0
    username: postgres
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20      # Tăng lên 20 (PgBouncer handle multiplexing phía DB)
      minimum-idle: 5
      connection-timeout: 30000  # 30s — tránh thread treo khi pool cạn
      idle-timeout: 600000       # 10 phút — trả connection về pool khi rảnh
      max-lifetime: 1800000      # 30 phút — rotate tránh connection bị stale
      keepalive-time: 60000      # 1 phút — ping giữ connection sống qua firewall
      pool-name: SportXP-HikariPool

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        # prepareThreshold=0 trong URL đã tắt server-side prepared statement
        # — bắt buộc khi dùng PgBouncer Transaction Mode
    show-sql: false

  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://yjcqaxszvmpnlmypxjqq.supabase.co/auth/v1

  # ✅ FIX #6: Bật Spring Cache cho Leaderboard
  cache:
    type: caffeine
```

---

## 4. Đặc Tả Chi Tiết Nghiệp Vụ Từng Feature Module

### 4.1 Module Kèo Đấu (`room/`)

*   **Định vị cốt lõi:** Quản lý **Flow A: Sảnh Tuyển Người Công Khai / Lấp Slot Buổi Chơi (`PUBLIC_RECRUIT`)** và hỗ trợ cấp phát phòng cho **Flow B: Kèo Kín (`PRIVATE_RATED`)**.
    - **Kiến trúc Decoupling (Loại bỏ RPC cũ):** Tuyệt đối không gọi qua các Stored Procedure PostgreSQL cũ (`room_command_v2`, `list_rooms_v2`, `get_room_v2`) để tránh lỗi chữ ký PostgREST (`PGRST202`). Toàn bộ Business Logic do Spring Boot Service điều phối trực tiếp qua JPA trên `match_rooms` và `room_members`.
    - Mặc định Flow A là **`is_rated = false` (Unrated)**, không gắn bộ máy tính điểm Elo vào phòng này để tránh áp lực trình độ cho người tham gia vãng lai.
    - Người tham gia chỉ cần xem: *Sân nào, Mấy giờ, Số slot trống, Dải trình độ tham khảo (TB, Khá...), Phí dự kiến*.
    - Tích hợp sẵn `zalo_group_link` do Host đính kèm để thành viên bấm 1 nút mở ngay app Zalo trao đổi trực tiếp.
    - **Lưu ý:** Flow A không quản lý các trận đấu tính Elo lồng bên trong. Ai muốn thách đấu tính rank sẽ qua Module Match (Flow B).

*   **Yêu Cầu Giới Tính & Kiểm Soát Vào Phòng (`target_gender`) — *[MỚI - v2.3]*:**
    - **Thiết kế Domain:** Bảng `match_rooms` có cột `target_gender VARCHAR(10) DEFAULT 'all' CHECK (target_gender IN ('all', 'male', 'female'))`.
    - **Quy tắc Nghiệp vụ:**
      - Khi Host tạo phòng: Chọn `all` (Nam & Nữ `⚥`), `male` (Chỉ Nam `♂`), `female` (Chỉ Nữ `♀`).
      - Khi VĐV bấm tham gia (`POST /api/rooms/{id}/join`): Service kiểm tra chéo giới tính của VĐV trong `profiles.gender`. Nếu phòng yêu cầu `female` mà VĐV là `male` (hoặc ngược lại) -> Bị chặn ngay tại tầng Service với mã lỗi `GENDER_MISMATCH` (HTTP 403).
    - **Bộ lọc Sảnh Khám Phá:** Hỗ trợ tham số query `GET /api/rooms?gender=male|female|all` phục vụ các Chip lọc nhanh trên UI.

*   **Chuẩn hóa Tra cứu Mã Phòng (Join Code Normalization) — *[MỚI - v2.2]*:**
    - Người dùng có thể nhập hoặc dán mã phòng với nhiều định dạng: `XP-AVR2`, `XP - AVR2`, `#XP-AVR2`, `xp-avr2`.
    - **Tối ưu B-Tree Index Scan (Tránh `CAST(r.id AS string)` Anti-pattern):**
      Việc ép kiểu `CAST(r.id AS string)` trong SQL query sẽ vô hiệu hóa chỉ mục Primary Key và gây Full Table Scan. Do đó, logic phân tách được xử lý gọn gàng ngay tại tầng Service:
      ```java
      // room/service/impl/RoomServiceImpl.java
      public Optional<MatchRoom> lookupRoom(String rawCode) {
          if (rawCode == null || rawCode.isBlank()) return Optional.empty();
          String cleanCode = rawCode.trim().toUpperCase().replaceAll("^#", "").replaceAll("\\s+", "");
          
          // Phân nhánh tra cứu chuẩn chỉ mục O(1)
          if (isValidUUID(cleanCode)) {
              return matchRoomRepository.findById(UUID.fromString(cleanCode)); // Index Scan PK O(1)
          }
          return matchRoomRepository.findByJoinCode(cleanCode); // Index Scan O(1) trên idx_match_rooms_join_code
      }
      ```

*   **Cơ chế Tự động Dọn Phòng Quá Hạn Khỏi Public Feed (Auto-Exclusion) — *[MỚI - v2.2]*:**
    - **Vấn đề thực tế:** Khi buổi chơi đã kết thúc thời gian thi đấu nhưng Host chưa bấm "Kết thúc", phòng vẫn giữ trạng thái `OPEN` và nằm trơ trơ trên bảng tin Public.
    - **Giải pháp:**
      1. Truy vấn Public Feed (`GET /api/rooms?scope=discover`) bắt buộc áp dụng điều kiện lọc thời gian thực:
         ```sql
         WHERE r.visibility = 'PUBLIC' 
           AND r.room_type = 'PUBLIC_RECRUIT' 
           AND r.status = 'OPEN' 
           AND r.end_time > CURRENT_TIMESTAMP
         ```
      2. Bổ sung `RoomAutoExpireScheduler` (chạy mỗi 10 phút): Quét các phòng `status = 'OPEN'` có `end_time < NOW()` và tự động chuyển `status = 'COMPLETED'` để lưu vào Lịch sử.

*   **Quy chuẩn Khởi chạy Kèo Đấu (Bypass Time-gating cho Flow B) — *[MỚI - v2.2]*:**
    - Đối với Flow B (`PRIVATE_RATED`), bỏ qua ràng buộc khung giờ đặt sân (`OUTSIDE_START_WINDOW`). Host có thể kích hoạt `POST /api/rooms/{id}/start` ngay lập tức để chuyển sang `IN_PROGRESS` phục vụ thi đấu trực tiếp.

*   **Quản lý Slot & Waitlist FIFO *(đã vá Fix #1)*:**

    > **Thiết kế cũ (SAI):** Khi người rời phòng → người đầu Waitlist tự động nhảy lên `REGISTERED`.
    >
    > **Vấn đề:** User A đang ngủ hoặc bận việc, hệ thống vẫn ghi `REGISTERED` → buổi chơi thiếu người thực tế (Ghost Joiner).

    - **Thiết kế mới (ĐÚNG):** Khi phòng đầy, người đăng ký sau vào `WAITLIST`.
    - Khi có slot trống, người đầu Waitlist được chuyển sang **`INVITED`** (không phải thẳng `REGISTERED`).
    - Người được `INVITED` có **15 phút** để bấm `POST /api/rooms/{id}/claim-slot` xác nhận.
    - Nếu hết 15 phút không xác nhận → tự động nhường slot cho người tiếp theo trong Waitlist.

    **Vòng đời trạng thái `MemberStatus`:**
    ```
    [Đăng ký] ──(slot còn)──► REGISTERED
                └──(phòng đầy)──► WAITLIST ──(slot trống, được chọn)──► INVITED
                                                                              │── (bấm claim đúng hạn) ──► REGISTERED
                                                                              └── (hết 15 phút) ──────► WAITLIST (nhường slot)
    REGISTERED / WAITLIST ──(bấm rời phòng)──► CANCELLED
    ```

    **`MemberStatus` enum (cập nhật):**
    ```java
    // room/domain/MemberStatus.java
    public enum MemberStatus {
        REGISTERED,  // Thành viên chính thức có slot
        WAITLIST,    // Đang xếp hàng chờ
        INVITED,     // Được mời nhận slot, đang chờ xác nhận (TTL 15 phút)
        RECONFIRM,   // Chờ xác nhận lại khi Host thay đổi lịch
        CANCELLED    // Đã rời / bị hủy
    }
    ```

    **Thêm cột `invited_at` vào bảng `room_members`:**
    ```sql
    ALTER TABLE room_members
        ADD COLUMN invited_at TIMESTAMPTZ NULL;
    ```

*   **Chống Race Condition khi Join *(Fix #1 — Pessimistic Lock)*:**

    > **Vấn đề:** 2 user bấm Join cùng 1 mili-giây, cả 2 thread đọc DB thấy `registeredCount < maxSlots` → cả 2 đều được `REGISTERED`. Phòng 4 người thành 5 người (Overselling).

    Dùng `SELECT ... FOR UPDATE` (Pessimistic Write Lock) trên bảng `match_rooms` khi join/leave:
    ```java
    // room/repository/MatchRoomRepository.java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM MatchRoom r WHERE r.id = :id")
    Optional<MatchRoom> findByIdForUpdate(@Param("id") UUID id);
    ```
    Toàn bộ logic join/leave **bắt buộc** chạy bên trong `@Transactional` để lock có hiệu lực.

*   **Scheduler xử lý TTL Invitation *(Fix #1)*:**

    File mới: `core/scheduler/WaitlistExpiryScheduler.java` — chạy mỗi 5 phút, tìm các bản ghi `INVITED` quá 15 phút rồi nhường slot cho người tiếp theo trong Waitlist.

---

### 4.2 Module Trận Đấu & Bộ Máy Elo (`match/`) — Flow B: Kèo So Vợt Độc Lập

*   **Định vị cốt lõi:** Quản lý **Flow B: Kèo So Vợt Leo Rank Tính Điểm Elo (1v1 & 2v2)**.
    - Hoạt động độc lập, không bị ràng buộc lồng trong vòng đời của Room tuyển quân.
    - Hai người (1v1) hoặc bốn người (2v2) tạo trận trực tiếp qua Mã mời 6 ký tự (`join_code`) hoặc quét QR trên điện thoại.
    - Hỗ trợ tùy chọn **Chế độ Đấu tập (Casual Toggle)**: Cho phép chuyển sang Unrated trước khi đánh nếu chỉ giao lưu khởi động.

*   **Ai được nhập kết quả? *(Participant Guard)*:**
    - Chỉ người **trực tiếp tham gia trận đấu** (có tên trong `teamAPlayerIds` hoặc `teamBPlayerIds`) mới được gọi `POST /matches`.

*   **Đồng thuận 2 chiều (Mutual Consent) & Chống gian lận:**
    - Đơn (1v1): Cả 2 VĐV cùng bấm xác nhận tỉ số.
    - Đôi (2v2): Ít nhất 1 đại diện bên A **và** 1 đại diện bên B bấm xác nhận.
    - Nếu có khiếu nại → Chuyển thành `disputed`, khóa điểm Elo.
    - **Chống Race Condition Double-Settlement *(Pessimistic Lock trên Trận đấu)*:**
      Khi VĐV bấm Confirm, service bắt buộc dùng `SELECT ... FOR UPDATE` trên dòng `session_matches`:
      ```java
      // match/repository/SessionMatchRepository.java
      @Lock(LockModeType.PESSIMISTIC_WRITE)
      @Query("SELECT m FROM SessionMatch m WHERE m.id = :id")
      Optional<SessionMatch> findByIdForUpdate(@Param("id") UUID id);
      ```
      Nếu luồng 1 đã xử lý chuyển `status = confirmed` và cộng điểm Elo xong, luồng 2 đọc thấy `m.status == CONFIRMED` sẽ lập tức trả về kết quả thành công mà không tính điểm lần thứ 2.
    - **Auto-confirm Timeout:** Mỗi trận có `confirmed_deadline = created_at + 24 giờ`. Nếu sau 24h đối thủ không bấm xác nhận hay khiếu nại → hệ thống tự động chuyển `pending → confirmed` và tính Elo.
    - **Tự động Hoàn tất Phòng (Auto-Closure có điều kiện) — *[MỚI - v2.2]*:** 
      - Chỉ áp dụng tự động đóng phòng khi `room.room_type == RoomType.PRIVATE_RATED`: Trận đấu chốt kết quả xong thì phòng kết thúc `match_rooms.status = 'COMPLETED'`.
      - Với Flow A (`PUBLIC_RECRUIT`), buổi chơi gồm nhiều trận đấu liên tục giữa các thành viên, phòng **không bị đóng tự động** mà chỉ kết thúc khi Host bấm Finish hoặc Scheduler quét hết giờ.

*   **Quy chuẩn Điểm số Thể thức Best-of-3 (BO3) — *[MỚI - v2.2]*:**
    - Hỗ trợ thi đấu 2 set hoặc 3 set (BO3), áp dụng luật cầu lông BWF: Mỗi set 21 điểm (cách biệt 2 điểm), tối đa chạm trần 30 điểm.

*   **Bộ máy tính Elo (`EloEngine`) & Phân bổ 1v1 / 2v2:**
    - **Đánh Đơn (1v1):** `Elo_TeamA = Elo_PlayerA`, `Elo_TeamB = Elo_PlayerB`.
    - **Đánh Đôi (2v2):** `Elo_TeamA = (Elo_A1 + Elo_A2) / 2`, `Elo_TeamB = (Elo_B1 + Elo_B2) / 2`.
    - **Cơ chế Phân bổ Đồng đội (Flat Team Distribution):** Cả 2 thành viên đội thắng cùng nhận `+Delta_Elo`, cả 2 thành viên đội thua cùng bị trừ `-Delta_Elo`.
    - **Áp trần đối đầu H2H (Head-to-Head Cap):** Tối đa 2 trận tính điểm/ngày giữa cùng một cặp đối thủ. Từ trận thứ 3 trở đi tự động Unrated.
    - **Hệ số K động (Adaptive K):**
      - K = 10: Bạn bè quen hoặc đã thi đấu cùng nhau trong 30 ngày qua (biến động nhỏ, triệt tiêu động cơ cày điểm chéo).
      - K = 20: Đối thủ mới gặp lần đầu.
      - K = 32: Trận có Host / Trọng tài bảo chứng.
    - **Thưởng chuỗi thắng (Win Streak Bonus):** Thắng liên tiếp từ 3 trận trở lên (`win_streak >= 3`), mỗi trận thắng tiếp theo được thưởng thêm `+3` đến `+5` Elo để nhanh chóng đưa các tay vợt có trình độ cao / smurf về đúng thứ hạng thực.

---

### 4.3 Module Bản Tin Cộng Đồng (`post/`)

*   **Định vị:** Bản tin mạng xã hội chung (General Community Feed) kết nối cộng đồng người chơi cầu lông phong trào.
*   **Tính năng chính:**
    - Người chơi đăng bài viết tự do (Caption, hình ảnh mồ hôi/đồng đội tại sân).
    - Tương tác xã hội: Thả tim (`post_likes`) và Bình luận trao đổi (`post_comments`).
    - Hỗ trợ chia sẻ thành tích trận đấu hoặc link bài viết sang Zalo / Facebook.
*   *Lưu ý:* Tính năng Review đánh giá cụm sân 1–5 sao tạm hoãn để hoàn thiện nghiệp vụ chi tiết ở giai đoạn sau.

---

### 4.4 Module Bảng Xếp Hạng Đa Chiều (`ranking/`) *(đã vá Fix #6)*

*   **Tiêu chí Điều kiện Lên Bảng Xếp Hạng (Leaderboard Qualification Threshold):**
    - **BXH Cụm Sân (Home Court Leaderboard):** Yêu cầu hoàn thành tối thiểu **5 trận đấu tính điểm tại chính cụm sân đó** (`court_id`).
    - **BXH Khu vực (Regional Leaderboard):** Yêu cầu hoàn thành tối thiểu **5 trận đấu tính điểm tại các sân trong cùng Quận/Huyện** (`district`).
      *(Ví dụ: Đánh 2 trận Sân A + 3 trận Sân B cùng thuộc Quận 10 → Chưa đủ 5 trận tại từng sân con nên chưa lên BXH từng sân, nhưng tổng 5 trận tại Quận 10 → Đủ điều kiện hiển thị trên BXH Quận 10).*
    - **BXH Toàn quốc (Global Leaderboard):** Yêu cầu tối thiểu 5 trận đấu hoàn thành trên toàn hệ thống.
*   **Cơ chế chống "VĐV du lịch":** Không để người chơi vãng lai thắng 1 trận ăn may rồi chiếm top 1 của sân nhà người khác mãi mãi.
*   **Sắp xếp:** Theo `elo_rating` giảm dần, phụ theo `win_streak` giảm dần.

*   **Tối ưu hiệu năng *(Fix #6)*:**

    > **Vấn đề cũ:** `SELECT ... ORDER BY elo_rating DESC` full scan toàn bộ bảng `profiles` mỗi lần user mở App → CPU spike khi có 10k+ rows.

    **Bước 1 — Composite Index (thực hiện ngay):**
    ```sql
    -- Chạy trong migration script (CONCURRENTLY = không lock bảng khi đang chạy)
    CREATE INDEX CONCURRENTLY idx_profiles_elo_global
        ON profiles(elo_rating DESC, win_streak DESC)
        WHERE onboarding_step = 5;

    CREATE INDEX CONCURRENTLY idx_profiles_elo_court
        ON profiles(home_court_id, elo_rating DESC)
        WHERE onboarding_step = 5;

    CREATE INDEX CONCURRENTLY idx_profiles_elo_district
        ON profiles(district, elo_rating DESC)
        WHERE onboarding_step = 5;
    ```

    **Bước 2 — Spring Cache với TTL 5 phút (không cần Redis):**
    ```java
    // core/config/CacheConfig.java
    @Configuration
    @EnableCaching
    public class CacheConfig {
        @Bean
        public CacheManager cacheManager() {
            CaffeineCacheManager manager = new CaffeineCacheManager();
            manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(500));
            return manager;
        }
    }

    // ranking/service/impl/LeaderboardServiceImpl.java
    @Cacheable(value = "global_leaderboard", key = "'top100'")
    public List<RankedPlayerDto> getGlobalLeaderboard() { ... }

    // Evict cache khi Elo thay đổi — trong EloEngine.settleMatch()
    @CacheEvict(value = "global_leaderboard", allEntries = true)
    public void settleMatch(SessionMatch match) { ... }
    ```

---

### 4.5 Module Hồ Sơ & Mạng Xã Hội (`profile/`)

*   Quản lý Hộ chiếu QR VĐV (`public_id`).
*   **Thông tin Nhân khẩu học & Tính Bất biến *(MỚI - v2.3)*:**
    - Cột `gender` (`male`, `female`, `other`), `age`, `birth_year`.
    - **Quy tắc Bất biến:** Giới tính chỉ được gán trong quá trình Onboarding hoặc lần đầu cập nhật profile. Khi đã có dữ liệu (`gender IS NOT NULL`), hệ thống chặn tuyệt đối hành vi sửa đổi giới tính (được bảo vệ kép ở cả Database Trigger `trg_prevent_gender_modification` và Spring Boot Validation Service) để bảo vệ tính công bằng cho các kèo đấu giới tính (`target_gender`).
*   Cập nhật sân nhà (`home_court_id`), số điện thoại Zalo, link Facebook, tiểu sử lối đánh.

---

## 5. Bảng Mã Lỗi Hệ Thống (`ErrorCode`) *(đã bổ sung)*

| Mã Lỗi | HTTP Status | Thông điệp |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | Phiên đăng nhập không hợp lệ hoặc đã hết hạn |
| `FORBIDDEN` | 403 | Bạn không có quyền thực hiện thao tác này |
| `RESOURCE_NOT_FOUND` | 404 | Không tìm thấy tài nguyên yêu cầu |
| `SCHEDULE_CONFLICT` | 409 | Host hoặc VĐV đã có lịch thi đấu trùng khung giờ này |
| `ROOM_FULL` | 409 | Phòng đã đủ chỗ, hệ thống đã chuyển bạn vào danh sách chờ |
| `INVALID_JOIN_CODE` | 400 | Mã phòng không chính xác hoặc phòng không tồn tại |
| `NOT_ROOM_MEMBER` | 403 | Bạn chưa phải là thành viên chính thức của buổi chơi này |
| `ALREADY_REGISTERED` | 400 | Bạn đã đăng ký tham gia buổi chơi này trước đó |
| `MATCH_ALREADY_CONFIRMED` | 400 | Trận đấu này đã được xác nhận kết quả trước đó |
| `H2H_LIMIT_EXCEEDED` | 200 (Warning) | Đã vượt trần 2 trận đối đầu/ngày, trận đấu chuyển sang Unrated |
| `ROOM_NOT_IN_PROGRESS` | 409 | Buổi chơi chưa bắt đầu hoặc đã kết thúc *(MỚI — Fix #4)* |
| `NOT_A_PARTICIPANT` | 403 | Bạn không phải người trực tiếp thi đấu trong trận này *(MỚI — Fix #2)* |
| `INVITATION_EXPIRED` | 410 | Lời mời đã hết hạn, slot đã nhường cho người tiếp theo *(MỚI — Fix #1)* |
| `INVALID_OPERATION` | 400 | Thao tác không hợp lệ trong trạng thái hiện tại *(MỚI — Fix #1)* |
| `NO_EXPERIENCE_AT_COURT` | 403 | Bạn cần tham gia ít nhất 1 buổi tại sân này trước khi đánh giá *(MỚI — Fix #5)* |
| `GENDER_MISMATCH` | 403 | Giới tính của bạn không phù hợp với yêu cầu của buổi chơi này *(MỚI — v2.3)* |
| `GENDER_ALREADY_SET` | 400 | Giới tính đã được xác thực và không thể thay đổi *(MỚI — v2.3)* |
| `INTERNAL_ERROR` | 500 | Đã có lỗi xảy ra trong quá trình xử lý hệ thống |

---

## 6. Danh Sách RESTful API Endpoints Đầy Đủ

| Module | Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Room** | `POST` | `/api/rooms` | Authenticated | Tạo phòng (Flow A hoặc Flow B) |
| | `GET` | `/api/rooms` | Public / Auth | Danh sách phòng Flow A theo khu vực sân, trình độ |
| | `POST` | `/api/rooms/lookup-code` | Authenticated | Tra cứu phòng Flow B bằng `join_code` |
| | `GET` | `/api/rooms/{id}` | Authenticated | Chi tiết phòng, danh sách VĐV, danh sách chờ |
| | `POST` | `/api/rooms/{id}/join` | Authenticated | Đăng ký tham gia phòng (có Pessimistic Lock) |
| | `POST` | `/api/rooms/{id}/leave` | Authenticated | Rời phòng → người đầu Waitlist nhận trạng thái `INVITED` |
| | `POST` | `/api/rooms/{id}/claim-slot` | Authenticated | **[MỚI]** Người được `INVITED` xác nhận nhận slot (TTL 15 phút) |
| | `POST` | `/api/rooms/{id}/start` | Host | Bắt đầu buổi chơi (`IN_PROGRESS`) |
| | `POST` | `/api/rooms/{id}/finish` | Host | Kết thúc buổi chơi → tự động chốt pending matches trước khi `COMPLETED` |
| | `POST` | `/api/rooms/{id}/cancel` | Host | Hủy phòng kèm lý do |
| **Match** | `POST` | `/api/rooms/{roomId}/matches` | **Participant** (người trực tiếp đấu) | Nhập kết quả trận đấu mới — phòng phải `IN_PROGRESS` |
| | `GET` | `/api/rooms/{roomId}/matches` | Người trong phòng | Danh sách các trận đã đấu trong buổi chơi |
| | `POST` | `/api/matches/{matchId}/confirm` | **Participant** đối phương | Xác nhận tỉ số → Chốt ván & tính Elo |
| | `POST` | `/api/matches/{matchId}/dispute` | **Participant** đối phương | Khiếu nại kết quả sai → Khóa điểm |
| **Post** | `GET` | `/api/posts` | Public / Auth | Danh sách bài viết Trang chủ (phân trang) |
| | `POST` | `/api/posts` | Authenticated | Đăng bài viết — `court_review` cần check-in tại sân |
| | `POST` | `/api/posts/{id}/like` | Authenticated | Thả tim / Bỏ thả tim bài viết |
| | `GET` | `/api/posts/{id}/comments` | Public / Auth | Danh sách bình luận |
| | `POST` | `/api/posts/{id}/comments` | Authenticated | Thêm bình luận |
| **Court** | `GET` | `/api/courts` | Public | Danh sách sân cầu lông, địa chỉ, tiện ích, rating |
| | `GET` | `/api/courts/{id}/reviews` | Public | Xem danh sách đánh giá của sân |
| **Ranking** | `GET` | `/api/leaderboard/global` | Public | Top VĐV toàn hệ thống (có cache 5 phút) |
| | `GET` | `/api/leaderboard/courts/{courtId}` | Public | Top VĐV tại sân nhà cụ thể |
| | `GET` | `/api/leaderboard/regions` | Public | Top VĐV theo Quận/Huyện/Thành phố |
| **Profile** | `GET` | `/api/profiles/me` | Authenticated | Xem hồ sơ cá nhân và số liệu thi đấu |
| | `PUT` | `/api/profiles/me` | Authenticated | Cập nhật thông tin, sân quen, Zalo phone, FB |
| | `GET` | `/api/profiles/qr/{publicId}` | Authenticated | Quét mã QR xem thông tin người khác |
| | `POST` | `/api/friends/request` | Authenticated | Gửi lời mời kết bạn |
| | `POST` | `/api/friends/accept` | Authenticated | Chấp nhận kết bạn |

---

## 8. Kế Hoạch Phân Kỳ Triển Khai Backend (Implementation Sprints Roadmap)

Toàn bộ dịch vụ Backend được chia thành 4 Sprint phát triển tuần tự, đảm bảo thông mạch từ Core CRUD đến các thuật toán mở rộng:

```
┌────────────────────────────────────────────────────────────────────────┐
│ SPRINT 1 (Tuần 1 - 2): CORE ENGINE & ROOM/MATCH FLOW A/B               │
│ - Hoàn thiện Module room/ (MatchRoom, RoomMember, Join/Leave Lock)     │
│ - Tích hợp target_gender guard & lọc giới tính                         │
│ - Hoàn thiện Module match/ (SessionMatch, 2-way confirm, auto-closure) │
│ - Module profile/ cơ bản (gender immutability, age, stats)             │
│ - Kết nối API thực tế với Frontend, xóa bỏ toàn bộ mock data phòng    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ SPRINT 2 (Tuần 3 - 4): ELO ENGINE & P2P VIETQR BILL SPLITTER           │
│ - Triển khai Baseline Elo & Canonical Lock Ordering chống Deadlock    │
│ - Bộ đệm Redis ZSET H2H Capping (Trần 2 trận/ngày)                     │
│ - Scheduler: WaitlistExpiryScheduler (15p TTL) & MatchAutoConfirm (24h)│
│ - P2P VietQR Bill Splitter & Share kèo Zalo                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ SPRINT 3 (Tuần 5 - 8): GEOSPATIAL H3 & RETENTION FEED                  │
│ - Tích hợp Uber H3 Res-8 k-ring search (B-Tree < 1.5ms)                │
│ - Module post/ (Gravity Time-Decay Feed & UGC Court Review)            │
│ - Module ranking/ (Top 100 Global, Home Court Leaderboard Caffeine)   │
│ - Endpoint nhận telemetry từ MediaPipe Wasm Client-side                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ SPRINT 4 (Tuần 9 - 14): TOURNAMENT OS & FULL GLICKO-2 ENGINE           │
│ - Tournament OS: Swiss System (Edmonds' Blossom), Single Elimination   │
│ - Continuous Glicko-2 & Nightly Spring Batch Inactivity Decay          │
│ - Kiểm thử tải k6 500 CCU, P99 < 25ms, Chuẩn bị Commercial Launch      │
└────────────────────────────────────────────────────────────────────────┘
```


### Bản cập nhật v2.2 (07/11/2026):
| Hạng mục | Vấn đề thực tế | Giải pháp Kiến trúc v2.2 |
| :------- | :------------- | :----------------------- |
| **Bỏ RPC cũ** | Stored Procedure Postgres (`room_command_v2`) bị lỗi PostgREST `PGRST202` | Tách biệt triệt để khỏi RPC database; toàn bộ nghiệp vụ phòng/trận đấu do Spring Boot Service điều phối trực tiếp qua JPA / Hibernate. |
| **Join Code Normalization** | Nhập mã có khoảng trắng (`XP - AVR2`) bị báo không tìm thấy phòng | Thêm middleware/service sanitize chuỗi: loại bỏ khoảng trắng, dấu `#`, uppercase trước khi query. Hỗ trợ query cả `join_code` và fallback UUID `id`. |
| **Dọn phòng quá hạn** | Phòng đã hết giờ đấu vẫn nằm ở sảnh chờ Public "Phòng Chờ Đang Mở" | Query `GET /api/rooms` bắt buộc lọc `end_time > CURRENT_TIMESTAMP`; thêm `RoomAutoExpireScheduler` tự động đóng phòng quá hạn. |
| **Flow B Instant Start** | Host bị time-gating chặn không cho bắt đầu trận đấu khi chưa tới giờ sân | Cho phép phòng `PRIVATE_RATED` kích hoạt `IN_PROGRESS` ngay lập tức để phục vụ thi đấu & demo. |
| **Auto-Closure Match** | Đấu xong không tự kết thúc phòng | Khi trận đấu được 2 bên xác nhận (`status = 'confirmed'`), hệ thống tự động hoàn tất `match_rooms.status = 'COMPLETED'`. |

### Bản cập nhật v2.1 (03/11/2026):
| Fix | Hạng mục | Thay đổi |
| :-- | :------- | :------- |
| **#1** | Race Condition (room/) | Thêm Pessimistic Lock vào `findByIdForUpdate()`; đổi flow Waitlist → `INVITED` + TTL 15 phút + `claim-slot` API + `WaitlistExpiryScheduler` |
| **#2** | Mutual Consent (match/) | Thêm `confirmed_deadline` (24h); `MatchAutoConfirmScheduler`; Host-close auto-confirm; Participant Guard |
| **#3** | DB Connection Pool | Đổi cổng `5432` → `6543`; thêm `prepareThreshold=0`; tune đủ 5 Hikari params |
| **#4** | State Machine | Guard `room.status == IN_PROGRESS` trong `submitScore()`; 5 `ErrorCode` mới |
| **#5** | Spam Review (post/) | Check-in Guard; Upsert 1 review/sân; DB Unique partial index; đổi sang `AVG()` |
| **#6** | Leaderboard (ranking/) | 3 Composite Partial Index; `@Cacheable` + `@CacheEvict` với Caffeine TTL 5 phút |
