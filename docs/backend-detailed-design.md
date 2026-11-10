# TÀI LIỆU THIẾT KẾ CHI TIẾT BACKEND (DETAILED DESIGN - DD)
## HỆ THỐNG SPORTXP — PHIÊN BẢN V2.1

* **Dự án:** SportXP (Badminton Social & Rating Platform)
* **Phân hệ:** Backend Service (`backend/`)
* **Công nghệ:** Java 17/21, Spring Boot 3.x, Spring Data JPA, PostgreSQL (Supabase)
* **Package Root:** `exe.sportxp.backend`
* **Mục tiêu phát hành:** Bản nghiệm thu Demo Hội đồng (10 ngày) & Pilot Test (20 người dùng thực tế)
* **Trạng thái:** DRAFT FOR IMPLEMENTATION — Tài liệu chuẩn kỹ thuật dùng trực tiếp để lập trình

---

# PHẦN 1: TỔNG QUAN HỆ THỐNG & PHẠM VI TRIỂN KHAI (SCOPE)

## 1.1 Bối cảnh & Mục tiêu mốc 10 ngày
Dự án chuẩn bị cho buổi phản biện/demo trước Hội đồng và đưa vào thử nghiệm thực tế với nhóm 20 VĐV cầu lông phong trào. Backend cần tập trung giải quyết triệt để 5 bài toán cốt lõi đã được thống nhất:
1. **Kèo đấu (Room)**: Tách bạch rõ **Flow A** (Sảnh tuyển quân vãng lai, unrated) và **Flow B** (Cáp kèo kín tính điểm Elo qua mã 6 ký tự).
2. **Trận đấu & Elo (Match & Elo Engine)**: Ghi tỉ số các set trong buổi chơi, cơ chế đồng thuận 2 chiều (2v2/1v1 consent), tính điểm Elo tự động chống cày ảo (hệ số K động, trần đối đầu H2H).
3. **Trang chủ & Cộng đồng (Feed & Reviews)**: Bản tin nhật ký sau trận (Match Recap), ảnh chụp tại sân, đánh giá/review chất lượng cụm sân (1–5 sao).
4. **Bảng xếp hạng (Rankings)**: Toàn quốc, cụm sân nhà (`home_court_id`) và khu vực (`district`).
5. **Hồ sơ VĐV (Profile)**: Hộ chiếu QR, thông tin liên hệ Zalo/Facebook.

> **Hạng mục đưa vào Roadmap dài hạn (5–6 tháng sau):**
> * Phân hệ Giải đấu tự động chia nhánh/bốc thăm (Tournaments Engine).
> * Ví trung gian thanh toán/Escrow cọc tiền sân (tránh rủi ro pháp lý ban đầu).
> * Realtime WebSocket Notification (giai đoạn 1 dùng cơ chế Polling / RESTful query).

---

# PHẦN 2: THIẾT KẾ HẠ TẦNG DÙNG CHUNG (MODULE `core`)

```
exe.sportxp.backend.core/
├── config/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   └── JpaAuditingConfig.java
├── security/
│   ├── JwtAuthFilter.java
│   ├── UserPrincipal.java
│   └── SecurityUtils.java
├── exception/
│   ├── BusinessException.java
│   ├── ErrorCode.java
│   └── GlobalExceptionHandler.java
├── dto/
│   ├── ApiResponse.java
│   └── ErrorResponse.java
└── util/
    ├── CodeGenerator.java
    └── EloMathUtils.java
```

## 2.1 Cơ chế Xác thực & Ngữ cảnh Người dùng (Security Context)

Client đăng nhập qua Supabase Auth và gửi Bearer Token qua header HTTP:
`Authorization: Bearer <supabase_jwt_access_token>`.

### Quy tắc xử lý Token (`JwtAuthFilter`):
1. Đọc header `Authorization`. Nếu không có hoặc không bắt đầu bằng `Bearer `, bỏ qua filter (để các endpoint công khai đi qua).
2. Giải mã JWT bằng Supabase JWT Secret hoặc qua endpoint JWKS `https://yjcqaxszvmpnlmypxjqq.supabase.co/auth/v1/.well-known/jwks.json`.
3. Trích xuất claim:
   * `sub` (UUID): Đây chính là `user_id` trong bảng `profiles` và `auth.users`.
   * `email`: Email người dùng.
4. Đóng gói thành đối tượng `UserPrincipal`:
   ```java
   public record UserPrincipal(
       UUID id,
       String email,
       Collection<? extends GrantedAuthority> authorities
   ) implements Principal {}
   ```
5. Đặt vào `SecurityContextHolder.getContext().setAuthentication(...)`.
6. Helper `SecurityUtils.getCurrentUserId()`:
   * Nếu có authentication: trả về `UUID`.
   * Nếu không có authentication (hoặc anonymous): ném `BusinessException(ErrorCode.UNAUTHORIZED)`.

## 2.2 Chuẩn hóa Định dạng Payload Phản hồi (API Envelope)

Mọi API trả về đều tuân thủ 2 cấu trúc chuẩn:

### Thành công (`ApiResponse<T>`):
```json
{
  "success": true,
  "data": { ... },
  "message": "Thao tác thành công",
  "timestamp": "2026-10-31T15:30:00Z"
}
```

### Thất bại (`ErrorResponse`):
```json
{
  "success": false,
  "errorCode": "ROOM_FULL",
  "message": "Phòng đã đủ số lượng người tham gia chính thức",
  "details": [],
  "timestamp": "2026-10-31T15:30:00Z"
}
```

## 2.3 Bảng Mã Lỗi Hệ Thống (`ErrorCode`)

| Mã Lỗi (`errorCode`) | HTTP Status | Thông Điệp Mặc Định |
| :--- | :--- | :--- |
| `UNAUTHORIZED` | 401 | Phiên đăng nhập không hợp lệ hoặc đã hết hạn |
| `FORBIDDEN` | 403 | Bạn không có quyền thực hiện thao tác này |
| `RESOURCE_NOT_FOUND` | 404 | Không tìm thấy tài nguyên yêu cầu |
| `SCHEDULE_CONFLICT` | 409 | Host hoặc VĐV đã có lịch thi đấu trùng khung giờ này |
| `ROOM_FULL` | 409 | Phòng đã đủ chỗ, hệ thống đã chuyển bạn vào danh sách chờ |
| `INVALID_JOIN_CODE` | 400 | Mã phòng không chính xác hoặc phòng không tồn tại |
| `NOT_ROOM_MEMBER` | 403 | Bạn chưa phải là thành viên chính thức của buổi chơi này |
| `ALREADY_REGISTERED`| 400 | Bạn đã đăng ký tham gia buổi chơi này trước đó |
| `MATCH_ALREADY_CONFIRMED` | 400 | Trận đấu này đã được xác nhận kết quả trước đó |
| `H2H_LIMIT_EXCEEDED`| 200 (Warning) | Đã vượt trần 2 trận đối đầu/ngày, trận đấu chuyển sang Unrated |
| `INTERNAL_ERROR` | 500 | Đã có lỗi xảy ra trong quá trình xử lý hệ thống |

---

# PHẦN 3: THIẾT KẾ CHI TIẾT MODULE KÈO ĐẤU (`room`)

Module quản lý toàn bộ vòng đời của một buổi chơi, phân luồng Flow A & B, quản lý slot và tự động đôn danh sách chờ (Waitlist FIFO).

```
exe.sportxp.backend.room/
├── controller/
│   └── RoomController.java
├── service/
│   ├── RoomService.java
│   └── impl/RoomServiceImpl.java
├── repository/
│   ├── MatchRoomRepository.java
│   └── RoomMemberRepository.java
├── domain/
│   ├── MatchRoom.java
│   ├── RoomMember.java
│   ├── RoomMemberId.java
│   ├── RoomType.java         (Enum: PUBLIC_RECRUIT, PRIVATE_RATED)
│   ├── RoomStatus.java       (Enum: DRAFT, OPEN, FULL, IN_PROGRESS, COMPLETED, CANCELLED)
│   └── MemberStatus.java     (Enum: REGISTERED, WAITLIST, RECONFIRM, CANCELLED)
└── dto/
    ├── request/
    │   ├── CreateRoomRequest.java
    │   └── LookupCodeRequest.java
    └── response/
        ├── RoomSummaryResponse.java
        ├── RoomDetailResponse.java
        └── MemberDto.java
```

## 3.1 Thiết kế Thực thể Dữ liệu (Entity Mapping)

### Thực thể `MatchRoom` (`@Table(name = "match_rooms")`):
* `id` (`UUID`, Primary Key, auto-gen)
* `courtId` (`UUID`, `@NotNull`): Khóa ngoại sang `courts(id)`
* `hostId` (`UUID`, `@NotNull`): Khóa ngoại sang `profiles(id)`
* `title` (`String`, 100 chars): Tên kèo
* `roomType` (`@Enumerated(EnumType.STRING)`): `PUBLIC_RECRUIT` hoặc `PRIVATE_RATED`
* `visibility` (`String`): `'PUBLIC'` hoặc `'PRIVATE'`
* `targetGender` (`String`): `'all'`, `'male'`, `'female'` *(MỚI - v2.3)*
* `joinCode` (`String`, nullable): Mã 6 ký tự ngẫu nhiên (chỉ có khi `roomType = PRIVATE_RATED`)
* `isRated` (`boolean`): `true` nếu là phòng tính Elo, `false` nếu unrated
* `zaloGroupLink` (`String`, nullable): Đường link nhóm Zalo buổi chơi
* `playTime` (`Instant` / `OffsetDateTime`): Thời điểm bắt đầu chơi (UTC)
* `endTime` (`Instant` / `OffsetDateTime`): Thời điểm kết thúc dự kiến (UTC)
* `maxSlots` (`int`, `@Min(2)`, `@Max(16)`): Số lượng người tối đa
* `feePerPerson` (`int`, `@Min(0)`): Tiền sân dự kiến chia đầu người
* `minElo` (`int`, mặc định 300) & `maxElo` (`int`, mặc định 1600): Khoảng trình độ
* `status` (`@Enumerated(EnumType.STRING)`): Mặc định `OPEN`
* `hostPlays` (`boolean`, mặc định `true`): Host có tham gia chơi không
* `notes` (`String`, max 500 chars) & `courtLabel` (`String`, max 50 chars)
* `cancellationReason` (`String`, nullable)
* `scheduleRevision` (`int`, mặc định 1)
* `startedAt` & `endedAt` (`Instant`, nullable)

### Thực thể `RoomMember` (`@Table(name = "room_members")`):
* Khóa chính phức hợp `@EmbeddedId RoomMemberId`:
  * `roomId` (`UUID`)
  * `userId` (`UUID`)
* `role` (`String`): `'HOST'` hoặc `'PLAYER'`
* `status` (`@Enumerated(EnumType.STRING)`): `REGISTERED`, `WAITLIST`, `RECONFIRM`, `CANCELLED`
* `isPlaying` (`boolean`, mặc định `true`)
* `confirmedRevision` (`int`, mặc định 1)
* `registeredAt` (`Instant`, mặc định `Instant.now()`)

---

## 3.2 Quy trình Nghiệp vụ Chi tiết (Algorithms & Sequence)

### Quy trình 1: Tạo Kèo Mới (`POST /api/rooms`)
1. **Kiểm tra quyền & dữ liệu đầu vào:**
   * Xác thực `userId = SecurityUtils.getCurrentUserId()`.
   * Kiểm tra thời gian: `playTime` phải ở tương lai, `endTime` phải sau `playTime` ít nhất 30 phút.
2. **Kiểm tra trùng lịch (Schedule Conflict):**
   * Truy vấn các phòng do user này làm Host hoặc làm Member đang ở trạng thái `OPEN`, `FULL`, `IN_PROGRESS`.
   * Nếu có bất kỳ phòng nào có khoảng thời gian giao cắt `(start_A < end_B) AND (end_A > start_B)`, ném `BusinessException(ErrorCode.SCHEDULE_CONFLICT)`.
3. **Phân luồng Flow A vs Flow B:**
   * Nếu `request.roomType() == RoomType.PUBLIC_RECRUIT`:
     * Gán `isRated = false`, `visibility = "PUBLIC"`, `joinCode = null`.
   * Nếu `request.roomType() == RoomType.PRIVATE_RATED`:
     * Gán `isRated = true`, `visibility = "PRIVATE"`.
     * Sinh mã ngẫu nhiên 6 ký tự duy nhất bằng `CodeGenerator.generateRoomCode()` (ví dụ: `XP-8492`). Kiểm tra lặp mã trước khi lưu.
4. **Lưu phòng và gán Host:**
   * Trong `@Transactional`:
     * Lưu bản ghi `MatchRoom`.
     * Tạo bản ghi `RoomMember` cho Host với `role = 'HOST'`, `status = 'REGISTERED'`.
     * Trả về thông tin chi tiết phòng kèm mã `joinCode` (nếu là phòng kín).

---

### Quy trình 2: Tham gia Kèo & Cơ chế Danh sách Chờ (`POST /api/rooms/{id}/join`)
1. Lấy thông tin phòng qua `roomId`. Nếu không tồn tại: ném `RESOURCE_NOT_FOUND`.
2. Kiểm tra trạng thái phòng: chỉ cho phép đăng ký khi `status` là `OPEN` hoặc `FULL`. Nếu `IN_PROGRESS`, `COMPLETED`, `CANCELLED`: ném lỗi không thể đăng ký.
3. Nếu là phòng `PRIVATE_RATED`: Bắt buộc request body phải chứa `joinCode` khớp với `match_rooms.join_code`. Nếu sai: ném `INVALID_JOIN_CODE`.
4. Kiểm tra user đã có bản ghi trong `room_members` chưa:
   * Nếu đã có và `status IN ('REGISTERED', 'WAITLIST')`: ném `ALREADY_REGISTERED`.
   * Nếu từng bị `CANCELLED`: được phép tái đăng ký.
5. **Kiểm tra sức chứa (Capacity Check & Waitlist FIFO):**
   * Đếm số lượng thành viên hiện có `status = 'REGISTERED'`.
   * Nếu `registeredCount < maxSlots`:
     * Lưu bản ghi `RoomMember` với `status = 'REGISTERED'`.
     * Nếu sau khi thêm `registeredCount + 1 == maxSlots`: Tự động cập nhật `match_rooms.status = 'FULL'`.
   * Nếu `registeredCount >= maxSlots`:
     * Lưu bản ghi `RoomMember` với `status = 'WAITLIST'`.
     * Thông báo cho người dùng: *"Phòng đã đủ slot, bạn được đưa vào danh sách chờ vị trí số X"*.

---

### Quy trình 3: Rời Kèo & Tự động Đôn Waitlist (`POST /api/rooms/{id}/leave`)
1. Kiểm tra user có trong phòng với `status = 'REGISTERED'` hoặc `'WAITLIST'` không.
2. Nếu là `HOST`: Không được dùng API `leave`, yêu cầu Host dùng API `cancel` để hủy cả buổi.
3. Trong `@Transactional`:
   * Chuyển trạng thái của user sang `CANCELLED`.
   * **Thuật toán Đôn Danh sách Chờ (FIFO Promotion):**
     * Tìm thành viên có `status = 'WAITLIST'` có thời gian `registeredAt` sớm nhất (`ORDER BY registeredAt ASC LIMIT 1`).
     * Nếu tìm thấy:
       * Cập nhật thành viên đó thành `status = 'REGISTERED'`.
       * Phòng vẫn giữ trạng thái `FULL` (hoặc `OPEN` nếu không còn ai trong waitlist).
     * Nếu không có ai trong danh sách chờ:
       * Cập nhật `match_rooms.status = 'OPEN'`.

---

### Quy trình 4: Bắt đầu & Kết thúc Buổi chơi
* **Bắt đầu (`POST /api/rooms/{id}/start`):**
  * Chỉ Host được gọi (`auth.uid == hostId`).
  * Trạng thái phòng phải là `OPEN` hoặc `FULL`. Số VĐV `REGISTERED` phải $\ge 2$.
  * Cập nhật `status = 'IN_PROGRESS'`, `startedAt = Instant.now()`.
* **Kết thúc (`POST /api/rooms/{id}/finish`):**
  * Chỉ Host được gọi.
  * Cập nhật `status = 'COMPLETED'`, `endedAt = Instant.now()`.

---

## 3.3 Chi tiết Hợp đồng REST API Module Kèo Đấu

### API 1: Tạo phòng mới
* **Endpoint:** `POST /api/rooms`
* **Quyền:** Authenticated
* **Request Body:**
  ```json
  {
    "courtId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Kèo giao lưu cuối tuần sân Kỳ Hòa",
    "roomType": "PUBLIC_RECRUIT", 
    "playTime": "2026-11-05T18:00:00Z",
    "endTime": "2026-11-05T20:00:00Z",
    "maxSlots": 4,
    "feePerPerson": 40000,
    "minElo": 700,
    "maxElo": 950,
    "hostPlays": true,
    "notes": "Sân có máy lạnh, mang theo nước cá nhân",
    "courtLabel": "Sân số 2",
    "zaloGroupLink": "https://zalo.me/g/abcdef123"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "id": "7b2c9a12-8812-4211-9a11-123456789abc",
      "title": "Kèo giao lưu cuối tuần sân Kỳ Hòa",
      "roomType": "PUBLIC_RECRUIT",
      "joinCode": null,
      "status": "OPEN",
      "registeredSlots": 1,
      "maxSlots": 4
    }
  }
  ```

### API 2: Tra cứu phòng kín bằng mã 6 ký tự
* **Endpoint:** `POST /api/rooms/lookup-code`
* **Quyền:** Authenticated
* **Request Body:**
  ```json
  {
    "joinCode": "XP-8492"
  }
  ```
* **Response (200 OK):** Trả về bản tóm tắt phòng (Tên sân, giờ đấu, số chỗ còn trống, Host) để người dùng xem trước khi quyết định bấm Join.

---

# PHẦN 4: THIẾT KẾ CHI TIẾT MODULE TRẬN ĐẤU & BỘ MÁY ELO (`match`)

Chuyên trách ghi nhận tỉ số các set trong buổi chơi, cơ chế đồng thuận 2 chiều (Mutual Consent) và tính điểm Elo tự động.

```
exe.sportxp.backend.match/
├── controller/
│   └── MatchController.java
├── service/
│   ├── MatchService.java
│   ├── EloEngine.java
│   └── impl/
│       ├── MatchServiceImpl.java
│       └── EloEngineImpl.java
├── repository/
│   └── SessionMatchRepository.java
├── domain/
│   ├── SessionMatch.java
│   ├── MatchType.java        (Enum: singles, doubles)
│   └── MatchStatus.java      (Enum: draft, pending, confirmed, disputed, void)
└── dto/
    ├── request/
    │   ├── SubmitScoreRequest.java
    │   └── DisputeMatchRequest.java
    └── response/
        ├── MatchResultResponse.java
        └── SetScoreDto.java
```

## 4.1 Thiết kế Thực thể Dữ liệu `SessionMatch` (`session_matches`)

* `id` (`UUID`, Primary Key)
* `roomId` (`UUID`, `@NotNull`): Khóa ngoại sang `match_rooms(id)`
* `matchType` (`MatchType`): `singles` hoặc `doubles`
* `teamAPlayerIds` (`List<UUID>`): Danh sách VĐV bên A (1 người nếu đơn, 2 nếu đôi)
* `teamBPlayerIds` (`List<UUID>`): Danh sách VĐV bên B
* `scores` (`String` / `jsonb`): Tỉ số các set, cấu trúc:
  ```json
  [
    {"set": 1, "a": 21, "b": 19},
    {"set": 2, "a": 18, "b": 21},
    {"set": 3, "a": 21, "b": 17}
  ]
  ```
* `winnerTeam` (`String`): `'A'` hoặc `'B'`
* `status` (`MatchStatus`): `pending`, `confirmed`, `disputed`, `void`
* `confirmations` (`List<UUID>`): Mảng danh sách các `user_id` đã bấm xác nhận
* `kFactor` (`int`, mặc định 16)
* `eloDelta` (`int`, mặc định 0)
* `createdBy` (`UUID`): VĐV khởi tạo bản ghi tỉ số

---

## 4.2 Cơ chế Đồng thuận Kết quả (Mutual Consent Workflow)

1. **Ghi kết quả trận đấu (`POST /api/rooms/{roomId}/matches`):**
   * Người chơi trong phòng nhập tỉ số.
   * Server kiểm tra: Tất cả VĐV trong `teamAPlayerIds` và `teamBPlayerIds` phải là thành viên `REGISTERED` của phòng.
   * Khởi tạo bản ghi với `status = 'pending'`.
   * Người tạo trận đấu được tự động thêm vào danh sách `confirmations`.
2. **Xác nhận đối kháng (`POST /api/matches/{id}/confirm`):**
   * User gọi API phải là người thuộc danh sách thi đấu của trận (`teamAPlayerIds` hoặc `teamBPlayerIds`).
   * Nếu user đã có trong `confirmations`: Bỏ qua (idempotent).
   * Thêm `userId` vào `confirmations`.
   * **Kiểm tra Điều kiện Chốt Kết quả:**
     * **Đánh Đơn (1v1):** Khi cả 2 VĐV đều có trong `confirmations` (2/2).
     * **Đánh Đôi (2v2):** Khi có ít nhất 1 đại diện bên A **VÀ** 1 đại diện bên B có trong `confirmations` (hoặc cả 4 người).
   * Khi đạt đủ điều kiện: Chuyển `status = 'confirmed'` và **gọi trực tiếp `EloEngine.settleMatch(matchId)`**.
3. **Khiếu nại Tỉ số (`POST /api/matches/{id}/dispute`):**
   * Nếu có thành viên không đồng ý với tỉ số: Chuyển `status = 'disputed'`.
   * Hệ thống khóa bản ghi, không cộng trừ điểm cho bất kỳ ai cho đến khi hai bên thỏa thuận lại.

---

## 4.3 Đặc Tả Thuật Toán Bộ Máy Elo (`EloEngine`)

Khi trận đấu chuyển sang `confirmed`, nếu phòng có `is_rated == true`, phương thức `settleMatch(match)` được kích hoạt trong `@Transactional`:

### Bước 1: Kiểm tra Trần đối đầu trong ngày (Head-to-Head Cap)
Đếm số trận đấu đã `confirmed` giữa 2 đối thủ (hoặc 2 cặp VĐV) trong vòng 24 giờ qua:
* Nếu số trận $\ge 2$: Trận đấu này chuyển sang tính chất giao lưu, gán `kFactor = 0`, `eloDelta = 0`. Thông báo: *"Đã đạt giới hạn 2 trận tính điểm/ngày giữa 2 đối thủ, trận đấu không làm thay đổi Elo"*.
* Nếu số trận $< 2$: Tiếp tục Bước 2.

### Bước 2: Xác định Hệ số K Động (Dynamic K-Factor)
* Kiểm tra lịch sử quan hệ giữa 2 bên:
  * Nếu hai bên đã kết bạn (`Friendship.status == 'accepted'`) HOẶC đã từng thi đấu cùng nhau trong 30 ngày qua: Gán $K = 10$ (giảm biên độ dao động, triệt tiêu động cơ cày điểm chéo).
  * Nếu là đối thủ mới hoàn toàn: Gán $K = 20$.

### Bước 3: Tính toán Điểm Biến Động (Elo Delta)
1. Tính Elo trung bình của mỗi đội:
   * Đánh đơn: $\text{Elo}_A = \text{Elo}_{A1}$, $\text{Elo}_B = \text{Elo}_{B1}$.
   * Đánh đôi: $\text{Elo}_A = (\text{Elo}_{A1} + \text{Elo}_{A2}) / 2$, $\text{Elo}_B = (\text{Elo}_{B1} + \text{Elo}_{B2}) / 2$.
2. Hiệu số điểm: $D = \text{Elo}_B - \text{Elo}_A$.
3. Xác suất thắng kỳ vọng của bên A:
   ```
   E_A = 1.0 / (1.0 + Math.pow(10, D / 400.0))
   ```
4. Kết quả thực tế $S_A$: Thắng = 1.0, Thua = 0.0.
5. Biến động điểm:
   ```
   eloDelta = (int) Math.round(K * (S_A - E_A))
   ```

### Bước 4: Cập nhật Profile VĐV
* Bên thắng: $\text{Elo mới} = \text{Elo cũ} + \text{eloDelta}$; tăng `win_streak` thêm 1.
* Bên thua: $\text{Elo mới} = \max(300, \text{Elo cũ} - \text{eloDelta})$; reset `win_streak = 0`.
* Tra cứu lại tên hạng `tier_name` mới theo Taxonomy v2 (ví dụ: 750 -> "TB", 800 -> "TB+").
* Ghi nhận `eloDelta` và `kFactor` vào bản ghi `session_matches`.

---

# PHẦN 5: THIẾT KẾ CHI TIẾT MODULE BẢN TIN TRANG CHỦ (`post`)

Giải quyết yêu cầu của Thầy về việc đưa tính năng bài viết, nhật ký trận đấu (Strava for Badminton) và review sân trở lại Trang chủ để giữ chân cộng đồng.

```
exe.sportxp.backend.post/
├── controller/
│   └── PostController.java
├── service/
│   ├── PostService.java
│   └── impl/PostServiceImpl.java
├── repository/
│   ├── PostRepository.java
│   ├── PostLikeRepository.java
│   └── PostCommentRepository.java
├── domain/
│   ├── Post.java
│   ├── PostLike.java
│   ├── PostComment.java
│   └── PostType.java         (Enum: general, match_recap, court_review)
└── dto/
    ├── request/
    │   ├── CreatePostRequest.java
    │   └── AddCommentRequest.java
    └── response/
        ├── PostResponse.java
        └── CommentResponse.java
```

## 5.1 Quy chuẩn 3 Loại Bài Đăng (`PostType`)
1. **`match_recap` (Nhật ký sau trận):**
   * Bắt buộc có `roomId`.
   * Backend tự động query số ván thắng/thua và số điểm Elo biến động của tác giả trong buổi chơi đó để hiển thị kèm bài viết.
   * Đính kèm 1–4 URL ảnh chụp tại sân (`media_urls`).
2. **`court_review` (Đánh giá sân cầu lông):**
   * Bắt buộc có `courtId` và `rating` (từ 1 đến 5 sao).
   * Khi tạo bài review, kích hoạt hàm cập nhật điểm trung bình của Sân:
     ```
     new_rating = ((old_rating * old_count) + rating) / (old_count + 1)
     new_count = old_count + 1
     ```
3. **`general` (Bài viết tự do):** Tâm sự, chia sẻ mẹo vặt, tìm nhóm giao lưu.

## 5.2 Hợp đồng REST API Bản Tin

### API: Đăng bài viết mới
* **Endpoint:** `POST /api/posts`
* **Quyền:** Authenticated
* **Request Body (Mẫu Review Sân):**
  ```json
  {
    "courtId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "postType": "court_review",
    "content": "Sân Kỳ Hòa mới làm lại thảm rất êm, trần cao không bị bí, bãi đỗ xe rộng rãi.",
    "rating": 5,
    "mediaUrls": [
      "https://yjcqaxszvmpnlmypxjqq.supabase.co/storage/v1/object/public/posts/img1.jpg"
    ]
  }
  ```

---

# PHẦN 6: THIẾT KẾ CHI TIẾT MODULE BẢNG XẾP HẠNG (`ranking`)

Cung cấp 3 góc nhìn xếp hạng giúp kích thích sự cạnh tranh phong trào lành mạnh.

```
exe.sportxp.backend.ranking/
├── controller/
│   └── LeaderboardController.java
├── service/
│   ├── LeaderboardService.java
│   └── impl/LeaderboardServiceImpl.java
└── dto/
    └── response/
        ├── LeaderboardResponse.java
        └── RankedPlayerDto.java
```

## 6.1 Danh mục API Xếp hạng

### 1. Bảng xếp hạng Toàn quốc (`GET /api/leaderboard/global`)
* Query: Lấy Top 100 profiles có `onboarding_step = 5` sắp xếp theo `elo_rating DESC, win_streak DESC`.

### 2. Bảng xếp hạng Cụm Sân Nhà (`GET /api/leaderboard/courts/{courtId}`)
* Query: Lọc các VĐV có `home_court_id = :courtId` sắp xếp theo `elo_rating DESC`.
* Tác dụng: Tìm ra "Vua sân Kỳ Hòa", "Vua sân Đào Duy Anh".

### 3. Bảng xếp hạng Theo Khu Vực (`GET /api/leaderboard/regions?district=Quận 10`)
* Query: Lọc theo `district` hoặc `area_code`.

---

# PHẦN 7: MA TRẬN TEST & TIÊU CHÍ NGHIỆM THU (CHO MỐC 10 NGÀY)

Bộ kịch bản kiểm thử tích hợp (End-to-End) dành cho nhóm 20 VĐV thử nghiệm:

| STT | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi | Trạng Thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Tạo phòng công khai (Flow A) | `roomType = PUBLIC_RECRUIT` | Phòng tạo thành công, `isRated = false`, hiện trên sảnh tìm kiếm | Pass / Chờ test |
| **TC-02** | Tạo phòng kín tính điểm (Flow B) | `roomType = PRIVATE_RATED` | Sinh mã `joinCode` 6 ký tự, `isRated = true`, ẩn khỏi sảnh | Pass / Chờ test |
| **TC-03** | Vào phòng kín bằng mã | Nhập đúng mã 6 ký tự | Trả về preview phòng và cho phép đăng ký | Pass / Chờ test |
| **TC-04** | Đăng ký khi phòng đã đầy (Waitlist) | Đăng ký thứ 5 vào phòng 4 slot | `RoomMember` có `status = 'WAITLIST'`, vị trí số 1 | Pass / Chờ test |
| **TC-05** | Thành viên chính thức rời phòng | Thành viên slot 2 bấm Hủy | Người ở Waitlist tự động nhảy lên `REGISTERED` (FIFO) | Pass / Chờ test |
| **TC-06** | Nhập điểm và Đồng thuận Đánh Đôi | 2 đội xác nhận tỉ số 21-19 | Đủ 2 bên xác nhận -> Chuyển `confirmed` -> Kích hoạt Elo | Pass / Chờ test |
| **TC-07** | Chống cày điểm quá 2 trận/ngày | Đấu trận thứ 3 giữa cùng 2 người | Hệ thống phát hiện H2H $\ge 2$, gán `eloDelta = 0` (Unrated) | Pass / Chờ test |
| **TC-08** | Đăng bài Review sân cầu lông | Đánh giá 4 sao kèm ảnh | Bài đăng xuất hiện trên Trang chủ, sân tăng `review_count` | Pass / Chờ test |
| **TC-09** | Xem BXH theo Cụm sân nhà | Chọn Sân Kỳ Hòa | Hiển thị danh sách Top vợt thủ gắn bó với sân này | Pass / Chờ test |

