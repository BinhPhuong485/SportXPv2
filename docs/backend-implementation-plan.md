# Đặc Tả Kiến Trúc & Kế Hoạch Triển Khai Backend Java Spring Boot — SportXPv2

> Cập nhật: 31/10/2026.  
> Tài liệu thiết kế kỹ thuật toàn diện cho dịch vụ Backend (thư mục `be/`) xây dựng bằng **Java 17/21 + Spring Boot 3.x**, kết nối cơ sở dữ liệu **Supabase PostgreSQL**.

---

## 1. Mục tiêu & Định vị Công nghệ cho `be/`

*   **Ngôn ngữ & Runtime:** Java 17 hoặc 21 (LTS).
*   **Framework cốt lõi:** **Spring Boot 3.x**
*   **Các Starter & Thư viện Chính:**
    *   `spring-boot-starter-web`: Xây dựng RESTful API.
    *   `spring-boot-starter-data-jpa`: Tương tác với PostgreSQL qua Hibernate / JPA.
    *   `spring-boot-starter-security` & `spring-boot-starter-oauth2-resource-server`: Xác thực Supabase JWT Bearer token tự động qua JWKS / Public Key.
    *   `spring-boot-starter-validation`: Xác thực dữ liệu đầu vào (Jakarta Validation / Bean Validation).
    *   `org.postgresql:postgresql`: PostgreSQL JDBC Driver.
    *   `org.projectlombok:lombok`: Rút gọn code (Getter, Setter, Builder, AllArgsConstructor...).
    *   `com.vladmihalcea:hibernate-types-60` hoặc native Hibernate 6 JSON mapping: Hỗ trợ ánh xạ kiểu dữ liệu `jsonb` và mảng `uuid[]` / `text[]` của PostgreSQL.

---

## 2. Cấu trúc Thư mục Dự án Chuẩn Spring Boot trong `be/`

```
be/
├── pom.xml (hoặc build.gradle)
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── sportxp/
│   │   │           ├── SportXpApplication.java
│   │   │           ├── config/                 # SecurityConfig, CorsConfig, JpaConfig, OpenApiConfig
│   │   │           ├── security/               # JwtAuthenticationFilter, SecurityUtils, UserPrincipal
│   │   │           ├── domain/                 # JPA Entities
│   │   │           │   ├── Court.java
│   │   │           │   ├── Profile.java
│   │   │           │   ├── MatchRoom.java
│   │   │           │   ├── RoomMember.java
│   │   │           │   ├── SessionMatch.java
│   │   │           │   ├── Post.java
│   │   │           │   ├── PostLike.java
│   │   │           │   ├── PostComment.java
│   │   │           │   ├── Friendship.java
│   │   │           │   └── enums/              # RoomType, RoomStatus, MatchStatus, TierName...
│   │   │           ├── repository/             # Spring Data JPA Repositories
│   │   │           │   ├── CourtRepository.java
│   │   │           │   ├── ProfileRepository.java
│   │   │           │   ├── MatchRoomRepository.java
│   │   │           │   ├── SessionMatchRepository.java
│   │   │           │   ├── PostRepository.java
│   │   │           │   └── FriendshipRepository.java
│   │   │           ├── dto/                    # Request & Response Data Transfer Objects
│   │   │           │   ├── request/            # CreateRoomRequest, RecordMatchRequest, CreatePostRequest...
│   │   │           │   └── response/           # RoomDetailResponse, MatchResponse, LeaderboardResponse...
│   │   │           ├── service/                # Business Logic Services & Interfaces
│   │   │           │   ├── RoomService.java
│   │   │           │   ├── EloCalculationService.java  # Lõi tính toán Elo & K-factor
│   │   │           │   ├── MatchService.java           # Đồng thuận tỉ số & chốt ván đấu
│   │   │           │   ├── PostService.java            # Bài viết & Review sân
│   │   │           │   ├── LeaderboardService.java     # BXH theo sân & khu vực
│   │   │           │   └── ProfileService.java         # Hồ sơ & QR Passport
│   │   │           ├── controller/             # REST API Controllers (@RestController)
│   │   │           │   ├── RoomController.java
│   │   │           │   ├── MatchController.java
│   │   │           │   ├── PostController.java
│   │   │           │   ├── LeaderboardController.java
│   │   │           │   └── ProfileController.java
│   │   │           └── exception/              # GlobalExceptionHandler, Custom Exceptions
│   │   └── resources/
│   │       ├── application.yml                 # Cấu hình Datasource, JPA, Supabase JWKS, Server Port
│   │       └── application-prod.yml
│   └── test/                                   # Unit & Integration Tests
```

---

## 3. Cấu hình Bảo Mật & Xác thực JWT với Supabase

Client (React Web) thực hiện đăng nhập qua Supabase Auth và nhận về `access_token` (JWT). Client đính kèm token này vào Header:
`Authorization: Bearer <supabase_access_token>`.

### Cấu hình `SecurityConfig.java` (Spring Security 6 / Spring Boot 3):
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/rooms", "/api/posts", "/api/leaderboard/**", "/api/courts/**").permitAll()
                .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }
}
```

### Cấu hình `application.yml`:
```yaml
server:
  port: 8080

spring:
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
          # Supabase cung cấp JWKS endpoint chuẩn OAuth2/OIDC
          issuer-uri: https://yjcqaxszvmpnlmypxjqq.supabase.co/auth/v1
```

---

## 4. Đặc Tả Chi Tiết Các Modules Nghiệp Vụ (Business Logic)

### 4.1 Module Quản Lý Phòng Kèo (`RoomService`)

*   **Tạo phòng (Create Room):**
    *   Kiểm tra ràng buộc Host không được có 2 phòng trùng khoảng giờ `[play_time, end_time)`.
    *   **Flow A (`PUBLIC_RECRUIT`):** `is_rated = false`, cờ `visibility = PUBLIC`, mở sảnh tìm kiếm, đính kèm `zalo_group_link` nếu có.
    *   **Flow B (`PRIVATE_RATED`):** `is_rated = true`, cờ `visibility = PRIVATE`, hệ thống tự sinh mã ngẫu nhiên 6 ký tự `join_code` (ví dụ `XP-8492`).
    *   Tự động thêm Host vào `room_members` với `role = HOST`, `status = REGISTERED`.
*   **Đăng ký tham gia (Join Room):**
    *   Kiểm tra `max_slots`. Nếu còn slot -> `status = REGISTERED`. Nếu đã đầy -> `status = WAITLIST`.
    *   Nếu là Flow B, bắt buộc phải khớp `join_code`.
*   **Hủy tham gia / Rời phòng (Leave Room):**
    *   Chuyển trạng thái người rời sang `CANCELLED`.
    *   Kích hoạt giải thuật đôn Waitlist FIFO: Lấy thành viên `WAITLIST` có `registered_at` sớm nhất chuyển sang `REGISTERED`.
*   **Vòng đời phòng (Lifecycle):**
    *   Host bấm `start`: Cập nhật `status = IN_PROGRESS`, ghi nhận `started_at`.
    *   Host bấm `finish`: Cập nhật `status = COMPLETED`, ghi nhận `ended_at`.

---

### 4.2 Module Chấm Điểm & Tính Elo Đồng Thuận (`EloCalculationService` & `MatchService`)

Áp dụng cho các trận đấu thuộc Flow B (`is_rated = true`):

*   **Nhập kết quả (`createSessionMatch`):**
    *   VĐV chọn thể thức (`singles` hoặc `doubles`), VĐV bên A, VĐV bên B, tỉ số các set (dưới dạng mảng JSON).
    *   Trạng thái khởi tạo: `pending`. Người tạo trận đấu tự động được thêm vào danh sách `confirmations`.
*   **Xác nhận đối kháng (`confirmMatch`):**
    *   Thành viên phía đối thủ bấm "Đồng ý".
    *   Kiểm tra điều kiện chốt:
        - Đơn (1v1): Đủ 2/2 VĐV đã xác nhận.
        - Đôi (2v2): Đại diện cả 2 đội (hoặc 4/4 thành viên) đã xác nhận.
    *   Khi đủ điều kiện, chuyển `status = confirmed` và kích hoạt tính điểm trong `@Transactional`:
*   **Thuật toán Tính Điểm Elo:**
    1.  **Kiểm tra trần đối đầu H2H (Head-to-Head Cap):** Đếm số trận đã confirmed giữa cùng 2 đối thủ trong 24h qua. Nếu đã $\ge 2$ trận, gán `elo_delta = 0` (chuyển sang Unrated).
    2.  **Xác định hệ số K thích ứng (Dynamic K-Factor):**
        *   Nếu là bạn bè (`Friendship` tồn tại) hoặc đã từng đấu trong 30 ngày qua: $K = 8$ đến $10$.
        *   Nếu là đối thủ mới hoặc đối đầu lần đầu: $K = 16$ đến $20$.
    3.  **Công thức kỳ vọng:**
        *   $D = \text{Elo}_B - \text{Elo}_A$
        *   $E_A = 1 / (1 + 10^{D / 400})$
        *   $\Delta \text{Elo} = \text{round}(K \times (S_A - E_A))$
    4.  **Cập nhật bảng `profiles`:** Cộng điểm bên thắng, trừ điểm bên thua, tự động cập nhật lại `tier_name` (theo Taxonomy v2) và tăng `win_streak`.

---

### 4.3 Module Bản Tin Trang Chủ & Đánh Giá Sân (`PostService`)

*   **Đăng bài (`createPost`):**
    *   `match_recap`: Kéo thông tin từ `match_rooms` (số trận thắng, tổng Elo tăng) kèm ảnh chụp tại sân.
    *   `court_review`: Gắn liền với `court_id`, kèm số sao `rating` (1–5 sao) và nhận xét (thảm, đèn, điều hòa, chỗ để xe). Tự động tính lại điểm trung bình của sân trong bảng `courts`.
    *   `general`: Bài đăng chia sẻ thông thường.
*   **Tương tác:**
    *   Thả tim (`likePost`): Toggle trong bảng `post_likes`, tự động tăng/giảm `likes_count`.
    *   Bình luận (`addComment`): Lưu vào `post_comments`, tăng `comments_count`.

---

### 4.4 Module Bảng Xếp Hạng Đa Chiều (`LeaderboardService`)

*   **BXH Toàn quốc:** Sắp xếp `elo_rating` giảm dần (chỉ tính những VĐV đã hoàn tất onboarding `onboarding_step = 5`).
*   **BXH Cụm Sân Nhà (Home Court Leaderboard):** Lọc VĐV có `home_court_id = :courtId`.
*   **BXH Theo Khu Vực (Regional Leaderboard):** Lọc VĐV theo `district` (ví dụ: 'Quận 10', 'TP. Thủ Đức') hoặc `city`.

---

## 5. Danh Sách RESTful API Endpoints Đầy Đủ

| Module | Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **Rooms** | `POST` | `/api/rooms` | Authenticated | Tạo phòng mới (Flow A hoặc Flow B) |
| | `GET` | `/api/rooms` | Public / Auth | Danh sách phòng Flow A theo khu vực sân, trình độ, ngày |
| | `POST` | `/api/rooms/lookup-code` | Authenticated | Tra cứu phòng Flow B bằng `join_code` |
| | `GET` | `/api/rooms/{id}` | Authenticated | Chi tiết phòng, danh sách VĐV, danh sách chờ |
| | `POST` | `/api/rooms/{id}/join` | Authenticated | Đăng ký tham gia (kèm `join_code` nếu phòng kín) |
| | `POST` | `/api/rooms/{id}/leave` | Authenticated | Rời phòng -> Tự động đôn Waitlist FIFO |
| | `POST` | `/api/rooms/{id}/start` | Host | Bắt đầu buổi chơi (`IN_PROGRESS`) |
| | `POST` | `/api/rooms/{id}/finish` | Host | Kết thúc buổi chơi (`COMPLETED`) |
| | `POST` | `/api/rooms/{id}/cancel` | Host | Hủy phòng kèm lý do |
| **Matches** | `POST` | `/api/rooms/{roomId}/matches` | Người trong phòng | Nhập kết quả trận đấu mới (chờ xác nhận) |
| | `GET` | `/api/rooms/{roomId}/matches` | Người trong phòng | Danh sách các trận đã đấu trong buổi chơi |
| | `POST` | `/api/matches/{matchId}/confirm` | Đối thủ trận đấu | Xác nhận tỉ số -> Chốt ván & tính Elo |
| | `POST` | `/api/matches/{matchId}/dispute` | Đối thủ trận đấu | Khiếu nại kết quả sai -> Khóa điểm |
| **Posts** | `GET` | `/api/posts` | Public / Auth | Danh sách bài viết Trang chủ (phân trang) |
| | `POST` | `/api/posts` | Authenticated | Đăng bài viết (Recap, Review sân, bài thường) |
| | `POST` | `/api/posts/{id}/like` | Authenticated | Thả tim / Bỏ thả tim bài viết |
| | `GET` | `/api/posts/{id}/comments` | Public / Auth | Danh sách bình luận |
| | `POST` | `/api/posts/{id}/comments` | Authenticated | Thêm bình luận |
| **Courts** | `GET` | `/api/courts` | Public | Danh sách sân cầu lông, địa chỉ, rating |
| | `GET` | `/api/courts/{id}/reviews` | Public | Xem danh sách đánh giá của sân |
| **Rankings** | `GET` | `/api/leaderboard/global` | Public | Top VĐV toàn hệ thống |
| | `GET` | `/api/leaderboard/courts/{courtId}` | Public | Top VĐV tại sân nhà cụ thể |
| | `GET` | `/api/leaderboard/regions` | Public | Top VĐV theo Quận/Huyện/Thành phố |
| **Profiles** | `GET` | `/api/profiles/me` | Authenticated | Xem hồ sơ cá nhân và số liệu thi đấu |
| | `PUT` | `/api/profiles/me` | Authenticated | Cập nhật thông tin, sân quen, Zalo phone, FB |
| | `GET` | `/api/profiles/qr/{publicId}` | Authenticated | Quét mã QR xem thông tin người khác |
| | `POST` | `/api/friends/request` | Authenticated | Gửi lời mời kết bạn |
| | `POST` | `/api/friends/accept` | Authenticated | Chấp nhận kết bạn |

---

## 6. Hướng Dẫn Khởi Tạo Dự Án Spring Boot Trong Thư Mục `be/`

Để bắt đầu dựng backend ngay trong `be/`, ta có thể sử dụng Spring Initializr hoặc tạo cấu trúc `pom.xml` với các dependency:

```xml
<dependencies>
    <!-- Web REST API -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- JPA & Hibernate -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Spring Security & Supabase JWT Resource Server -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
    </dependency>

    <!-- Bean Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```
